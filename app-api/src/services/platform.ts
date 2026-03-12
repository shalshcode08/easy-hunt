import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { platformConnections, users } from "@/db/schema";
import { encrypt, decrypt } from "@/lib/crypto";
import {
  createLoginSession,
  pollSessionCookies,
  extractAndTerminate,
  cookieExpiry,
  type SerializedCookie,
} from "@/services/browserbase";
import { getBoss } from "@/queue/pgboss";
import { QUEUE_NAMES, type ScrapeClusterJobData } from "@/queue/queues";
import { createError } from "@/middleware/errorHandler";
import type { JobSource } from "@/scrapers/base";

export const onboardSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).optional(),
  preferredRole: z.string().min(1),
  preferredCity: z.string().min(1),
  preferredExperienceLevel: z
    .enum(["internship", "entry", "mid", "senior", "lead", "manager", "director", "executive"])
    .optional(),
});

export type OnboardBody = z.infer<typeof onboardSchema>;

export const PlatformService = {
  async upsertUser(clerkId: string, data: OnboardBody): Promise<void> {
    await db
      .insert(users)
      .values({
        clerkId,
        email: data.email,
        displayName: data.displayName,
        preferredRole: data.preferredRole,
        preferredCity: data.preferredCity,
        preferredExperienceLevel: data.preferredExperienceLevel,
        onboardingComplete: true,
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          displayName: data.displayName,
          preferredRole: data.preferredRole,
          preferredCity: data.preferredCity,
          preferredExperienceLevel: data.preferredExperienceLevel,
          onboardingComplete: true,
          updatedAt: new Date(),
        },
      });
  },

  async getUser(clerkId: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId));
    return user ?? null;
  },

  async initConnect(
    clerkId: string,
    platform: JobSource,
  ): Promise<{ sessionId: string; liveViewUrl: string }> {
    const { sessionId, liveViewUrl } = await createLoginSession(platform);

    await db
      .insert(platformConnections)
      .values({
        clerkId,
        platform,
        status: "pending",
        browserbaseSessionId: sessionId,
      })
      .onConflictDoUpdate({
        target: [platformConnections.clerkId, platformConnections.platform],
        set: {
          status: "pending",
          browserbaseSessionId: sessionId,
          encryptedCookies: null,
          cookiesIv: null,
          cookiesTag: null,
          cookiesObtainedAt: null,
          updatedAt: new Date(),
        },
      });

    return { sessionId, liveViewUrl };
  },

  async pollConnection(sessionId: string, platform: JobSource): Promise<boolean> {
    return pollSessionCookies(sessionId, platform);
  },

  async saveConnection(
    clerkId: string,
    sessionId: string,
    platform: JobSource,
  ): Promise<void> {
    const [conn] = await db
      .select()
      .from(platformConnections)
      .where(
        and(
          eq(platformConnections.clerkId, clerkId),
          eq(platformConnections.platform, platform),
          eq(platformConnections.browserbaseSessionId, sessionId),
        ),
      );

    if (!conn) throw createError("Connection not found", 404, "NOT_FOUND");
    if (conn.status === "active") return; // already saved, idempotent

    // Try to extract cookies from the Browserbase session (may be empty if user logged in elsewhere)
    let cookieFields: Record<string, unknown> = {};
    try {
      const cookies = await extractAndTerminate(sessionId, platform);
      const payload = encrypt(JSON.stringify(cookies));
      cookieFields = {
        encryptedCookies: payload.data,
        cookiesIv: payload.iv,
        cookiesTag: payload.tag,
        cookiesObtainedAt: new Date(),
        cookiesExpiresAt: cookieExpiry(platform),
      };
    } catch {
      // No auth cookies in Browserbase session — connection still saved, falls back to anonymous scraping
    }

    await db
      .update(platformConnections)
      .set({
        status: "active",
        ...cookieFields,
        browserbaseSessionId: null,
        updatedAt: new Date(),
      })
      .where(eq(platformConnections.id, conn.id));

    await PlatformService.queueImmediateScrape(clerkId, platform);
  },

  async getConnections(clerkId: string) {
    return db
      .select({
        platform: platformConnections.platform,
        status: platformConnections.status,
        cookiesExpiresAt: platformConnections.cookiesExpiresAt,
        lastScrapedAt: platformConnections.lastScrapedAt,
        scrapeCount: platformConnections.scrapeCount,
        connectedAt: platformConnections.cookiesObtainedAt,
      })
      .from(platformConnections)
      .where(eq(platformConnections.clerkId, clerkId));
  },

  async disconnect(clerkId: string, platform: JobSource): Promise<void> {
    await db
      .update(platformConnections)
      .set({
        status: "error",
        encryptedCookies: null,
        cookiesIv: null,
        cookiesTag: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(platformConnections.clerkId, clerkId),
          eq(platformConnections.platform, platform),
        ),
      );
  },

  async getDecryptedCookies(
    clerkId: string,
    platform: JobSource,
  ): Promise<SerializedCookie[] | null> {
    const [conn] = await db
      .select()
      .from(platformConnections)
      .where(
        and(
          eq(platformConnections.clerkId, clerkId),
          eq(platformConnections.platform, platform),
          eq(platformConnections.status, "active"),
        ),
      );

    if (!conn?.encryptedCookies || !conn.cookiesIv || !conn.cookiesTag) return null;

    const plain = decrypt({
      data: conn.encryptedCookies,
      iv: conn.cookiesIv,
      tag: conn.cookiesTag,
    });
    return JSON.parse(plain) as SerializedCookie[];
  },

  async markExpired(clerkId: string, platform: JobSource): Promise<void> {
    await db
      .update(platformConnections)
      .set({ status: "expired", updatedAt: new Date() })
      .where(
        and(
          eq(platformConnections.clerkId, clerkId),
          eq(platformConnections.platform, platform),
        ),
      );
  },

  async recordScrape(connectionIds: string[]): Promise<void> {
    for (const id of connectionIds) {
      await db
        .update(platformConnections)
        .set({ lastScrapedAt: new Date(), scrapeCount: sql`scrape_count + 1`, updatedAt: new Date() })
        .where(eq(platformConnections.id, id));
    }
  },

  async queueImmediateScrape(clerkId: string, platform: JobSource): Promise<void> {
    const user = await PlatformService.getUser(clerkId);
    const role = user?.preferredRole ?? "software engineer";
    const city = user?.preferredCity ?? "india";

    const data: ScrapeClusterJobData = {
      platform,
      clerkIds: [clerkId],
      cookieSourceClerkId: clerkId,
      role,
      city,
      limit: 50,
    };

    await getBoss().send(QUEUE_NAMES.SCRAPE_CLUSTER, data, { priority: 2 });
  },
};

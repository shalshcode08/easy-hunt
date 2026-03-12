import type { PgBoss } from "pg-boss";
import { db } from "@/db/client";
import { userJobFeed } from "@/db/schema";
import { logger } from "@/lib/logger";
import { QUEUE_NAMES, type ScrapeJobData, type ScrapeClusterJobData } from "@/queue/queues";
import { hashUrl, upsertJobs } from "@/lib/dedup";
import { parseLocation } from "@/lib/location";
import { PlatformService } from "@/services/platform";
import { LinkedInScraper } from "@/scrapers/linkedin";
import { NaukriScraper } from "@/scrapers/naukri";
import { IndeedScraper } from "@/scrapers/indeed";
import type { BaseScraper } from "@/scrapers/base";
import type { NewJob } from "@/db/schema";
import type { Cookie } from "playwright";

const scrapers: Record<string, BaseScraper> = {
  linkedin: new LinkedInScraper(),
  naukri:   new NaukriScraper(),
  indeed:   new IndeedScraper(),
};

function toNewJobs(rawJobs: Awaited<ReturnType<BaseScraper["scrape"]>>, source: string): NewJob[] {
  return rawJobs.map((raw) => {
    const { city, workMode, isRemote } = parseLocation(raw.location);
    return {
      url: raw.url,
      urlHash: hashUrl(raw.url),
      title: raw.title,
      titleNormalized: raw.title.toLowerCase().trim(),
      company: raw.company,
      companyNormalized: raw.company.toLowerCase().trim(),
      source: source as NewJob["source"],
      locationRaw: raw.location,
      city,
      workMode,
      isRemote,
      salaryRaw: raw.salary ?? null,
      description: raw.description ?? null,
      postedAt: raw.postedAt ?? null,
    };
  });
}

export const registerWorkers = async (boss: PgBoss): Promise<void> => {
  await boss.createQueue(QUEUE_NAMES.SCRAPE);
  await boss.createQueue(QUEUE_NAMES.SCRAPE_CLUSTER);

  // ── Anonymous scrape (legacy / admin-triggered) ───────────────────────────
  boss.work<ScrapeJobData>(QUEUE_NAMES.SCRAPE, { localConcurrency: 2 }, async (jobs) => {
    for (const job of jobs) {
      const { source, role, location, limit } = job.data;
      const start = Date.now();
      logger.info({ source, role, location, limit }, "anonymous scrape started");

      try {
        const scraper = scrapers[source];
        if (!scraper) throw new Error(`unknown source: ${source}`);

        const rawJobs = await scraper.scrape({ role, location, limit });
        const { inserted, updated } = await upsertJobs(toNewJobs(rawJobs, source));
        logger.info({ source, inserted, updated, ms: Date.now() - start }, "anonymous scrape done");
      } catch (err) {
        logger.error({ source, err, ms: Date.now() - start }, "anonymous scrape failed");
        throw err;
      }
    }
  });

  // ── Authenticated cluster scrape ──────────────────────────────────────────
  boss.work<ScrapeClusterJobData>(
    QUEUE_NAMES.SCRAPE_CLUSTER,
    { localConcurrency: 1 },
    async (jobs) => {
      for (const job of jobs) {
        const { platform, clerkIds, cookieSourceClerkId, role, city, limit } = job.data;
        const start = Date.now();
        logger.info({ platform, clerkIds: clerkIds.length, role, city }, "cluster scrape started");

        try {
          const scraper = scrapers[platform];
          if (!scraper) throw new Error(`unknown platform: ${platform}`);

          const cookies = await PlatformService.getDecryptedCookies(
            cookieSourceClerkId,
            platform,
          );

          let rawJobs;
          if (cookies) {
            rawJobs = await scraper.scrapeAuthenticated(cookies as Cookie[], {
              role,
              location: city,
              limit,
            });
          } else {
            logger.warn({ platform, cookieSourceClerkId }, "cookies missing, falling back to anonymous");
            await PlatformService.markExpired(cookieSourceClerkId, platform);
            rawJobs = await scraper.scrape({ role, location: city, limit });
          }

          const newJobs = toNewJobs(rawJobs, platform);
          const { inserted, updated } = await upsertJobs(newJobs);

          // Associate all scraped jobs with every user in the cluster
          const jobIds = await db
            .select({ urlHash: userJobFeed.id }) // we need actual job IDs after upsert
            .from(userJobFeed)
            .limit(0); // just to get the type, unused

          // Re-fetch inserted job IDs by URL hash
          const { jobs: dbJobs } = await import("@/db/schema");
          const { inArray } = await import("drizzle-orm");
          const urlHashes = newJobs.map((j) => j.urlHash);
          const insertedJobs = await db
            .select({ id: dbJobs.id })
            .from(dbJobs)
            .where(inArray(dbJobs.urlHash, urlHashes));

          if (insertedJobs.length > 0) {
            const feedRows = clerkIds.flatMap((clerkId) =>
              insertedJobs.map((j) => ({
                clerkId,
                jobId: j.id,
                platform: platform as NewJob["source"],
              })),
            );
            await db
              .insert(userJobFeed)
              .values(feedRows)
              .onConflictDoNothing();
          }

          logger.info(
            { platform, inserted, updated, users: clerkIds.length, ms: Date.now() - start },
            "cluster scrape done",
          );
        } catch (err) {
          logger.error({ platform, err, ms: Date.now() - start }, "cluster scrape failed");
          throw err;
        }
      }
    },
  );

  logger.info("workers registered");
};

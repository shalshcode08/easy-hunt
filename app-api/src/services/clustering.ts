import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { platformConnections, users } from "@/db/schema";
import { getBoss } from "@/queue/pgboss";
import { QUEUE_NAMES, type ScrapeClusterJobData } from "@/queue/queues";
import { logger } from "@/lib/logger";
import type { JobSource } from "@/scrapers/base";

type RoleCategory =
  | "frontend"
  | "backend"
  | "fullstack"
  | "mobile"
  | "data"
  | "devops"
  | "design"
  | "management"
  | "other";

const ROLE_CATEGORY_QUERIES: Record<RoleCategory, string> = {
  frontend:   "frontend developer",
  backend:    "backend developer",
  fullstack:  "software engineer",
  mobile:     "mobile developer",
  data:       "data engineer",
  devops:     "devops engineer",
  design:     "product designer",
  management: "engineering manager",
  other:      "software engineer",
};

function categorize(role: string): RoleCategory {
  const r = role.toLowerCase();
  if (/front.?end|react|vue|angular|ui.?dev/.test(r))               return "frontend";
  if (/back.?end|node\.?js|java\b|python|django|spring|ruby/.test(r)) return "backend";
  if (/full.?stack|software.?eng|swe\b|sde\b/.test(r))              return "fullstack";
  if (/android|ios\b|mobile|react.?native|flutter|swift/.test(r))   return "mobile";
  if (/data.?eng|ml.?eng|data.?sci|spark|kafka/.test(r))            return "data";
  if (/devops|sre\b|cloud.?eng|platform.?eng|infra/.test(r))        return "devops";
  if (/design|ux\b|ui\/ux|figma/.test(r))                           return "design";
  if (/manager|director|vp\b|head.?of|lead/.test(r))                return "management";
  return "other";
}

type ClusterKey = `${JobSource}::${string}::${RoleCategory}`;

interface ClusterEntry {
  clerkId: string;
  platform: JobSource;
  city: string;
  category: RoleCategory;
  role: string;
}

export async function buildAndQueueClusters(): Promise<number> {
  // Fetch all active connections joined with user preferences
  const rows = await db
    .select({
      clerkId: platformConnections.clerkId,
      platform: platformConnections.platform,
      preferredRole: users.preferredRole,
      preferredCity: users.preferredCity,
    })
    .from(platformConnections)
    .innerJoin(users, eq(users.clerkId, platformConnections.clerkId))
    .where(eq(platformConnections.status, "active"));

  if (rows.length === 0) return 0;

  const clusters = new Map<ClusterKey, ClusterEntry[]>();

  for (const row of rows) {
    const role = row.preferredRole ?? "software engineer";
    const city = (row.preferredCity ?? "india").toLowerCase().trim();
    const category = categorize(role);
    const key: ClusterKey = `${row.platform}::${city}::${category}`;

    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key)!.push({
      clerkId: row.clerkId,
      platform: row.platform,
      city,
      category,
      role,
    });
  }

  let queued = 0;
  for (const [, members] of clusters) {
    // Use the first member as the cookie source (rotate in future for resilience)
    const source = members[0]!;
    const data: ScrapeClusterJobData = {
      platform: source.platform,
      clerkIds: members.map((m) => m.clerkId),
      cookieSourceClerkId: source.clerkId,
      role: ROLE_CATEGORY_QUERIES[source.category],
      city: source.city,
      limit: Math.min(30 + members.length * 5, 100), // scale limit with cluster size
    };

    await getBoss().send(QUEUE_NAMES.SCRAPE_CLUSTER, data, { priority: 1 });
    queued++;
  }

  logger.info({ clusters: queued, users: rows.length }, "scrape clusters queued");
  return queued;
}

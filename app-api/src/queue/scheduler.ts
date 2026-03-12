import type { PgBoss } from "pg-boss";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { scrapeQueries } from "@/db/schema";
import { logger } from "@/lib/logger";
import { QUEUE_NAMES } from "@/queue/queues";
import { buildAndQueueClusters } from "@/services/clustering";

// Sweep active connections and queue one scrape job per cluster every 4 hours
const CLUSTER_SWEEP_CRON = "0 */4 * * *";

export const registerSchedules = async (boss: PgBoss): Promise<void> => {
  // ── Authenticated cluster sweep ────────────────────────────────────────────
  await boss.createQueue("cluster-sweep");
  await boss.schedule(
    "cluster-sweep",
    CLUSTER_SWEEP_CRON,
    {},
    { tz: "Asia/Kolkata", singletonKey: "cluster-sweep" },
  );

  boss.work("cluster-sweep", { localConcurrency: 1 }, async () => {
    const count = await buildAndQueueClusters();
    logger.info({ clusters: count }, "cluster sweep complete");
  });

  // ── Legacy anonymous scrapes ───────────────────────────────────────────────
  const queries = await db
    .select()
    .from(scrapeQueries)
    .where(eq(scrapeQueries.isActive, true));

  for (const q of queries) {
    await boss.schedule(
      QUEUE_NAMES.SCRAPE,
      q.cronPattern,
      { source: q.source, role: q.role, location: q.location, limit: q.limit },
      { tz: "Asia/Kolkata" },
    );
    logger.info({ source: q.source, role: q.role, cron: q.cronPattern }, "schedule registered");
  }

  logger.info(`${queries.length} anonymous + cluster sweep registered`);
};

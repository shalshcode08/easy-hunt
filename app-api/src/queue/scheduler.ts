import type { PgBoss } from "pg-boss";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { scrapeQueries } from "@/db/schema";
import { logger } from "@/lib/logger";
import { QUEUE_NAMES } from "@/queue/queues";

export const registerSchedules = async (boss: PgBoss): Promise<void> => {
  const queries = await db.select().from(scrapeQueries).where(eq(scrapeQueries.isActive, true));

  for (const q of queries) {
    await boss.schedule(
      QUEUE_NAMES.SCRAPE,
      q.cronPattern,
      { source: q.source, role: q.role, location: q.location, limit: q.limit },
      { tz: "Asia/Kolkata" },
    );

    logger.info({ source: q.source, role: q.role, cron: q.cronPattern }, "schedule registered");
  }

  logger.info(`${queries.length} scrape schedules registered`);
};

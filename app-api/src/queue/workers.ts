import type { PgBoss } from "pg-boss";
import { logger } from "@/lib/logger";
import { QUEUE_NAMES, type ScrapeJobData } from "@/queue/queues";

export const registerWorkers = (boss: PgBoss): void => {
  boss.work<ScrapeJobData>(QUEUE_NAMES.SCRAPE, { localConcurrency: 1 }, async (jobs) => {
    for (const job of jobs) {
      const { source, role, location } = job.data;
      logger.info({ source, role, location }, "scrape job started");

      // TODO: wire scraper in Step 5
      // const scraper = scraperFactory(source);
      // const rawJobs = await scraper.scrape({ role, location, limit: job.data.limit });
      // const { inserted, updated } = await upsertJobs(rawJobs);

      logger.info({ source }, "scrape job completed");
    }
  });

  logger.info("workers registered");
};

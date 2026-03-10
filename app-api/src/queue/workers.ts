import type { PgBoss } from "pg-boss";
import { logger } from "@/lib/logger";
import { QUEUE_NAMES, type ScrapeJobData } from "@/queue/queues";
import { hashUrl, upsertJobs } from "@/lib/dedup";
import { LinkedInScraper } from "@/scrapers/linkedin";
import { NaukriScraper } from "@/scrapers/naukri";
import { IndeedScraper } from "@/scrapers/indeed";
import type { BaseScraper } from "@/scrapers/base";
import type { NewJob } from "@/db/schema";

const scrapers: Record<string, BaseScraper> = {
  linkedin: new LinkedInScraper(),
  naukri: new NaukriScraper(),
  indeed: new IndeedScraper(),
};

export const registerWorkers = (boss: PgBoss): void => {
  boss.work<ScrapeJobData>(QUEUE_NAMES.SCRAPE, { localConcurrency: 1 }, async (jobs) => {
    for (const job of jobs) {
      const { source, role, location, limit } = job.data;
      const start = Date.now();
      logger.info({ source, role, location, limit }, "scrape job started");

      try {
        const scraper = scrapers[source];
        if (!scraper) throw new Error(`unknown source: ${source}`);

        const rawJobs = await scraper.scrape({ role, location, limit });

        const newJobs: NewJob[] = rawJobs.map((raw) => ({
          url: raw.url,
          urlHash: hashUrl(raw.url),
          title: raw.title,
          titleNormalized: raw.title.toLowerCase().trim(),
          company: raw.company,
          companyNormalized: raw.company.toLowerCase().trim(),
          source,
          locationRaw: raw.location,
          isRemote: raw.location?.toLowerCase().includes("remote") ?? false,
          salaryRaw: raw.salary ?? null,
          description: raw.description ?? null,
          postedAt: raw.postedAt ?? null,
        }));

        const { inserted, updated } = await upsertJobs(newJobs);
        const duration = Date.now() - start;
        logger.info({ source, inserted, updated, duration }, "scrape job completed");
      } catch (err) {
        logger.error({ source, err, duration: Date.now() - start }, "scrape job failed");
        throw err;
      }
    }
  });

  logger.info("workers registered");
};

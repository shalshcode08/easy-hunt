import type { JobSource } from "@/scrapers/base";

export const QUEUE_NAMES = {
  SCRAPE: "scrape",
} as const;

export interface ScrapeJobData {
  source: JobSource;
  role: string;
  location: string;
  limit: number;
}

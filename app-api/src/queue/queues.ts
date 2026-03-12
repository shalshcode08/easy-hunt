import type { JobSource } from "@/scrapers/base";

export const QUEUE_NAMES = {
  SCRAPE:         "scrape",
  SCRAPE_CLUSTER: "scrape_cluster",
} as const;

export interface ScrapeJobData {
  source: JobSource;
  role: string;
  location: string;
  limit: number;
}

export interface ScrapeClusterJobData {
  platform: JobSource;
  clerkIds: string[];
  cookieSourceClerkId: string;
  role: string;
  city: string;
  limit: number;
}

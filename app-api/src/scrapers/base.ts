import { type Cookie, type Page } from "playwright";
import { browserPool } from "@/lib/browser";
import { logger } from "@/lib/logger";

export type JobSource = "linkedin" | "naukri" | "indeed";

export interface ScrapeQuery {
  role: string;
  location: string;
  limit: number;
}

export interface RawJob {
  title: string;
  company: string;
  location: string;
  url: string;
  applyUrl?: string;
  description?: string;
  salary?: string;
  jobType?: string;
  postedAt?: Date;
}

export abstract class BaseScraper {
  abstract source: JobSource;

  // Anonymous scrape — called by the legacy queue worker
  async scrape(query: ScrapeQuery): Promise<RawJob[]> {
    return this.withPage((page) => this.scrapeOnPage(page, query));
  }

  // Authenticated scrape — injects session cookies before navigating
  async scrapeAuthenticated(cookies: Cookie[], query: ScrapeQuery): Promise<RawJob[]> {
    return browserPool.withAuthenticatedPage(cookies, (page) =>
      this.scrapeOnPage(page, query),
    );
  }

  // Core extraction logic — implemented by each platform scraper
  protected abstract scrapeOnPage(page: Page, query: ScrapeQuery): Promise<RawJob[]>;

  protected async withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
    const maxAttempts = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await browserPool.withPage(fn);
      } catch (err) {
        lastError = err;
        if (attempt < maxAttempts) {
          const delay = attempt * 1000;
          logger.warn({ source: this.source, attempt, delay }, "scrape attempt failed, retrying");
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    throw lastError;
  }

  protected randomDelay(min = 800, max = 2500): Promise<void> {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

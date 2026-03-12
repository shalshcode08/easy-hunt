import { type Page } from "playwright";
import { BaseScraper, type RawJob, type ScrapeQuery } from "@/scrapers/base";
import { logger } from "@/lib/logger";

const BASE_URL = "https://www.linkedin.com/jobs/search";

function buildUrl(role: string, location: string): string {
  const params = new URLSearchParams({
    keywords: role,
    location,
    f_TPR: "r86400",
    sortBy: "DD",
  });
  return `${BASE_URL}?${params}`;
}

function parseRelativeDate(text: string): Date | undefined {
  const now = Date.now();
  const t = text.toLowerCase();
  if (t.includes("minute") || t.includes("hour") || t.includes("just now")) return new Date(now);
  const dayMatch = t.match(/(\d+)\s*day/);
  if (dayMatch) return new Date(now - Number(dayMatch[1]) * 86_400_000);
  const weekMatch = t.match(/(\d+)\s*week/);
  if (weekMatch) return new Date(now - Number(weekMatch[1]) * 7 * 86_400_000);
  const monthMatch = t.match(/(\d+)\s*month/);
  if (monthMatch) return new Date(now - Number(monthMatch[1]) * 30 * 86_400_000);
  return undefined;
}

export class LinkedInScraper extends BaseScraper {
  source = "linkedin" as const;

  protected async scrapeOnPage(page: Page, query: ScrapeQuery): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const url = buildUrl(query.role, query.location);

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForSelector(".base-card", { timeout: 15_000 }).catch(() => {});

    while (jobs.length < query.limit) {
      const cards = await page.$$(".base-card");

      for (const card of cards) {
        if (jobs.length >= query.limit) break;
        try {
          const title = await card
            .$eval(".base-search-card__title", (el) => el.textContent?.trim())
            .catch(() => null);
          const company = await card
            .$eval(".base-search-card__subtitle", (el) => el.textContent?.trim())
            .catch(() => null);
          const location = await card
            .$eval(".job-search-card__location", (el) => el.textContent?.trim())
            .catch(() => null);
          const href = await card
            .$eval("a.base-card__full-link", (el) => (el as HTMLAnchorElement).href)
            .catch(() => null);
          const dateText = await card
            .$eval("time", (el) => el.getAttribute("datetime") ?? el.textContent)
            .catch(() => null);

          if (!title || !company || !href) continue;

          const cleanUrl = href.split("?")[0]!;
          let postedAt: Date | undefined;
          if (dateText) {
            postedAt = new Date(dateText);
            if (isNaN(postedAt.getTime())) postedAt = parseRelativeDate(dateText);
          }

          jobs.push({ title, company, location: location ?? query.location, url: cleanUrl, postedAt });
        } catch {
          continue;
        }
      }

      if (jobs.length >= query.limit) break;

      const nextBtn = await page.$("button[aria-label='Load more results']");
      if (!nextBtn) break;

      await nextBtn.click();
      await this.randomDelay();
      await page.waitForSelector(".base-card", { timeout: 10_000 }).catch(() => {});
    }

    logger.info({ source: this.source, found: jobs.length }, "scrape complete");
    return jobs.slice(0, query.limit);
  }
}

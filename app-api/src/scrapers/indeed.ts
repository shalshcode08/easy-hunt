import { type Page } from "playwright";
import { BaseScraper, type RawJob, type ScrapeQuery } from "@/scrapers/base";
import { logger } from "@/lib/logger";

const BASE_URL = "https://in.indeed.com/jobs";

function buildUrl(role: string, location: string, start = 0): string {
  const params = new URLSearchParams({
    q: role, l: location, sort: "date", fromage: "7", start: String(start),
  });
  return `${BASE_URL}?${params}`;
}

function parsePostedDate(text: string): Date | undefined {
  const t = text.toLowerCase();
  const now = Date.now();
  if (t.includes("just posted") || t.includes("today")) return new Date(now);
  const dayMatch = t.match(/(\d+)\s*day/);
  if (dayMatch) return new Date(now - Number(dayMatch[1]) * 86_400_000);
  return undefined;
}

export class IndeedScraper extends BaseScraper {
  source = "indeed" as const;

  protected async scrapeOnPage(page: Page, query: ScrapeQuery): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    let start = 0;

    while (jobs.length < query.limit) {
      await page.goto(buildUrl(query.role, query.location, start), {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      await page
        .waitForSelector(".job_seen_beacon, .tapItem", { timeout: 15_000 })
        .catch(() => {});

      const cards = await page.$$(".job_seen_beacon, .tapItem");
      if (cards.length === 0) break;

      for (const card of cards) {
        if (jobs.length >= query.limit) break;
        try {
          const title = await card
            .$eval("[data-testid='jobTitle'] span, .jobTitle span", (el) => el.textContent?.trim())
            .catch(() => null);
          const company = await card
            .$eval("[data-testid='company-name'], .companyName", (el) => el.textContent?.trim())
            .catch(() => null);
          const location = await card
            .$eval("[data-testid='text-location'], .companyLocation", (el) => el.textContent?.trim())
            .catch(() => null);
          const href = await card
            .$eval("a[id^='job_']", (el) => (el as HTMLAnchorElement).href)
            .catch(() =>
              card.$eval("a.jcs-JobTitle", (el) => (el as HTMLAnchorElement).href).catch(() => null),
            );
          const salary = await card
            .$eval("[data-testid='attribute_snippet_testid']", (el) => el.textContent?.trim())
            .catch(() => null);
          const dateText = await card
            .$eval("[data-testid='myJobsStateDate'] span, .date", (el) => el.textContent?.trim())
            .catch(() => null);

          if (!title || !company || !href) continue;

          const cleanUrl = new URL(href).origin + new URL(href).pathname;
          jobs.push({
            title, company,
            location: location ?? query.location,
            url: cleanUrl,
            salary: salary ?? undefined,
            postedAt: dateText ? parsePostedDate(dateText) : undefined,
          });
        } catch {
          continue;
        }
      }

      if (jobs.length >= query.limit) break;

      const nextBtn = await page.$("a[data-testid='pagination-page-next']");
      if (!nextBtn) break;

      start += 10;
      await this.randomDelay();
    }

    logger.info({ source: this.source, found: jobs.length }, "scrape complete");
    return jobs.slice(0, query.limit);
  }
}

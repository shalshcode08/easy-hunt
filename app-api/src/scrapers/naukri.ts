import { type Page } from "playwright";
import { BaseScraper, type RawJob, type ScrapeQuery } from "@/scrapers/base";
import { logger } from "@/lib/logger";

const BASE_URL = "https://www.naukri.com";

function buildUrl(role: string, location: string): string {
  const slug = role.toLowerCase().replace(/\s+/g, "-");
  const loc  = location.toLowerCase().replace(/\s+/g, "-");
  return `${BASE_URL}/${slug}-jobs-in-${loc}`;
}

function parseSalary(text: string): string | undefined {
  const t = text.trim();
  return t && t !== "Not Disclosed" ? t : undefined;
}

export class NaukriScraper extends BaseScraper {
  source = "naukri" as const;

  protected async scrapeOnPage(page: Page, query: ScrapeQuery): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    let pageNum = 1;
    const url = buildUrl(query.role, query.location);

    while (jobs.length < query.limit) {
      const pageUrl = pageNum === 1 ? url : `${url}-${pageNum}`;
      await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page
        .waitForSelector(".srp-jobtuple-wrapper, article.jobTuple", { timeout: 15_000 })
        .catch(() => {});

      const cards = await page.$$(".srp-jobtuple-wrapper, article.jobTuple");
      if (cards.length === 0) break;

      for (const card of cards) {
        if (jobs.length >= query.limit) break;
        try {
          const title    = await card.$eval("a.title", (el) => el.textContent?.trim()).catch(() => null);
          const company  = await card.$eval("a.comp-name, .comp-name", (el) => el.textContent?.trim()).catch(() => null);
          const href     = await card.$eval("a.title", (el) => (el as HTMLAnchorElement).href).catch(() => null);
          const location = await card.$eval(".locWdth, .location", (el) => el.textContent?.trim()).catch(() => null);
          const salaryRaw = await card.$eval(".salary, .sal", (el) => el.textContent?.trim()).catch(() => null);
          const experience = await card.$eval(".expwdth, .experience", (el) => el.textContent?.trim()).catch(() => null);

          if (!title || !company || !href) continue;

          jobs.push({
            title,
            company,
            location: location ?? query.location,
            url: href,
            salary: salaryRaw ? parseSalary(salaryRaw) : undefined,
            jobType: experience ?? undefined,
          });
        } catch {
          continue;
        }
      }

      if (jobs.length >= query.limit) break;
      pageNum++;
      await this.randomDelay();
    }

    logger.info({ source: this.source, found: jobs.length }, "scrape complete");
    return jobs.slice(0, query.limit);
  }
}

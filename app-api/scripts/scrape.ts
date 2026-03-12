/**
 * Manual scrape runner — runs a scrape directly without the queue.
 *
 * Usage:
 *   bun scripts/scrape.ts --source linkedin --role "software engineer" --location "bangalore" --limit 20
 *   bun scripts/scrape.ts --source naukri   --role "frontend developer" --location "mumbai"   --limit 30
 *   bun scripts/scrape.ts --source indeed   --role "data engineer"      --location "india"    --limit 25
 */
import "dotenv/config";
import { hashUrl, upsertJobs } from "@/lib/dedup";
import { parseLocation } from "@/lib/location";
import { LinkedInScraper } from "@/scrapers/linkedin";
import { NaukriScraper } from "@/scrapers/naukri";
import { IndeedScraper } from "@/scrapers/indeed";
import { browserPool } from "@/lib/browser";
import type { NewJob } from "@/db/schema";
import type { JobSource } from "@/scrapers/base";

const SCRAPERS = {
  linkedin: new LinkedInScraper(),
  naukri: new NaukriScraper(),
  indeed: new IndeedScraper(),
};

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };
  return {
    source: (get("--source") ?? "linkedin") as JobSource,
    role: get("--role") ?? "software engineer",
    location: get("--location") ?? "india",
    limit: parseInt(get("--limit") ?? "20", 10),
  };
}

async function main() {
  const { source, role, location, limit } = parseArgs();

  const scraper = SCRAPERS[source];
  if (!scraper) {
    console.error(`Unknown source: ${source}. Valid: linkedin | naukri | indeed`);
    process.exit(1);
  }

  console.log(`Scraping ${source} — role: "${role}", location: "${location}", limit: ${limit}`);
  const start = Date.now();

  const rawJobs = await scraper.scrape({ role, location, limit });
  console.log(`Scraped ${rawJobs.length} raw jobs in ${Date.now() - start}ms`);

  const newJobs: NewJob[] = rawJobs.map((raw) => {
    const { city, workMode, isRemote } = parseLocation(raw.location);
    return {
      url: raw.url,
      urlHash: hashUrl(raw.url),
      title: raw.title,
      titleNormalized: raw.title.toLowerCase().trim(),
      company: raw.company,
      companyNormalized: raw.company.toLowerCase().trim(),
      source,
      locationRaw: raw.location,
      city,
      workMode,
      isRemote,
      salaryRaw: raw.salary ?? null,
      description: raw.description ?? null,
      postedAt: raw.postedAt ?? null,
      isActive: true,
      isDeleted: false,
    };
  });

  const { inserted, updated } = await upsertJobs(newJobs);
  const duration = Date.now() - start;
  console.log(`Done in ${duration}ms — inserted: ${inserted}, updated: ${updated}`);

  await browserPool.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("Scrape failed:", err);
  process.exit(1);
});

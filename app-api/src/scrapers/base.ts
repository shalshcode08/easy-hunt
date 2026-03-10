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
  description?: string;
  salary?: string;
  jobType?: string;
  postedAt?: Date;
}

export abstract class BaseScraper {
  abstract source: JobSource;
  abstract scrape(query: ScrapeQuery): Promise<RawJob[]>;

  protected randomDelay(min = 800, max = 2500): Promise<void> {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

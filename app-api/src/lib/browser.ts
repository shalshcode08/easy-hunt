import { chromium, Browser, BrowserContext, Page, type Cookie } from "playwright";
import { addExtra } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { logger } from "@/lib/logger";

const CONCURRENCY = 3;

class Semaphore {
  private queue: (() => void)[] = [];
  private running = 0;

  constructor(private max: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.max) {
      this.running++;
      return;
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
    this.running++;
  }

  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) next();
  }
}

class BrowserPool {
  private browser: Browser | null = null;
  private semaphore = new Semaphore(CONCURRENCY);
  private launching = false;
  private launchQueue: (() => void)[] = [];

  private async launch(): Promise<void> {
    if (this.launching) {
      await new Promise<void>((resolve) => this.launchQueue.push(resolve));
      return;
    }
    this.launching = true;
    try {
      const pw = addExtra(chromium);
      pw.use(StealthPlugin());
      this.browser = await pw.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-blink-features=AutomationControlled",
        ],
      });
      this.browser.on("disconnected", () => {
        logger.warn("browser disconnected — will relaunch on next acquire");
        this.browser = null;
      });
      logger.info("browser launched");
    } finally {
      this.launching = false;
      this.launchQueue.forEach((r) => r());
      this.launchQueue = [];
    }
  }

  private async ensureBrowser(): Promise<Browser> {
    if (!this.browser) await this.launch();
    return this.browser!;
  }

  private async createContext(cookies?: Cookie[]): Promise<BrowserContext> {
    const browser = await this.ensureBrowser();
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      viewport: { width: 1366, height: 768 },
      locale: "en-US",
      timezoneId: "Asia/Kolkata",
    });
    if (cookies?.length) await context.addCookies(cookies);
    return context;
  }

  async withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
    await this.semaphore.acquire();
    const context = await this.createContext();
    const page = await context.newPage();
    try {
      return await fn(page);
    } finally {
      await context.close().catch(() => {});
      this.semaphore.release();
    }
  }

  async withAuthenticatedPage<T>(cookies: Cookie[], fn: (page: Page) => Promise<T>): Promise<T> {
    await this.semaphore.acquire();
    const context = await this.createContext(cookies);
    const page = await context.newPage();
    try {
      return await fn(page);
    } finally {
      await context.close().catch(() => {});
      this.semaphore.release();
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const browserPool = new BrowserPool();

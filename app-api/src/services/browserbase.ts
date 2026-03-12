import Browserbase from "@browserbasehq/sdk";
import { chromium } from "playwright";
import { env } from "@/env";
import type { JobSource } from "@/scrapers/base";

export type SerializedCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Strict" | "Lax" | "None" | undefined;
};

const PLATFORM_LOGIN_URL: Record<JobSource, string> = {
  linkedin: "https://www.linkedin.com/login",
  naukri:   "https://www.naukri.com/nlogin/login",
  indeed:   "https://secure.indeed.com/account/login",
};

// Cookies whose presence confirms a successful login per platform
const AUTH_COOKIE_MARKERS: Record<JobSource, string[]> = {
  linkedin: ["li_at"],
  naukri:   ["nauk_ses_v2", "_t"],
  indeed:   ["CTK", "JSESSIONID"],
};

// Conservative estimate of cookie lifetime
const COOKIE_TTL_MS: Record<JobSource, number> = {
  linkedin: 365 * 24 * 60 * 60 * 1000,
  naukri:   180 * 24 * 60 * 60 * 1000,
  indeed:   180 * 24 * 60 * 60 * 1000,
};

function bb(): Browserbase {
  return new Browserbase({ apiKey: env.BROWSERBASE_API_KEY });
}

function cdpHeaders() {
  return { headers: { "x-bb-api-key": env.BROWSERBASE_API_KEY } };
}

export async function createLoginSession(
  platform: JobSource,
): Promise<{ sessionId: string; liveViewUrl: string }> {
  const client = bb();
  const session = await client.sessions.create({ projectId: env.BROWSERBASE_PROJECT_ID });
  return {
    sessionId: session.id,
    liveViewUrl: PLATFORM_LOGIN_URL[platform],
  };
}

export async function pollSessionCookies(
  sessionId: string,
  platform: JobSource,
): Promise<boolean> {
  const client = bb();
  const session = await client.sessions.retrieve(sessionId);
  if (session.status !== "RUNNING") return false;

  if (!session.connectUrl) return false;
  const browser = await chromium.connectOverCDP(session.connectUrl, cdpHeaders());
  try {
    const context = browser.contexts()[0];
    if (!context) return false;
    const cookies = await context.cookies();
    return AUTH_COOKIE_MARKERS[platform].some((name) =>
      cookies.some((c) => c.name === name),
    );
  } finally {
    await browser.close();
  }
}

export async function extractAndTerminate(
  sessionId: string,
  platform: JobSource,
): Promise<SerializedCookie[]> {
  const client = bb();
  const session = await client.sessions.retrieve(sessionId);

  if (session.status !== "RUNNING") {
    throw new Error(`Session ${sessionId} is not running`);
  }

  if (!session.connectUrl) throw new Error(`Session ${sessionId} has no connectUrl`);
  const browser = await chromium.connectOverCDP(session.connectUrl, cdpHeaders());
  let cookies: SerializedCookie[] = [];
  try {
    const context = browser.contexts()[0];
    if (!context) throw new Error("No browser context in session");
    cookies = (await context.cookies()) as SerializedCookie[];
    const hasAuth = AUTH_COOKIE_MARKERS[platform].some((name) =>
      cookies.some((c) => c.name === name),
    );
    if (!hasAuth) throw new Error(`No auth cookies found for ${platform}`);
  } finally {
    await browser.close();
    // best-effort session release
    await client.sessions
      .update(sessionId, { status: "REQUEST_RELEASE" })
      .catch(() => {});
  }
  return cookies;
}

export function cookieExpiry(platform: JobSource): Date {
  return new Date(Date.now() + COOKIE_TTL_MS[platform]);
}

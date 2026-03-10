# JobHunter — Production-Grade Job Aggregator Web App

## Context

A unified job board that scrapes LinkedIn, Naukri, and Indeed every few hours and presents all listings in one clean dashboard. User can filter, save, and track applications. Clicking a job redirects to the original site to apply. Saves the user from juggling 3 separate portals daily.

---

## Tech Stack

| Layer            | Technology                                                                 |
| ---------------- | -------------------------------------------------------------------------- |
| Frontend         | Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui            |
| Backend          | Bun + TypeScript + Express                                                 |
| Scraping         | Playwright + playwright-extra + stealth plugin                             |
| Database         | CockroachDB Serverless (free tier — 5GB, excellent uptime)                 |
| ORM              | Drizzle ORM (pg-core dialect, postgres.js driver — CockroachDB compatible) |
| Queue            | BullMQ + Upstash Redis (free tier)                                         |
| Auth             | Clerk                                                                      |
| Logging          | Pino                                                                       |
| Validation       | Zod                                                                        |
| Frontend hosting | Vercel (free)                                                              |
| Backend hosting  | Railway (free tier)                                                        |

---

## Repository Structure

```
job-hunter/                              ← monorepo root
├── package.json                         ← bun workspaces
├── .env.example
├── frontend/                            ← Next.js 15 App Router
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── middleware.ts                    ← Clerk auth guard (protects /dashboard)
│   └── src/
│       ├── app/
│       │   ├── layout.tsx              ← root layout, ClerkProvider, QueryProvider
│       │   ├── page.tsx                ← landing / sign-in redirect
│       │   ├── sign-in/[[...sign-in]]/ ← Clerk sign-in page
│       │   ├── sign-up/[[...sign-up]]/ ← Clerk sign-up page
│       │   └── dashboard/
│       │       ├── layout.tsx          ← dashboard shell, AppHeader
│       │       ├── page.tsx            ← job feed
│       │       └── saved/
│       │           └── page.tsx        ← saved & tracked jobs
│       ├── components/
│       │   ├── JobCard.tsx
│       │   ├── FilterBar.tsx
│       │   ├── SourceBadge.tsx         ← LinkedIn / Naukri / Indeed pill
│       │   ├── StatusSelect.tsx        ← saved/applied/interviewing/rejected
│       │   ├── AppHeader.tsx           ← nav + Clerk UserButton
│       │   └── Providers.tsx           ← TanStack QueryClientProvider
│       ├── hooks/
│       │   ├── useJobs.ts              ← TanStack Query: GET /api/jobs
│       │   └── useSavedJobs.ts         ← saved jobs CRUD queries
│       └── lib/
│           └── api.ts                  ← axios instance with Clerk token
└── backend/                            ← Bun + Express
    ├── package.json
    ├── Dockerfile
    ├── drizzle.config.ts
    └── src/
        ├── index.ts                    ← Express app, graceful shutdown
        ├── env.ts                      ← Zod-validated env (throws on startup)
        ├── db/
        │   ├── client.ts               ← CockroachDB + Drizzle client (postgres.js)
        │   ├── schema.ts               ← all table definitions
        │   └── migrations/             ← drizzle-kit generated SQL
        ├── routes/
        │   ├── jobs.ts                 ← GET /api/jobs, GET /api/jobs/:id
        │   ├── saved.ts                ← saved jobs CRUD
        │   └── health.ts              ← GET /health
        ├── scrapers/
        │   ├── base.ts                 ← BaseScraper abstract class
        │   ├── linkedin.ts
        │   ├── naukri.ts
        │   └── indeed.ts
        ├── queue/
        │   ├── redis.ts                ← Upstash Redis connection
        │   ├── queues.ts               ← BullMQ queue definitions
        │   ├── workers.ts              ← BullMQ worker (processes scrape jobs)
        │   └── scheduler.ts            ← repeating cron job setup
        ├── middleware/
        │   ├── auth.ts                 ← Clerk JWT verification
        │   ├── rateLimit.ts            ← express-rate-limit per user
        │   ├── validate.ts             ← Zod request validator
        │   └── errorHandler.ts         ← global error handler
        └── lib/
            ├── browser.ts              ← Playwright browser pool singleton
            ├── logger.ts               ← Pino structured logger
            └── dedup.ts                ← upsert jobs by URL hash
```

---

## Database Schema (Drizzle + PostgreSQL)

```ts
jobs {
  id          uuid PRIMARY KEY  default gen_random_uuid()
  title       text NOT NULL
  company     text NOT NULL
  location    text
  source      enum('linkedin','naukri','indeed') NOT NULL
  url         text NOT NULL UNIQUE          ← dedup key
  description text
  salary      text
  job_type    text                          ← full-time, contract, internship
  posted_at   timestamp
  scraped_at  timestamp NOT NULL default now()
}

saved_jobs {
  id          uuid PRIMARY KEY default gen_random_uuid()
  clerk_id    text NOT NULL                ← from Clerk JWT sub
  job_id      uuid NOT NULL → jobs.id ON DELETE CASCADE
  status      enum('saved','applied','interviewing','rejected','offered') default 'saved'
  notes       text
  saved_at    timestamp default now()
  updated_at  timestamp default now()
  UNIQUE(clerk_id, job_id)
}

scrape_logs {
  id          uuid PRIMARY KEY default gen_random_uuid()
  source      enum('linkedin','naukri','indeed') NOT NULL
  status      enum('success','failed','partial') NOT NULL
  jobs_found  integer default 0
  duration_ms integer
  error       text
  created_at  timestamp default now()
}
```

---

## API Routes (Express)

```
GET  /health
  → { status: "ok", uptime: number, db: "ok"|"error" }

GET  /api/jobs
  auth: required
  query: source?, location?, role?, datePosted?(24h|7d|30d), page=1, limit=20
  → { jobs: Job[], total: number, page: number, totalPages: number }

GET  /api/jobs/:id
  auth: required
  → Job

GET  /api/saved
  auth: required
  → SavedJob[]

POST /api/saved
  auth: required
  body: { job_id: string }
  → SavedJob (201)

PATCH /api/saved/:id
  auth: required
  body: { status?, notes? }
  → SavedJob

DELETE /api/saved/:id
  auth: required
  → 204

POST /api/scrape/trigger
  auth: required + x-admin-key header
  body: { source: 'linkedin'|'naukri'|'indeed' }
  → { queued: true }
```

---

## Scraper Architecture

```ts
// base.ts
abstract class BaseScraper {
  abstract source: "linkedin" | "naukri" | "indeed";
  abstract scrape(query: ScrapeQuery): Promise<RawJob[]>;

  // Handles browser page lifecycle, retries (3x exponential backoff), logging
  protected async withPage<T>(fn: (page: Page) => Promise<T>): Promise<T>;

  // Human-like random delay between page actions
  protected randomDelay(min = 800, max = 2500): Promise<void>;
}

// ScrapeQuery = { role: string; location: string; limit: number }
// RawJob = { title, company, location, url, description, salary, jobType, postedAt }
```

**Stealth:** `playwright-extra` + `puppeteer-extra-plugin-stealth` applied to every browser launch.

**Browser Pool (`lib/browser.ts`):**

- Single shared Chromium instance across all scrapes (not per-request)
- Max 3 concurrent pages via semaphore
- Auto-restart if browser crashes (health checked before each page acquisition)

**Deduplication (`lib/dedup.ts`):**

- Upsert into `jobs` using `ON CONFLICT (url) DO UPDATE SET scraped_at = now()`
- Returns count of new vs updated jobs for logging

---

## Queue & Scheduler (BullMQ + Upstash Redis)

```ts
// queues.ts
const scraperQueue = new Queue("scraper", { connection: redisConnection });

// scheduler.ts — called once on app startup
scraperQueue.add(
  "linkedin",
  { role: "software engineer", location: "india" },
  {
    repeat: { pattern: "0 */3 * * *" }, // every 3 hours
  },
);
scraperQueue.add(
  "naukri",
  { role: "software engineer", location: "india" },
  {
    repeat: { pattern: "30 */3 * * *" }, // offset by 30min to avoid simultaneous load
  },
);
scraperQueue.add(
  "indeed",
  { role: "software engineer", location: "india" },
  {
    repeat: { pattern: "0 1-22/3 * * *" },
  },
);

// workers.ts
// Worker picks up job name ('linkedin'|'naukri'|'indeed')
// Instantiates correct scraper, runs scrape(), upserts to DB, writes scrape_log
// concurrency: 1 (scrape one site at a time to avoid detection)
```

---

## Auth Middleware (Clerk)

```ts
// middleware/auth.ts — Express middleware
import { clerkClient } from "@clerk/express";

export const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = await clerkClient.verifyToken(token);
    req.clerkId = payload.sub; // attach to request
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};
```

Frontend: `lib/api.ts` axios instance attaches `await getToken()` from `useAuth()` to every request header.

---

## Key Production Patterns

| Concern            | Solution                                                                             |
| ------------------ | ------------------------------------------------------------------------------------ |
| Env validation     | `env.ts` Zod schema — process exits immediately if any var missing                   |
| Structured logging | Pino — logs include `req_id`, `method`, `path`, `duration_ms`, `status`              |
| Rate limiting      | `express-rate-limit` — 60 req/min per `clerk_id` on all /api routes                  |
| DB connection      | `postgres.js` driver → CockroachDB Serverless (SSL required, pool via driver config) |
| Graceful shutdown  | SIGTERM: drain BullMQ workers → close browser → close DB → exit                      |
| Error handler      | `errorHandler.ts` middleware returns `{ error: string, code: string }`               |
| Request validation | Zod schemas on all route inputs via `validate.ts` middleware                         |
| CORS               | Explicit allowlist: Vercel frontend domain only                                      |
| Retry logic        | 3 retries with 1s/2s/4s backoff in `BaseScraper.withPage`                            |
| Security headers   | `helmet` middleware on all routes                                                    |

---

## Environment Variables

```bash
# backend/.env
DATABASE_URL=            # CockroachDB Serverless connection string (postgresql://user:pass@host:26257/defaultdb?sslmode=verify-full)
UPSTASH_REDIS_URL=       # Upstash Redis REST URL
UPSTASH_REDIS_TOKEN=     # Upstash Redis REST token
CLERK_SECRET_KEY=        # Clerk backend secret
ADMIN_KEY=               # Secret for /api/scrape/trigger
PORT=3000
NODE_ENV=production
FRONTEND_URL=            # Vercel deployment URL (for CORS)

# frontend/.env.local
NEXT_PUBLIC_API_URL=     # Railway backend URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=        # For Next.js middleware
```

---

## Packages

**Backend:**

```
dependencies: express, @clerk/express, drizzle-orm, postgres,
              bullmq, @upstash/redis, playwright-extra,
              puppeteer-extra-plugin-stealth, playwright, pino, zod,
              helmet, express-rate-limit, cors, compression

devDependencies: typescript, @types/express, @types/node, drizzle-kit, bun-types
```

**Frontend:**

```
dependencies: next, react, react-dom, @clerk/nextjs, @tanstack/react-query,
              axios, tailwindcss, shadcn/ui components, lucide-react,
              sonner, zod, clsx, tailwind-merge

devDependencies: typescript, @types/node, @types/react
```

---

## Deployment

**Frontend → Vercel**

- `next build` — automatic via Vercel
- Set env vars in Vercel dashboard
- `next.config.ts` → `NEXT_PUBLIC_API_URL` points to Railway backend

**Backend → Railway**

```dockerfile
FROM oven/bun:1-alpine
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production
COPY src/ ./src/
COPY drizzle.config.ts ./
EXPOSE 3000
CMD ["bun", "src/index.ts"]
```

- Railway health check: `GET /health`
- Run DB migrations on deploy: `bun drizzle-kit migrate` as a Railway deploy command
- Note: CockroachDB supports PostgreSQL wire protocol — Drizzle `pg-core` dialect works natively. Use `postgres.js` driver with `ssl: 'verify-full'` in the connection config.

---

## Build Order (Implementation Sequence)

1. Scaffold monorepo, install all packages for both workspaces
2. `backend/src/env.ts` — Zod env validation (foundation for everything)
3. `backend/src/db/schema.ts` + `drizzle.config.ts` → run `drizzle-kit generate` + `migrate`
4. `backend/src/lib/browser.ts` — Playwright browser pool
5. `backend/src/scrapers/` — base class + linkedin + naukri + indeed
6. `backend/src/queue/` — redis, queues, workers, scheduler
7. `backend/src/middleware/` — auth, rateLimit, validate, errorHandler
8. `backend/src/routes/` — health, jobs, saved
9. `backend/src/index.ts` — wire Express app, graceful shutdown
10. `frontend/` — ClerkProvider, middleware auth guard, pages, components, hooks

---

## Verification

- `bun run dev` → backend starts, queues init, browser pool ready, logs show in Pino format
- `GET /health` → `{ status: "ok", db: "ok" }`
- `POST /api/scrape/trigger` (with ADMIN_KEY) → job queues → worker runs → rows appear in `jobs` table
- Frontend: Clerk sign-in → dashboard loads paginated job feed → filters work → save a job → status updates correctly
- Deploy to Railway + Vercel → end-to-end flow works in production

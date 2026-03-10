import {
  pgTable,
  pgEnum,
  uuid,
  text,
  char,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  unique,
  customType,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ── Custom types ─────────────────────────────────────────────────────────────

const tsvector = customType<{ data: string }>({
  dataType: () => "tsvector",
});

// ── Enums ────────────────────────────────────────────────────────────────────

export const jobSourceEnum = pgEnum("job_source", ["linkedin", "naukri", "indeed"]);

export const jobTypeEnum = pgEnum("job_type", [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "freelance",
  "temporary",
]);

export const experienceLevelEnum = pgEnum("experience_level", [
  "internship",
  "entry",
  "mid",
  "senior",
  "lead",
  "manager",
  "director",
  "executive",
]);

export const workModeEnum = pgEnum("work_mode", ["onsite", "remote", "hybrid"]);

export const savedStatusEnum = pgEnum("saved_status", [
  "saved",
  "applied",
  "interviewing",
  "offered",
  "rejected",
  "withdrawn",
]);

export const scrapeStatusEnum = pgEnum("scrape_status", [
  "success",
  "failed",
  "partial",
  "skipped",
]);

export const scrapeTriggerEnum = pgEnum("scrape_trigger", ["scheduled", "manual", "backfill"]);

// ── Tables ───────────────────────────────────────────────────────────────────

// ── jobs ─────────────────────────────────────────────────────────────────────
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Core identifiers
    url: text("url").notNull(),
    urlHash: char("url_hash", { length: 64 }).notNull(), // SHA-256(url) — dedup key
    externalId: text("external_id"), // platform's own job ID

    // Job details
    title: text("title").notNull(),
    titleNormalized: text("title_normalized").notNull(), // lowercase, stripped
    company: text("company").notNull(),
    companyNormalized: text("company_normalized").notNull(), // lowercase, stripped

    // Location
    locationRaw: text("location_raw"), // exactly as scraped
    city: text("city"), // normalized: "bengaluru"
    state: text("state"),
    country: char("country", { length: 2 }).default("IN"), // ISO-3166 alpha-2
    isRemote: boolean("is_remote").notNull().default(false),
    workMode: workModeEnum("work_mode"),

    // Classification
    source: jobSourceEnum("source").notNull(),
    jobType: jobTypeEnum("job_type"),
    experienceLevel: experienceLevelEnum("experience_level"),

    // Salary (structured + raw)
    salaryRaw: text("salary_raw"), // "₹15–25 LPA"
    salaryMin: integer("salary_min"), // annual, in INR
    salaryMax: integer("salary_max"),
    salaryCurrency: char("salary_currency", { length: 3 }).default("INR"),

    // Content
    description: text("description"),
    descriptionTsv: tsvector("description_tsv"), // FTS vector, trigger-maintained
    skillsRaw: text("skills_raw").array(), // ["React", "Node.js"]
    applyUrl: text("apply_url"), // direct apply link

    // Lifecycle
    isActive: boolean("is_active").notNull().default(true),
    isDeleted: boolean("is_deleted").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    scrapedAt: timestamp("scraped_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    // Audit
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Dedup — hit on every scraper upsert
    uniqueIndex("uq_jobs_url_hash").on(t.urlHash),

    // Primary feed query: source + active + date
    index("idx_jobs_feed").on(t.source, t.isActive, t.isDeleted, t.postedAt),

    // Location filter
    index("idx_jobs_city").on(t.city, t.isActive, t.isDeleted, t.postedAt),

    // Job type filter
    index("idx_jobs_job_type").on(t.jobType, t.isActive, t.isDeleted, t.postedAt),

    // Work mode filter
    index("idx_jobs_work_mode").on(t.workMode, t.isActive, t.isDeleted, t.postedAt),

    // Compound multi-filter (source + city + jobType)
    index("idx_jobs_compound").on(t.source, t.city, t.jobType, t.isActive, t.isDeleted, t.postedAt),

    // Scraper re-confirmation / expiry job
    index("idx_jobs_last_seen").on(t.source, t.lastSeenAt),

    // Salary range filter (partial — only structured rows)
    index("idx_jobs_salary")
      .on(t.salaryMin, t.salaryMax)
      .where(sql`${t.salaryMin} IS NOT NULL`),

    // Company filter
    index("idx_jobs_company").on(t.companyNormalized, t.isActive, t.isDeleted),

    // External ID lookup (partial)
    index("idx_jobs_external_id")
      .on(t.source, t.externalId)
      .where(sql`${t.externalId} IS NOT NULL`),

    // Admin / scraper dashboard
    index("idx_jobs_scraped_at")
      .on(t.scrapedAt)
      .where(sql`${t.isActive} = true AND ${t.isDeleted} = false`),
  ],
);

// ── saved_jobs ────────────────────────────────────────────────────────────────
export const savedJobs = pgTable(
  "saved_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: text("clerk_id").notNull(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    status: savedStatusEnum("status").notNull().default("saved"),
    notes: text("notes"),
    appliedAt: timestamp("applied_at", { withTimezone: true }), // set when → applied
    isDeleted: boolean("is_deleted").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("uq_saved_jobs_clerk_job").on(t.clerkId, t.jobId),

    // User's feed — primary query
    index("idx_saved_jobs_clerk").on(t.clerkId, t.isDeleted, t.updatedAt),

    // Status filter
    index("idx_saved_jobs_clerk_status").on(t.clerkId, t.status, t.isDeleted),

    // FK cascade support
    index("idx_saved_jobs_job_id").on(t.jobId),
  ],
);

// ── saved_job_status_history ──────────────────────────────────────────────────
export const savedJobStatusHistory = pgTable(
  "saved_job_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    savedJobId: uuid("saved_job_id")
      .notNull()
      .references(() => savedJobs.id, { onDelete: "cascade" }),
    clerkId: text("clerk_id").notNull(), // denormalized for query perf
    fromStatus: savedStatusEnum("from_status"), // NULL on first transition
    toStatus: savedStatusEnum("to_status").notNull(),
    notesSnapshot: text("notes_snapshot"), // snapshot at time of change
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Timeline for a single saved job
    index("idx_status_history_saved_job").on(t.savedJobId, t.createdAt),

    // All activity for a user
    index("idx_status_history_clerk").on(t.clerkId, t.createdAt),
  ],
);

// ── scrape_logs ───────────────────────────────────────────────────────────────
export const scrapeLogs = pgTable(
  "scrape_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: jobSourceEnum("source").notNull(),
    trigger: scrapeTriggerEnum("trigger").notNull().default("scheduled"),
    status: scrapeStatusEnum("status").notNull(),
    queryRole: text("query_role"),
    queryLocation: text("query_location"),
    jobsFound: integer("jobs_found").notNull().default(0),
    jobsNew: integer("jobs_new").notNull().default(0),
    jobsUpdated: integer("jobs_updated").notNull().default(0),
    jobsFailed: integer("jobs_failed").notNull().default(0),
    pagesScraped: integer("pages_scraped").notNull().default(0),
    durationMs: integer("duration_ms"),
    error: text("error"),
    errorCode: text("error_code"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Analytics: logs by source over time
    index("idx_scrape_logs_source").on(t.source, t.startedAt),

    // Health monitoring: failed/partial runs
    index("idx_scrape_logs_failures")
      .on(t.status, t.startedAt)
      .where(sql`${t.status} != 'success'`),

    // Zombie run detection: open runs
    index("idx_scrape_logs_zombie")
      .on(t.startedAt)
      .where(sql`${t.finishedAt} IS NULL`),
  ],
);

// ── scrape_queries ────────────────────────────────────────────────────────────
export const scrapeQueries = pgTable(
  "scrape_queries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: jobSourceEnum("source").notNull(),
    role: text("role").notNull(),
    location: text("location").notNull(),
    limit: integer("limit").notNull().default(50),
    cronPattern: text("cron_pattern").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("uq_scrape_queries").on(t.source, t.role, t.location),

    // Scheduler startup
    index("idx_scrape_queries_active")
      .on(t.source, t.isActive)
      .where(sql`${t.isActive} = true`),
  ],
);

// ── users ─────────────────────────────────────────────────────────────────────
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: text("clerk_id").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    preferredLocation: text("preferred_location"),
    preferredJobType: jobTypeEnum("preferred_job_type"),
    isActive: boolean("is_active").notNull().default(true),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Auth middleware lookup — every authenticated request
    uniqueIndex("uq_users_clerk_id").on(t.clerkId),
  ],
);

// ── Inferred types ────────────────────────────────────────────────────────────

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type SavedJob = typeof savedJobs.$inferSelect;
export type NewSavedJob = typeof savedJobs.$inferInsert;
export type SavedJobStatusHistory = typeof savedJobStatusHistory.$inferSelect;
export type NewSavedJobStatusHistory = typeof savedJobStatusHistory.$inferInsert;
export type ScrapeLog = typeof scrapeLogs.$inferSelect;
export type NewScrapeLog = typeof scrapeLogs.$inferInsert;
export type ScrapeQuery = typeof scrapeQueries.$inferSelect;
export type NewScrapeQuery = typeof scrapeQueries.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

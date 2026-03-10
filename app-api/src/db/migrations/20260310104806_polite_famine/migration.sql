CREATE TYPE "experience_level" AS ENUM('internship', 'entry', 'mid', 'senior', 'lead', 'manager', 'director', 'executive');--> statement-breakpoint
CREATE TYPE "job_source" AS ENUM('linkedin', 'naukri', 'indeed');--> statement-breakpoint
CREATE TYPE "job_type" AS ENUM('full_time', 'part_time', 'contract', 'internship', 'freelance', 'temporary');--> statement-breakpoint
CREATE TYPE "saved_status" AS ENUM('saved', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "scrape_status" AS ENUM('success', 'failed', 'partial', 'skipped');--> statement-breakpoint
CREATE TYPE "scrape_trigger" AS ENUM('scheduled', 'manual', 'backfill');--> statement-breakpoint
CREATE TYPE "work_mode" AS ENUM('onsite', 'remote', 'hybrid');--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"url" text NOT NULL,
	"url_hash" char(64) NOT NULL,
	"external_id" text,
	"title" text NOT NULL,
	"title_normalized" text NOT NULL,
	"company" text NOT NULL,
	"company_normalized" text NOT NULL,
	"location_raw" text,
	"city" text,
	"state" text,
	"country" char(2) DEFAULT 'IN',
	"is_remote" boolean DEFAULT false NOT NULL,
	"work_mode" "work_mode",
	"source" "job_source" NOT NULL,
	"job_type" "job_type",
	"experience_level" "experience_level",
	"salary_raw" text,
	"salary_min" integer,
	"salary_max" integer,
	"salary_currency" char(3) DEFAULT 'INR',
	"description" text,
	"description_tsv" tsvector,
	"skills_raw" text[],
	"apply_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"posted_at" timestamp with time zone,
	"scraped_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_job_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"saved_job_id" uuid NOT NULL,
	"clerk_id" text NOT NULL,
	"from_status" "saved_status",
	"to_status" "saved_status" NOT NULL,
	"notes_snapshot" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"clerk_id" text NOT NULL,
	"job_id" uuid NOT NULL,
	"status" "saved_status" DEFAULT 'saved'::"saved_status" NOT NULL,
	"notes" text,
	"applied_at" timestamp with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_saved_jobs_clerk_job" UNIQUE("clerk_id","job_id")
);
--> statement-breakpoint
CREATE TABLE "scrape_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"source" "job_source" NOT NULL,
	"trigger" "scrape_trigger" DEFAULT 'scheduled'::"scrape_trigger" NOT NULL,
	"status" "scrape_status" NOT NULL,
	"query_role" text,
	"query_location" text,
	"jobs_found" integer DEFAULT 0 NOT NULL,
	"jobs_new" integer DEFAULT 0 NOT NULL,
	"jobs_updated" integer DEFAULT 0 NOT NULL,
	"jobs_failed" integer DEFAULT 0 NOT NULL,
	"pages_scraped" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer,
	"error" text,
	"error_code" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrape_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"source" "job_source" NOT NULL,
	"role" text NOT NULL,
	"location" text NOT NULL,
	"limit" integer DEFAULT 50 NOT NULL,
	"cron_pattern" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_scrape_queries" UNIQUE("source","role","location")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"clerk_id" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"preferred_location" text,
	"preferred_job_type" "job_type",
	"is_active" boolean DEFAULT true NOT NULL,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_jobs_url_hash" ON "jobs" ("url_hash");--> statement-breakpoint
CREATE INDEX "idx_jobs_feed" ON "jobs" ("source","is_active","is_deleted","posted_at");--> statement-breakpoint
CREATE INDEX "idx_jobs_city" ON "jobs" ("city","is_active","is_deleted","posted_at");--> statement-breakpoint
CREATE INDEX "idx_jobs_job_type" ON "jobs" ("job_type","is_active","is_deleted","posted_at");--> statement-breakpoint
CREATE INDEX "idx_jobs_work_mode" ON "jobs" ("work_mode","is_active","is_deleted","posted_at");--> statement-breakpoint
CREATE INDEX "idx_jobs_compound" ON "jobs" ("source","city","job_type","is_active","is_deleted","posted_at");--> statement-breakpoint
CREATE INDEX "idx_jobs_last_seen" ON "jobs" ("source","last_seen_at");--> statement-breakpoint
CREATE INDEX "idx_jobs_salary" ON "jobs" ("salary_min","salary_max") WHERE "salary_min" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_jobs_company" ON "jobs" ("company_normalized","is_active","is_deleted");--> statement-breakpoint
CREATE INDEX "idx_jobs_external_id" ON "jobs" ("source","external_id") WHERE "external_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_jobs_scraped_at" ON "jobs" ("scraped_at") WHERE "is_active" = true AND "is_deleted" = false;--> statement-breakpoint
CREATE INDEX "idx_status_history_saved_job" ON "saved_job_status_history" ("saved_job_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_status_history_clerk" ON "saved_job_status_history" ("clerk_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_saved_jobs_clerk" ON "saved_jobs" ("clerk_id","is_deleted","updated_at");--> statement-breakpoint
CREATE INDEX "idx_saved_jobs_clerk_status" ON "saved_jobs" ("clerk_id","status","is_deleted");--> statement-breakpoint
CREATE INDEX "idx_saved_jobs_job_id" ON "saved_jobs" ("job_id");--> statement-breakpoint
CREATE INDEX "idx_scrape_logs_source" ON "scrape_logs" ("source","started_at");--> statement-breakpoint
CREATE INDEX "idx_scrape_logs_failures" ON "scrape_logs" ("status","started_at") WHERE "status" != 'success';--> statement-breakpoint
CREATE INDEX "idx_scrape_logs_zombie" ON "scrape_logs" ("started_at") WHERE "finished_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_scrape_queries_active" ON "scrape_queries" ("source","is_active") WHERE "is_active" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_users_clerk_id" ON "users" ("clerk_id");--> statement-breakpoint
ALTER TABLE "saved_job_status_history" ADD CONSTRAINT "saved_job_status_history_saved_job_id_saved_jobs_id_fkey" FOREIGN KEY ("saved_job_id") REFERENCES "saved_jobs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_job_id_jobs_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE;
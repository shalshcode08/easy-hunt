import { and, count, desc, eq, gte, inArray, lte, or, ilike, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { jobs, userJobFeed } from "@/db/schema";
import { createError } from "@/middleware/errorHandler";

export const getJobsQuerySchema = z.object({
  q: z.string().max(200).optional(),
  source: z.enum(["linkedin", "naukri", "indeed"]).optional(),
  city: z.string().optional(),
  jobType: z
    .enum(["full_time", "part_time", "contract", "internship", "freelance", "temporary"])
    .optional(),
  workMode: z.enum(["onsite", "remote", "hybrid"]).optional(),
  datePosted: z.enum(["24h", "7d", "30d"]).optional(),
  salaryMin: z.coerce.number().int().positive().optional(),
  salaryMax: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type GetJobsQuery = z.infer<typeof getJobsQuerySchema>;

const datePostedMs: Record<string, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export const JobsService = {
  getJobs: async (query: GetJobsQuery, clerkId: string) => {
    const { q, source, city, jobType, workMode, datePosted, salaryMin, salaryMax, page, limit } =
      query;

    // Fetch job IDs from this user's feed
    const feedRows = await db
      .select({ jobId: userJobFeed.jobId })
      .from(userJobFeed)
      .where(
        and(
          eq(userJobFeed.clerkId, clerkId),
          source ? eq(userJobFeed.platform, source) : undefined,
        ),
      );

    // No connections yet — return empty feed instead of leaking global data
    if (feedRows.length === 0) {
      return { jobs: [], total: 0, page, limit, totalPages: 0 };
    }

    const feedJobIds = feedRows.map((r) => r.jobId);

    // Full-text + partial match search across title, company, and description
    const qTrimmed = q?.trim();
    const searchCond = qTrimmed
      ? or(
          ilike(jobs.titleNormalized, `%${qTrimmed.toLowerCase()}%`),
          ilike(jobs.companyNormalized, `%${qTrimmed.toLowerCase()}%`),
          sql`(${jobs.description} IS NOT NULL AND to_tsvector('english', ${jobs.description}) @@ websearch_to_tsquery('english', ${qTrimmed}))`,
        )
      : undefined;

    const where = and(
      eq(jobs.isActive, true),
      eq(jobs.isDeleted, false),
      inArray(jobs.id, feedJobIds),
      searchCond,
      city ? eq(jobs.city, city) : undefined,
      jobType ? eq(jobs.jobType, jobType) : undefined,
      workMode ? eq(jobs.workMode, workMode) : undefined,
      datePosted ? gte(jobs.postedAt, new Date(Date.now() - datePostedMs[datePosted]!)) : undefined,
      salaryMin ? gte(jobs.salaryMin, salaryMin) : undefined,
      salaryMax ? lte(jobs.salaryMax, salaryMax) : undefined,
    );

    const [{ total }] = await db.select({ total: count() }).from(jobs).where(where);

    const data = await db
      .select()
      .from(jobs)
      .where(where)
      .orderBy(desc(jobs.postedAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      jobs: data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  getJobById: async (id: string) => {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    if (!job) throw createError("Job not found", 404, "NOT_FOUND");
    return job;
  },
};

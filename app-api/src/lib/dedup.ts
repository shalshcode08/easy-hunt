import { createHash } from "crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { jobs } from "@/db/schema";
import type { NewJob } from "@/db/schema";

export const hashUrl = (url: string): string =>
  createHash("sha256").update(url).digest("hex");

export const upsertJobs = async (
  newJobs: NewJob[]
): Promise<{ inserted: number; updated: number }> => {
  if (newJobs.length === 0) return { inserted: 0, updated: 0 };

  let inserted = 0;
  let updated = 0;

  for (const job of newJobs) {
    const result = await db
      .insert(jobs)
      .values(job)
      .onConflictDoUpdate({
        target: jobs.urlHash,
        set: {
          lastSeenAt: sql`now()`,
          isActive: true,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: jobs.id, createdAt: jobs.createdAt, updatedAt: jobs.updatedAt });

    const row = result[0];
    if (row) {
      // If createdAt and updatedAt are within 1 second, it was a fresh insert
      const diff = new Date(row.updatedAt!).getTime() - new Date(row.createdAt).getTime();
      diff < 1000 ? inserted++ : updated++;
    }
  }

  return { inserted, updated };
};

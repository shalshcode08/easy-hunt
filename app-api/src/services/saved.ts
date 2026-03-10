import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { savedJobs, savedJobStatusHistory, jobs } from "@/db/schema";
import { createError } from "@/middleware/errorHandler";

export const saveJobSchema = z.object({
  jobId: z.string().uuid(),
});

export const updateSavedJobSchema = z.object({
  status: z
    .enum(["saved", "applied", "interviewing", "offered", "rejected", "withdrawn"])
    .optional(),
  notes: z.string().optional(),
});

export type SaveJobBody = z.infer<typeof saveJobSchema>;
export type UpdateSavedJobBody = z.infer<typeof updateSavedJobSchema>;

export const getSavedJobsQuerySchema = z.object({
  status: z
    .enum(["saved", "applied", "interviewing", "offered", "rejected", "withdrawn"])
    .optional(),
});

export type GetSavedJobsQuery = z.infer<typeof getSavedJobsQuerySchema>;

export const SavedService = {
  getSavedJobs: async (clerkId: string, query: GetSavedJobsQuery = {}) => {
    const where = and(
      eq(savedJobs.clerkId, clerkId),
      eq(savedJobs.isDeleted, false),
      query.status ? eq(savedJobs.status, query.status) : undefined,
    );

    return db
      .select({ savedJob: savedJobs, job: jobs })
      .from(savedJobs)
      .innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
      .where(where)
      .orderBy(savedJobs.updatedAt);
  },

  saveJob: async (clerkId: string, body: SaveJobBody) => {
    return db.transaction(async (tx) => {
      const [saved] = await tx.insert(savedJobs).values({ clerkId, jobId: body.jobId }).returning();

      await tx.insert(savedJobStatusHistory).values({
        savedJobId: saved!.id,
        clerkId,
        fromStatus: null,
        toStatus: "saved",
      });

      return saved;
    });
  },

  updateSavedJob: async (clerkId: string, id: string, body: UpdateSavedJobBody) => {
    return db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(savedJobs)
        .where(
          and(eq(savedJobs.id, id), eq(savedJobs.clerkId, clerkId), eq(savedJobs.isDeleted, false)),
        );

      if (!existing) throw createError("Saved job not found", 404, "NOT_FOUND");

      const [updated] = await tx
        .update(savedJobs)
        .set({
          ...body,
          appliedAt:
            body.status === "applied" && existing.status !== "applied"
              ? new Date()
              : existing.appliedAt,
          updatedAt: new Date(),
        })
        .where(eq(savedJobs.id, id))
        .returning();

      if (body.status && body.status !== existing.status) {
        await tx.insert(savedJobStatusHistory).values({
          savedJobId: id,
          clerkId,
          fromStatus: existing.status,
          toStatus: body.status,
          notesSnapshot: body.notes ?? existing.notes ?? undefined,
        });
      }

      return updated;
    });
  },

  deleteSavedJob: async (clerkId: string, id: string) => {
    const [existing] = await db
      .select()
      .from(savedJobs)
      .where(
        and(eq(savedJobs.id, id), eq(savedJobs.clerkId, clerkId), eq(savedJobs.isDeleted, false)),
      );

    if (!existing) throw createError("Saved job not found", 404, "NOT_FOUND");

    await db
      .update(savedJobs)
      .set({ isDeleted: true, deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(savedJobs.id, id));
  },
};

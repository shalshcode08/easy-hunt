"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { JobCard } from "@/components/jobs/JobCard";
import { JobDetail } from "@/components/jobs/JobDetail";
import { useJobs } from "@/hooks/useJobs";
import { useSavedJobs, useSavedJobsMutations } from "@/hooks/useSavedJobs";
import type { Job, JobSource, WorkMode } from "@/lib/types";

function JobCardSkeleton() {
  return (
    <div className="rounded-[14px] border border-border px-4 py-4 flex flex-col gap-3 animate-pulse">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-[8px] bg-muted shrink-0" />
        <div className="h-3.5 bg-muted rounded-full w-28" />
        <div className="ml-auto h-5 bg-muted rounded-full w-16" />
      </div>
      <div className="h-4 bg-muted rounded-full w-3/4" />
      <div className="flex gap-2">
        <div className="h-3 bg-muted rounded-full w-20" />
        <div className="h-3 bg-muted rounded-full w-14" />
        <div className="h-3 bg-muted rounded-full w-16" />
      </div>
    </div>
  );
}

function FeedContent() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const searchParams = useSearchParams();

  const q          = searchParams.get("q") ?? "";
  const source     = searchParams.get("source") as JobSource | undefined ?? undefined;
  const workMode   = searchParams.get("workMode") as WorkMode | undefined ?? undefined;
  const city       = searchParams.get("city") ?? undefined;

  const { data, isLoading, error } = useJobs({ source, workMode, city, limit: 50 });
  const { data: savedData }        = useSavedJobs();
  const mutations                  = useSavedJobsMutations();

  const savedJobIds = new Set(savedData?.map((s) => s.savedJob.jobId) ?? []);

  const jobs = (data?.jobs ?? []).filter((job) => {
    if (!q.trim()) return true;
    const lq = q.toLowerCase();
    return (
      job.title.toLowerCase().includes(lq) ||
      job.company.toLowerCase().includes(lq) ||
      (job.city ?? "").toLowerCase().includes(lq) ||
      (job.skillsRaw ?? []).some((s) => s.toLowerCase().includes(lq))
    );
  });

  function toggleSave(job: Job) {
    const existing = savedData?.find((s) => s.savedJob.jobId === job.id);
    if (existing) {
      mutations.remove(existing.savedJob.id);
    } else {
      mutations.save(job.id);
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
        <div className="px-4 lg:px-6 pt-4 pb-2 shrink-0">
          {isLoading ? (
            <p className="text-xs text-muted-foreground/50">Loading jobs…</p>
          ) : error ? (
            <p className="text-xs text-destructive/70">Failed to load jobs</p>
          ) : (
            <p className="text-xs text-muted-foreground/50">
              {jobs.length} {jobs.length === 1 ? "job" : "jobs"} found
            </p>
          )}
        </div>

        <div className="flex-1 px-4 lg:px-6 pb-8">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => <JobCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm font-medium text-foreground">Could not load jobs</p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                {error.isServerError ? "Server error — try again later" : error.message}
              </p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm font-medium text-foreground">No jobs found</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Try adjusting your filters or search</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  active={selectedJob?.id === job.id}
                  saved={savedJobIds.has(job.id)}
                  onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                  onSave={() => toggleSave(job)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedJob && (
        <JobDetail
          job={selectedJob}
          saved={savedJobIds.has(selectedJob.id)}
          onClose={() => setSelectedJob(null)}
          onSave={() => toggleSave(selectedJob)}
        />
      )}
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense>
      <FeedContent />
    </Suspense>
  );
}

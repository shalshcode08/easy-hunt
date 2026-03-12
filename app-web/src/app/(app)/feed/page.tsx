"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Plug, Loader2 } from "lucide-react";
import { JobCard } from "@/components/jobs/JobCard";
import { JobDetail } from "@/components/jobs/JobDetail";
import { useInfiniteJobs } from "@/hooks/useInfiniteJobs";
import { useSavedJobs, useSavedJobsMutations } from "@/hooks/useSavedJobs";
import { usePlatforms } from "@/contexts/PlatformContext";
import type { Job, JobSource, WorkMode } from "@/lib/types";

function JobCardSkeleton() {
  return (
    <div className="rounded-[10px] border border-border px-4 py-4 flex flex-col gap-3 animate-pulse">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-[6px] bg-muted shrink-0" />
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
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { connections, loading: platformsLoading, justConnected, startConnect } = usePlatforms();

  const q = searchParams.get("q") ?? "";
  const source = (searchParams.get("source") as JobSource | undefined) ?? undefined;
  const workMode = (searchParams.get("workMode") as WorkMode | undefined) ?? undefined;
  const city = searchParams.get("city") ?? undefined;

  const hasActiveConnections = connections.some((c) => c.status === "active");
  const isScrapePending =
    hasActiveConnections && connections.some((c) => c.status === "active" && c.scrapeCount === 0);
  const showScrapingBanner = justConnected || isScrapePending;

  const { jobs, total, isLoading, isFetchingMore, hasMore, error, loadMore, mutate } =
    useInfiniteJobs({ q: q || undefined, source, workMode, city });
  const { data: savedData } = useSavedJobs();
  const mutations = useSavedJobsMutations();

  // Poll every 10s while scraping is pending
  useEffect(() => {
    if (!showScrapingBanner) return;
    const id = setInterval(() => mutate(), 10_000);
    return () => clearInterval(id);
  }, [showScrapingBanner, mutate]);

  // Infinite scroll: load next page when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const savedJobIds = new Set(savedData?.map((s) => s.savedJob.jobId) ?? []);

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
        {/* Scraping in progress banner */}
        {showScrapingBanner && (
          <div className="mx-4 lg:mx-6 mt-4 flex items-center gap-3 px-4 py-3 rounded-[10px] bg-primary/10 border border-primary/20 text-sm text-primary shrink-0">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span className="flex-1">Fetching your jobs — this takes about a minute.</span>
          </div>
        )}

        <div className="px-4 lg:px-6 pt-4 pb-2 shrink-0">
          {isLoading ? (
            <p className="text-xs text-muted-foreground/50">Loading jobs…</p>
          ) : error ? (
            <p className="text-xs text-destructive/70">Failed to load jobs</p>
          ) : (
            <p className="text-xs text-muted-foreground/50">
              {total} {total === 1 ? "job" : "jobs"} found
            </p>
          )}
        </div>

        <div className="flex-1 px-4 lg:px-6 pb-8">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm font-medium text-foreground">Could not load jobs</p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                {error.isServerError ? "Server error — try again later" : error.message}
              </p>
            </div>
          ) : jobs.length === 0 && showScrapingBanner ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground/60 mt-2">Scraping jobs for you…</p>
              <p className="text-xs text-muted-foreground/40">
                Usually takes under a minute. The page will update automatically.
              </p>
            </div>
          ) : jobs.length === 0 && !platformsLoading && !hasActiveConnections ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plug className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Connect a platform to get started
                </p>
                <p className="text-xs text-muted-foreground/50 mt-1 max-w-[260px]">
                  Link your LinkedIn, Naukri, or Indeed account — we'll fetch jobs personalised to
                  you.
                </p>
              </div>
              <div className="flex gap-2">
                {(["linkedin", "naukri", "indeed"] as const).map((id) => (
                  <button
                    key={id}
                    onClick={() => startConnect(id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-[6px] bg-muted border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors text-foreground capitalize"
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm font-medium text-foreground">No jobs found</p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                Try adjusting your filters or search
              </p>
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

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="py-2 flex justify-center">
                {isFetchingMore && <Loader2 className="w-4 h-4 text-muted-foreground/40 animate-spin" />}
              </div>
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

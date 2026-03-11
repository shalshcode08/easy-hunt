"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { JobCard } from "@/components/jobs/JobCard";
import { JobDetail } from "@/components/jobs/JobDetail";
import { MOCK_JOBS, type MockJob } from "@/components/jobs/mock";

function FeedContent() {
  const [selectedJob, setSelectedJob] = useState<MockJob | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const filtered = MOCK_JOBS.filter((job) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.city.toLowerCase().includes(q) ||
      job.skills.some((s) => s.toLowerCase().includes(q))
    );
  });

  function toggleSave(id: string) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Feed column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
        {/* Results count */}
        <div className="px-4 lg:px-6 pt-4 pb-2 shrink-0">
          <p className="text-xs text-muted-foreground/50">
            {filtered.length} {filtered.length === 1 ? "job" : "jobs"} found
          </p>
        </div>

        {/* Job list */}
        <div className="flex-1 px-4 lg:px-6 pb-8">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm font-medium text-foreground">No jobs found</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  active={selectedJob?.id === job.id}
                  saved={savedIds.has(job.id)}
                  onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                  onSave={() => toggleSave(job.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedJob && (
        <JobDetail
          job={selectedJob}
          saved={savedIds.has(selectedJob.id)}
          onClose={() => setSelectedJob(null)}
          onSave={() => toggleSave(selectedJob.id)}
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

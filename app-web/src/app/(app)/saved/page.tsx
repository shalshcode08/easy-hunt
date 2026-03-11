"use client";

import { useState } from "react";
import { Bookmark, Trash2, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MOCK_JOBS, type MockJob } from "@/components/jobs/mock";
import { JobDetail } from "@/components/jobs/JobDetail";

interface SavedJob {
  id: string;
  jobId: string;
  savedAt: string;
  tracking?: boolean;
}

const MOCK_SAVED: SavedJob[] = [
  { id: "s1", jobId: "1", savedAt: "2d ago" },
  { id: "s2", jobId: "2", savedAt: "3d ago" },
  { id: "s3", jobId: "4", savedAt: "4d ago" },
  { id: "s4", jobId: "3", savedAt: "1d ago" },
  { id: "s5", jobId: "6", savedAt: "5h ago" },
  { id: "s6", jobId: "8", savedAt: "2h ago" },
];

const WORK_MODE_CONFIG = {
  remote: { label: "Remote", color: "text-primary",          bg: "bg-primary/8" },
  hybrid: { label: "Hybrid", color: "text-[#ff9f68]",        bg: "bg-[#ff9f68]/10" },
  onsite: { label: "Onsite", color: "text-muted-foreground", bg: "bg-muted" },
};

const SOURCE_LOGOS: Record<string, string> = {
  linkedin: "/linkedin-logo.png",
  naukri:   "/naukri-logo.png",
  indeed:   "/indeed-logo.png",
};

function isStale(savedAt: string): boolean {
  const match = savedAt.match(/^(\d+)d ago$/);
  return match ? parseInt(match[1]) > 3 : false;
}

export default function SavedPage() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>(MOCK_SAVED);
  const [selectedJob, setSelectedJob] = useState<MockJob | null>(null);

  function remove(id: string) {
    setSavedJobs((prev) => prev.filter((s) => s.id !== id));
    // close detail if the removed job is open
    const removed = savedJobs.find((s) => s.id === id);
    if (removed && selectedJob?.id === removed.jobId) setSelectedJob(null);
  }

  function startTracking(id: string) {
    // TODO: PATCH /api/v1/saved/:id { status: "applied" } → adds to Tracker pipeline
    setSavedJobs((prev) => prev.map((s) => s.id === id ? { ...s, tracking: true } : s));
  }

  function openDetail(job: MockJob) {
    setSelectedJob((prev) => prev?.id === job.id ? null : job);
  }

  if (savedJobs.length === 0) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="w-14 h-14 rounded-[14px] bg-muted border border-border flex items-center justify-center">
          <Bookmark className="w-6 h-6 text-muted-foreground/30" />
        </div>
        <div>
          <p className="font-serif text-xl text-foreground">Your shortlist is empty</p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            Bookmark jobs from your feed to review them here before applying
          </p>
        </div>
        <Link
          href="/feed"
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Browse feed <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </main>
    );
  }

  const staleCount = savedJobs.filter((s) => isStale(s.savedAt)).length;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* List column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
        {/* Header */}
        <div className="px-4 lg:px-6 pt-5 pb-4 border-b border-border shrink-0">
          <h1 className="font-serif text-2xl text-foreground">Saved Jobs</h1>
          <p className="text-xs text-muted-foreground/50 mt-0.5">
            {savedJobs.length} job{savedJobs.length !== 1 ? "s" : ""} shortlisted · click a card to preview · track when ready to apply
          </p>
        </div>

        {/* Stale nudge */}
        {staleCount > 0 && (
          <div className="mx-4 lg:mx-6 mt-3 flex items-center gap-2 px-3 py-2 rounded-[10px] bg-amber-500/8 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              {staleCount} job{staleCount !== 1 ? "s have" : " has"} been sitting here for over 3 days — apply or clear them out.
            </p>
          </div>
        )}

        {/* Cards */}
        <div className="px-4 lg:px-6 py-4 flex flex-col gap-3">
          {savedJobs.map((saved) => {
            const job = MOCK_JOBS.find((j) => j.id === saved.jobId);
            if (!job) return null;
            const stale = isStale(saved.savedAt);
            const wm = WORK_MODE_CONFIG[job.workMode];
            const isActive = selectedJob?.id === job.id;

            return (
              <div
                key={saved.id}
                onClick={() => openDetail(job)}
                className={cn(
                  "rounded-[14px] border bg-card p-4 flex flex-col gap-3 cursor-pointer transition-colors",
                  isActive
                    ? "border-primary/30 bg-primary/[0.02]"
                    : stale
                    ? "border-amber-500/25 bg-amber-500/[0.02] hover:border-amber-500/40"
                    : "border-border hover:border-border/80"
                )}
              >
                {/* Company row */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[8px] bg-muted border border-border flex items-center justify-center text-xs font-semibold text-foreground shrink-0">
                    {job.company[0]}
                  </div>
                  <span className="text-sm font-medium text-foreground flex-1 truncate">{job.company}</span>
                  {stale && (
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                      {saved.savedAt}
                    </span>
                  )}
                  <Image
                    src={SOURCE_LOGOS[job.source]}
                    alt={job.source}
                    width={13}
                    height={13}
                    className="rounded-[3px] object-contain opacity-50 shrink-0"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(saved.id); }}
                    className="w-7 h-7 rounded-[8px] flex items-center justify-center text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Title + meta */}
                <div>
                  <p className="text-base font-semibold text-foreground leading-snug">{job.title}</p>
                  <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 mt-1.5">
                    <MapPin className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                    <span className="text-[12px] text-muted-foreground/60">{job.city}</span>
                    <span className="text-muted-foreground/30 text-[10px]">·</span>
                    <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded-full", wm.bg, wm.color)}>
                      {wm.label}
                    </span>
                    {job.salary && (
                      <>
                        <span className="text-muted-foreground/30 text-[10px]">·</span>
                        <span className="text-[12px] font-semibold text-muted-foreground/70">{job.salary}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Skills */}
                {job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground/60"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 4 && (
                      <span className="text-[11px] text-muted-foreground/35 self-center">
                        +{job.skills.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between border-border/40">
                  {!stale ? (
                    <span className="text-[11px] text-muted-foreground/40">Saved {saved.savedAt}</span>
                  ) : (
                    <span />
                  )}
                  {saved.tracking ? (
                    <Link
                      href="/tracker"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      In Tracker
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); startTracking(saved.id); }}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[8px] bg-foreground text-background hover:bg-foreground/80 transition-colors shrink-0"
                    >
                      Track application
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selectedJob && (
        <JobDetail
          job={selectedJob}
          saved={true}
          onClose={() => setSelectedJob(null)}
          onSave={() => {
            const match = savedJobs.find((s) => s.jobId === selectedJob.id);
            if (match) remove(match.id);
            setSelectedJob(null);
          }}
        />
      )}
    </div>
  );
}

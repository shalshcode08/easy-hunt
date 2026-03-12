"use client";

import { X, MapPin, ExternalLink, Bookmark } from "lucide-react";
import { cn, formatJobType } from "@/lib/utils";
import type { Job } from "@/lib/types";

const SOURCE_CONFIG = {
  linkedin: { label: "LinkedIn", color: "bg-[#6b9eff]/15 text-[#6b9eff] border-[#6b9eff]/20" },
  naukri: { label: "Naukri", color: "bg-[#ff9f68]/15 text-[#ff9f68] border-[#ff9f68]/20" },
  indeed: { label: "Indeed", color: "bg-[#59c77a]/15 text-[#59c77a] border-[#59c77a]/20" },
};

const WORK_MODE_CONFIG = {
  remote: { label: "Remote", color: "bg-primary/10 text-primary border-primary/20" },
  hybrid: { label: "Hybrid", color: "bg-[#ff9f68]/10 text-[#ff9f68] border-[#ff9f68]/20" },
  onsite: { label: "On-site", color: "bg-muted text-muted-foreground border-border" },
};

interface JobDetailProps {
  job: Job | null;
  saved?: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function JobDetail({ job, saved, onClose, onSave }: JobDetailProps) {
  if (!job) return null;

  const source = SOURCE_CONFIG[job.source];
  const workMode = WORK_MODE_CONFIG[job.workMode ?? "onsite"];
  const paragraphs = (job.description ?? "").split("\n\n").filter(Boolean);

  return (
    <>
      <div
        className="lg:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed z-[70] bottom-0 left-0 right-0 h-[92dvh] rounded-t-[14px]",
          "lg:static lg:h-full lg:w-[420px] xl:w-[460px] lg:z-auto lg:rounded-none lg:bottom-auto lg:left-auto lg:right-auto",
          "bg-card border-t lg:border-t-0 lg:border-l border-border",
          "flex flex-col shrink-0 shadow-2xl lg:shadow-none",
        )}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[8px] bg-muted border border-border flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-foreground">{job.company[0]}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{job.company}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3 h-3 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground/60">
                    {job.locationRaw ?? job.city ?? "—"}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h2 className="font-serif text-xl leading-snug text-foreground mb-3">{job.title}</h2>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "text-[11px] font-semibold px-2.5 py-1 rounded-full border",
                source.color,
              )}
            >
              {source.label}
            </span>
            <span
              className={cn(
                "text-[11px] font-semibold px-2.5 py-1 rounded-full border",
                workMode.color,
              )}
            >
              {workMode.label}
            </span>
            {job.jobType && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-border bg-muted text-muted-foreground">
                {formatJobType(job.jobType)}
              </span>
            )}
            {job.salaryRaw && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-border bg-muted text-foreground">
                {job.salaryRaw}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {(job.skillsRaw ?? []).length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2.5">
                Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(job.skillsRaw ?? []).map((skill) => (
                  <span
                    key={skill}
                    className="text-xs px-2.5 py-1 rounded-[8px] bg-muted border border-border text-foreground/80"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {paragraphs.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">
                About the role
              </p>
              <div className="space-y-3">
                {paragraphs.map((para, i) => {
                  if (para.startsWith("**") && para.endsWith("**")) {
                    return (
                      <p key={i} className="text-sm font-semibold text-foreground">
                        {para.replace(/\*\*/g, "")}
                      </p>
                    );
                  }
                  if (para.startsWith("- ")) {
                    return (
                      <ul key={i} className="space-y-1.5">
                        {para
                          .split("\n")
                          .filter((l) => l.startsWith("- "))
                          .map((item, j) => (
                            <li
                              key={j}
                              className="flex items-start gap-2 text-sm text-muted-foreground"
                            >
                              <span className="w-1 h-1 rounded-full bg-primary/50 shrink-0 mt-2" />
                              {item.replace("- ", "")}
                            </li>
                          ))}
                      </ul>
                    );
                  }
                  return (
                    <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                      {para.replace(/\*\*/g, "")}
                    </p>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center gap-3">
          {job.applyUrl ? (
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold py-2.5 rounded-[8px] transition-colors"
            >
              Apply Now <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <div className="flex-1" />
          )}
          <button
            onClick={onSave}
            className={cn(
              "w-10 h-10 rounded-[8px] flex items-center justify-center border transition-colors",
              saved
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <Bookmark className={cn("w-4 h-4", saved && "fill-primary")} />
          </button>
        </div>
      </div>
    </>
  );
}

"use client";

import { Bookmark, MapPin } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import type { Job } from "@/lib/types";

const SOURCE_CONFIG = {
  linkedin: { label: "LinkedIn", color: "bg-[#6b9eff]/15 text-[#6b9eff] border-[#6b9eff]/20" },
  naukri: { label: "Naukri", color: "bg-[#ff9f68]/15 text-[#ff9f68] border-[#ff9f68]/20" },
  indeed: { label: "Indeed", color: "bg-[#59c77a]/15 text-[#59c77a] border-[#59c77a]/20" },
};

const WORK_MODE_CONFIG = {
  remote: { label: "Remote", color: "bg-primary/10 text-primary" },
  hybrid: { label: "Hybrid", color: "bg-[#ff9f68]/10 text-[#ff9f68]" },
  onsite: { label: "On-site", color: "bg-muted text-muted-foreground" },
};

interface JobCardProps {
  job: Job;
  active?: boolean;
  saved?: boolean;
  onClick: () => void;
  onSave: () => void;
}

export function JobCard({ job, active, saved, onClick, onSave }: JobCardProps) {
  const source = SOURCE_CONFIG[job.source];
  const workMode = WORK_MODE_CONFIG[job.workMode ?? "onsite"];

  return (
    <div
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-[10px] border px-4 py-4 transition-all duration-150 group cursor-pointer",
        "hover:border-border/60 hover:bg-card",
        active ? "bg-card border-primary/30 shadow-sm" : "bg-transparent border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-[6px] bg-muted border border-border flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-foreground">{job.company[0]}</span>
          </div>
          <span className="text-sm font-medium text-muted-foreground truncate">{job.company}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
              source.color,
            )}
          >
            {source.label}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            className={cn(
              "w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors",
              saved
                ? "text-primary bg-primary/10"
                : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted",
            )}
          >
            <Bookmark className={cn("w-3.5 h-3.5", saved && "fill-primary")} />
          </button>
        </div>
      </div>

      <h3
        className={cn(
          "text-sm font-semibold leading-snug mb-2.5 pr-2",
          active ? "text-foreground" : "text-foreground/90 group-hover:text-foreground",
        )}
      >
        {job.title}
      </h3>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-muted-foreground/60">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="text-[11px]">{job.city ?? "—"}</span>
        </div>
        <span className="text-muted-foreground/30 text-[11px]">·</span>
        <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded-md", workMode.color)}>
          {workMode.label}
        </span>
        {job.salaryRaw && (
          <>
            <span className="text-muted-foreground/30 text-[11px]">·</span>
            <span className="text-[11px] font-medium text-foreground/70">{job.salaryRaw}</span>
          </>
        )}
        <span className="ml-auto text-[10px] text-muted-foreground/40">
          {timeAgo(job.postedAt)}
        </span>
      </div>
    </div>
  );
}

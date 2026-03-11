"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Check, Plug, ExternalLink, Search } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { usePlatforms, type PlatformId } from "@/contexts/PlatformContext";

const PLATFORMS = [
  {
    id: "linkedin",
    label: "LinkedIn",
    description: "Professional network jobs",
    logo: "/linkedin-logo.png",
    bg: "bg-[#6b9eff]/10",
    border: "border-[#6b9eff]/20",
    dot: "bg-[#6b9eff]",
  },
  {
    id: "naukri",
    label: "Naukri",
    description: "India's largest job board",
    logo: "/naukri-logo.png",
    bg: "bg-[#ff9f68]/10",
    border: "border-[#ff9f68]/20",
    dot: "bg-[#ff9f68]",
  },
  {
    id: "indeed",
    label: "Indeed",
    description: "Global job search engine",
    logo: "/indeed-logo.png",
    bg: "bg-[#59c77a]/10",
    border: "border-[#59c77a]/20",
    dot: "bg-[#59c77a]",
  },
];

export function TopBar() {
  const { connectedIds, connect, disconnect } = usePlatforms();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";

  function handleSearch(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("q", value);
    else params.delete("q");
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const connectedCount = connectedIds.length;

  return (
    <header className="sticky top-0 z-20 h-14 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between gap-3 px-4 lg:px-6 shrink-0">
      {/* Search bar */}
      <div className="flex-1 flex items-center gap-2 bg-muted border border-border rounded-[10px] px-3 h-8 focus-within:border-primary/40 transition-colors max-w-lg">
        <Search className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search jobs, companies, skills…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
        />
      </div>

      <div ref={ref} className="relative">
        {/* Trigger button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex items-center gap-2 h-8 pl-3 pr-2.5 rounded-[10px] border text-sm font-medium transition-colors",
            connectedCount > 0
              ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/15"
              : "bg-muted border-border text-muted-foreground hover:text-foreground hover:border-border/80",
          )}
        >
          <Plug className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{connectedCount > 0 ? `${connectedCount} connected` : "Connect platforms"}</span>

          {/* Platform icon indicators */}
          <div className="flex items-center gap-1 ml-0.5">
            {PLATFORMS.map((p) => (
              <Image
                key={p.id}
                src={p.logo}
                alt={p.label}
                width={12}
                height={12}
                className={cn(
                  "rounded-sm object-contain transition-opacity",
                  connectedIds.includes(p.id as "linkedin" | "naukri" | "indeed") ? "opacity-100" : "opacity-40",
                )}
              />
            ))}
          </div>

          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-[calc(100%+6px)] w-[288px] bg-popover border border-border rounded-[14px] shadow-xl overflow-hidden z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-semibold text-foreground">Job Platforms</p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                Connect accounts to personalise your feed
              </p>
            </div>

            {/* Platform list */}
            <div className="p-2 flex flex-col gap-1">
              {PLATFORMS.map((platform) => {
                const connected = connectedIds.includes(platform.id as PlatformId);
                return (
                  <div
                    key={platform.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-[10px] border transition-colors",
                      connected
                        ? `${platform.bg} ${platform.border}`
                        : "border-transparent hover:bg-muted",
                    )}
                  >
                    {/* Platform logo */}
                    <Image
                      src={platform.logo}
                      alt={platform.label}
                      width={22}
                      height={22}
                      className="rounded-[6px] object-contain shrink-0"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{platform.label}</p>
                      <p className="text-[11px] text-muted-foreground/60 truncate">
                        {platform.description}
                      </p>
                    </div>

                    {/* Action */}
                    {connected ? (
                      <button
                        onClick={() => disconnect(platform.id as PlatformId)}
                        className="flex items-center gap-1.5 shrink-0 text-xs font-medium text-primary hover:text-destructive transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Connected
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          connect(platform.id as PlatformId);
                          // TODO: trigger real OAuth flow
                        }}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-[8px] bg-foreground text-background hover:bg-foreground/80 transition-colors shrink-0"
                      >
                        Connect
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer note */}
            <div className="px-4 py-2.5 border-t border-border">
              <p className="text-[10px] text-muted-foreground/40 text-center">
                Connecting helps us show you more relevant jobs
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

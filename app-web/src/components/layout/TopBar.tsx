"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Check,
  Plug,
  ExternalLink,
  Search,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { usePlatforms } from "@/contexts/PlatformContext";
import type { PlatformId } from "@/lib/api";

const PLATFORMS: {
  id: PlatformId;
  label: string;
  description: string;
  logo: string;
  bg: string;
  border: string;
  dot: string;
}[] = [
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
  const { connections, startConnect, disconnect, rescrape } = usePlatforms();
  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState<PlatformId | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [inputValue, setInputValue] = useState(query);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Sync input if URL changes externally (e.g. browser back/forward)
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const handleSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("q", value);
      else params.delete("q");
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  function handleInput(value: string) {
    setInputValue(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(value), 350);
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

  async function handleConnect(id: PlatformId) {
    setConnecting(id);
    try {
      await startConnect(id);
      setOpen(false);
    } finally {
      setConnecting(null);
    }
  }

  async function handleDisconnect(id: PlatformId) {
    await disconnect(id);
  }

  const activeConnections = connections.filter((c) => c.status === "active");
  const connectedIds = new Set(activeConnections.map((c) => c.platform));
  const expiredIds = new Set(
    connections.filter((c) => c.status === "expired").map((c) => c.platform),
  );

  return (
    <header className="sticky top-0 z-20 h-14 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between gap-3 px-4 lg:px-6 shrink-0">
      {/* Search bar */}
      <div className="flex-1 flex items-center gap-2 bg-muted border border-border rounded-[6px] px-3 h-8 focus-within:border-primary/40 transition-colors max-w-lg">
        <Search className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Search jobs, companies, skills…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
        />
      </div>

      <div ref={ref} className="relative">
        {/* Trigger button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex items-center gap-2 h-8 pl-3 pr-2.5 rounded-[6px] border text-sm font-medium transition-colors",
            connectedIds.size > 0
              ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/15"
              : expiredIds.size > 0
                ? "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/15"
                : "bg-muted border-border text-muted-foreground hover:text-foreground hover:border-border/80",
          )}
        >
          <Plug className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {connectedIds.size > 0 ? `${connectedIds.size} connected` : "Connect platforms"}
          </span>

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
                  connectedIds.has(p.id) ? "opacity-100" : "opacity-40",
                )}
              />
            ))}
          </div>

          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-[calc(100%+6px)] w-[288px] bg-popover border border-border rounded-[10px] shadow-xl overflow-hidden z-50">
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
                const isConnected = connectedIds.has(platform.id);
                const isExpired = expiredIds.has(platform.id);
                const conn = connections.find((c) => c.platform === platform.id);

                return (
                  <div
                    key={platform.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-[6px] border transition-colors",
                      isConnected
                        ? `${platform.bg} ${platform.border}`
                        : isExpired
                          ? "bg-destructive/5 border-destructive/20"
                          : "border-transparent hover:bg-muted",
                    )}
                  >
                    <Image
                      src={platform.logo}
                      alt={platform.label}
                      width={22}
                      height={22}
                      className="rounded-[6px] object-contain shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{platform.label}</p>
                      <p className="text-[11px] text-muted-foreground/60 truncate">
                        {isConnected && conn?.lastScrapedAt
                          ? `Last synced ${new Date(conn.lastScrapedAt).toLocaleDateString()}`
                          : isExpired
                            ? "Session expired — reconnect"
                            : platform.description}
                      </p>
                    </div>

                    {isConnected ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => rescrape(platform.id)}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                          title="Refresh jobs"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDisconnect(platform.id)}
                          className="flex items-center gap-1 text-xs font-medium text-primary hover:text-destructive transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Connected
                        </button>
                      </div>
                    ) : isExpired ? (
                      <button
                        onClick={() => handleConnect(platform.id)}
                        disabled={connecting === platform.id}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-[6px] bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors shrink-0"
                      >
                        <RefreshCw
                          className={cn("w-3 h-3", connecting === platform.id && "animate-spin")}
                        />
                        Reconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(platform.id)}
                        disabled={connecting === platform.id}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-[6px] bg-foreground text-background hover:bg-foreground/80 transition-colors shrink-0 disabled:opacity-60"
                      >
                        {connecting === platform.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <ExternalLink className="w-3 h-3" />
                        )}
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer note */}
            <div className="px-4 py-2.5 border-t border-border">
              {expiredIds.size > 0 ? (
                <p className="text-[10px] text-destructive/70 text-center flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Some sessions expired — reconnect to resume scraping
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground/40 text-center">
                  Connecting helps us show you more relevant jobs
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

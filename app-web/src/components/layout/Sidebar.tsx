"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rss, Bookmark, KanbanSquare, X, Menu } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navLinks = [
  { href: "/feed",    label: "Feed",    icon: Rss },
  { href: "/saved",   label: "Saved",   icon: Bookmark },
  { href: "/tracker", label: "Tracker", icon: KanbanSquare },
];

const sources = [
  { id: "linkedin", label: "LinkedIn", color: "bg-[#6b9eff]" },
  { id: "naukri",   label: "Naukri",   color: "bg-[#ff9f68]" },
  { id: "indeed",   label: "Indeed",   color: "bg-[#59c77a]" },
];

const workModes = ["Remote", "Hybrid", "On-site"];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar border-b border-border flex items-center justify-between px-4">
        <Link href="/feed" className="font-serif text-xl text-foreground">
          Easy<em className="italic text-primary not-italic">Hunt</em>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-[10px] text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop: fixed left | mobile: slide-in drawer */}
      <aside className={cn(
        "fixed top-0 left-0 h-screen w-[220px] bg-sidebar border-r border-border flex flex-col z-50 transition-transform duration-300",
        "lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>

        {/* Logo row */}
        <div className="px-5 h-14 flex items-center justify-between border-b border-border shrink-0">
          <Link href="/feed" className="font-serif text-xl text-foreground" onClick={() => setMobileOpen(false)}>
            Easy<em className="italic text-primary not-italic">Hunt</em>
          </Link>
          {/* Close button — mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden w-7 h-7 flex items-center justify-center rounded-[8px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="px-3 pt-4 flex flex-col gap-0.5">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} onClick={() => setMobileOpen(false)} />
          ))}
        </nav>

        <Separator className="mx-3 mt-4 w-auto bg-border" />

        {/* Filters */}
        <div className="px-5 pt-4 flex-1 overflow-y-auto">
          <FilterSection />
        </div>

        {/* User + theme toggle */}
        <div className="px-3 py-3 border-t border-border shrink-0 flex items-center justify-between">
          <UserArea />
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}

function NavLink({ href, label, Icon, onClick }: {
  href: string;
  label: string;
  Icon: React.ElementType;
  onClick: () => void;
}) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-[10px] text-sm transition-colors",
        active
          ? "bg-black/[0.06] dark:bg-white/[0.06] text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
      )}
    >
      <Icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
      {label}
    </Link>
  );
}

function FilterSection() {
  return (
    <>
      {/* Sources */}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">
        Sources
      </p>
      <div className="flex flex-col gap-2.5">
        {sources.map(({ id, label, color }) => (
          <label key={id} className="flex items-center gap-2.5 cursor-pointer group">
            <Checkbox
              id={id}
              defaultChecked
              className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className={cn("w-2 h-2 rounded-full shrink-0", color)} />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              {label}
            </span>
          </label>
        ))}
      </div>

      <Separator className="my-4 bg-border" />

      {/* Work Mode */}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">
        Work Mode
      </p>
      <div className="flex flex-col gap-2.5">
        {workModes.map((mode) => (
          <label key={mode} className="flex items-center gap-2.5 cursor-pointer group">
            <Checkbox
              id={mode}
              defaultChecked
              className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              {mode}
            </span>
          </label>
        ))}
      </div>

      <Separator className="my-4 bg-border" />

      {/* Location */}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">
        Location
      </p>
      <input
        type="text"
        placeholder="e.g. Bengaluru"
        className="w-full bg-black/[0.04] dark:bg-white/[0.04] border border-border rounded-[10px] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
      />
    </>
  );
}

function UserArea() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
        <span className="text-[10px] font-semibold text-primary">EH</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground truncate">Dev Mode</p>
        <p className="text-[10px] text-muted-foreground/50 truncate">Admin</p>
      </div>
    </div>
  );
}

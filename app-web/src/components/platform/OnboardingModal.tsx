"use client";

import { useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { platformApi } from "@/lib/api";
import { usePlatforms } from "@/contexts/PlatformContext";
import type { ExperienceLevel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: "entry", label: "Entry (0–2 yrs)" },
  { value: "mid", label: "Mid (2–5 yrs)" },
  { value: "senior", label: "Senior (5–8 yrs)" },
  { value: "lead", label: "Lead / Staff" },
  { value: "manager", label: "Manager" },
];

const COMMON_CITIES = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai", "Noida", "Gurgaon"];
const COMMON_ROLES = ["Software Engineer", "Frontend Engineer", "Backend Engineer", "Full Stack Engineer", "Data Engineer", "DevOps Engineer"];

export function OnboardingModal() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { profile, loading, refresh } = usePlatforms();

  const [role, setRole] = useState("");
  const [city, setCity] = useState("");
  const [experience, setExperience] = useState<ExperienceLevel | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !user || profile?.onboardingComplete) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role.trim() || !city.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const t = await getToken();
      await platformApi.onboard(
        {
          email: user!.primaryEmailAddress?.emailAddress ?? "",
          displayName: user!.fullName ?? undefined,
          preferredRole: role.trim(),
          preferredCity: city.trim(),
          preferredExperienceLevel: experience || undefined,
        },
        t,
      );
      await refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Let's set up your feed</DialogTitle>
          <DialogDescription>
            Tell us what you're looking for — we'll fetch matching jobs from LinkedIn, Naukri, and Indeed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="role">Role you're looking for</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer"
              required
            />
            <div className="flex flex-wrap gap-1.5">
              {COMMON_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-full border transition-colors",
                    role === r
                      ? "bg-primary/15 border-primary/30 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="city">Preferred city</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Bengaluru"
              required
            />
            <div className="flex flex-wrap gap-1.5">
              {COMMON_CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCity(c)}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-full border transition-colors",
                    city === c
                      ? "bg-primary/15 border-primary/30 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Experience level <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <div className="flex flex-wrap gap-1.5">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExperience(experience === opt.value ? "" : opt.value)}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-full border transition-colors",
                    experience === opt.value
                      ? "bg-primary/15 border-primary/30 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button type="submit" disabled={!role.trim() || !city.trim() || submitting} className="w-full">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up…</> : "Continue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { SignIn } from "@clerk/nextjs";

export default function AuthPage() {
  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4 py-12 overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(89,199,122,0.1)_0%,transparent_65%)]" />

      {/* Logo */}
      <a
        href="https://easyhunt.space"
        className="relative z-10 font-serif text-2xl text-foreground"
      >
        Easy<em className="italic text-primary">Hunt</em>
      </a>

      {/* Clerk widget */}
      <div className="relative z-10 w-full max-w-[420px]">
        <SignIn routing="hash" forceRedirectUrl="/feed" fallbackRedirectUrl="/feed" />
      </div>

      <p className="relative z-10 text-xs text-muted-foreground/40">
        Free forever · No ads · No sponsored results
      </p>
    </div>
  );
}

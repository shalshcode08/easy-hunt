"use client";

import { SignIn } from "@clerk/nextjs";

export default function AuthClient() {
  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-12 overflow-hidden"
      style={{ background: "#0c0c0c", color: "#ececee" }}
    >
      <div className="pointer-events-none absolute -top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(89,199,122,0.1)_0%,transparent_65%)]" />
      <a
        href="https://easyhunt.space"
        className="relative z-10 font-serif text-2xl"
        style={{ color: "#ececee" }}
      >
        Easy
        <em className="italic" style={{ color: "#59c77a" }}>
          Hunt
        </em>
      </a>
      <div className="relative z-10 w-full max-w-[420px]">
        <SignIn routing="hash" forceRedirectUrl="/feed" fallbackRedirectUrl="/feed" />
      </div>
      <p className="relative z-10 text-xs" style={{ color: "rgba(236,236,238,0.3)" }}>
        Free forever · No ads · No sponsored results
      </p>
    </div>
  );
}

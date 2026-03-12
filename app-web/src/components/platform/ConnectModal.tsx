"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { platformApi } from "@/lib/api";
import { usePlatforms } from "@/contexts/PlatformContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  naukri: "Naukri",
  indeed: "Indeed",
};

const POLL_INTERVAL_MS = 3000;

export function ConnectModal() {
  const { activeSession, confirmConnect, cancelConnect } = usePlatforms();
  const { getToken } = useAuth();
  const [pollingState, setPollingState] = useState<"idle" | "polling" | "ready" | "saving">("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const popupRef = useRef<Window | null>(null);

  // Open popup and start polling when session becomes active
  useEffect(() => {
    if (!activeSession) {
      setPollingState("idle");
      clearInterval(intervalRef.current!);
      popupRef.current?.close();
      return;
    }

    // Open login popup
    popupRef.current = window.open(
      activeSession.liveViewUrl,
      "browserbase-login",
      "width=1280,height=800,left=200,top=100,resizable=yes,scrollbars=yes",
    );

    setPollingState("polling");

    async function poll() {
      if (!activeSession) return;
      try {
        const t = await getToken();
        const { ready } = await platformApi.pollConnection(activeSession.platform, activeSession.sessionId, t);
        if (ready) {
          clearInterval(intervalRef.current!);
          popupRef.current?.close();
          setPollingState("ready");
        }
      } catch { /* keep polling */ }
    }

    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      clearInterval(intervalRef.current!);
    };
  }, [activeSession, getToken]);

  async function handleSave() {
    setPollingState("saving");
    try {
      await confirmConnect();
    } catch {
      setPollingState("ready");
    }
  }

  const label = activeSession ? (PLATFORM_LABELS[activeSession.platform] ?? activeSession.platform) : "";

  return (
    <Dialog open={!!activeSession} onOpenChange={(open: boolean) => !open && cancelConnect()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Connect {label}</DialogTitle>
          <DialogDescription>
            Sign in to {label} in the popup window that opened. Come back here once you're logged in.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {pollingState === "polling" && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Waiting for login…</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sign in to {label} in the popup. This page updates automatically once detected.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => popupRef.current?.focus() ?? window.open(activeSession!.liveViewUrl, "browserbase-login")}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open popup again
              </Button>
            </>
          )}

          {(pollingState === "ready" || pollingState === "saving") && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Login detected!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ready to save your session and start fetching jobs.
                </p>
              </div>
              <Button onClick={handleSave} disabled={pollingState === "saving"} className="w-full">
                {pollingState === "saving"
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving session…</>
                  : "Save & start fetching jobs"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

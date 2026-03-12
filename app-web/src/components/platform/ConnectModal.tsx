"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, ExternalLink, CheckCircle } from "lucide-react";
import { usePlatforms } from "@/contexts/PlatformContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  naukri: "Naukri",
  indeed: "Indeed",
};

export function ConnectModal() {
  const { activeSession, confirmConnect, cancelConnect } = usePlatforms();
  const [saving, setSaving] = useState(false);
  const popupRef = useRef<Window | null>(null);

  useEffect(() => {
    if (!activeSession) {
      setSaving(false);
      popupRef.current?.close();
      return;
    }

    popupRef.current = window.open(
      activeSession.liveViewUrl,
      "platform-login",
      "width=1280,height=800,left=200,top=100,resizable=yes,scrollbars=yes",
    );
  }, [activeSession]);

  async function handleDone() {
    setSaving(true);
    try {
      await confirmConnect();
    } catch {
      setSaving(false);
    }
  }

  const label = activeSession ? (PLATFORM_LABELS[activeSession.platform] ?? activeSession.platform) : "";

  return (
    <Dialog open={!!activeSession} onOpenChange={(open: boolean) => !open && cancelConnect()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Connect {label}</DialogTitle>
          <DialogDescription>
            Sign in to {label} in the popup window. Come back and click Done once you're logged in.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-muted-foreground" />
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Log in to {label}</p>
            <p className="text-xs text-muted-foreground mt-1">
              The popup window has the {label} login page. Sign in there, then click Done below.
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <Button onClick={handleDone} disabled={saving} className="w-full">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Done — I'm logged in"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                if (popupRef.current && !popupRef.current.closed) {
                  popupRef.current.focus();
                } else if (activeSession) {
                  popupRef.current = window.open(activeSession.liveViewUrl, "platform-login", "width=1280,height=800");
                }
              }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Reopen popup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { platformApi, type PlatformId } from "@/lib/api";
import type { PlatformConnection, UserProfile } from "@/lib/types";

interface ConnectSession {
  platform: PlatformId;
  sessionId: string;
  liveViewUrl: string;
}

interface PlatformContextValue {
  profile: UserProfile | null;
  connections: PlatformConnection[];
  loading: boolean;
  activeSession: ConnectSession | null;
  justConnected: boolean;
  startConnect: (platform: PlatformId) => Promise<void>;
  confirmConnect: () => Promise<void>;
  cancelConnect: () => void;
  disconnect: (platform: PlatformId) => Promise<void>;
  rescrape: (platform: PlatformId) => Promise<void>;
  refresh: () => Promise<void>;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<ConnectSession | null>(null);
  const [justConnected, setJustConnected] = useState(false);

  const token = useCallback(() => getToken(), [getToken]);

  const refresh = useCallback(async () => {
    const t = await token();
    const [prof, conns] = await Promise.all([
      platformApi.getMe(t),
      platformApi.getConnections(t),
    ]);
    setProfile(prof);
    setConnections(conns);
  }, [token]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  async function startConnect(platform: PlatformId) {
    const t = await token();
    const { sessionId, liveViewUrl } = await platformApi.initConnect(platform, t);
    setActiveSession({ platform, sessionId, liveViewUrl });
  }

  async function confirmConnect() {
    if (!activeSession) return;
    const t = await token();
    await platformApi.saveConnection(activeSession.platform, activeSession.sessionId, t);
    setActiveSession(null);
    setJustConnected(true);
    await refresh();
  }

  function cancelConnect() {
    setActiveSession(null);
  }

  async function disconnect(platform: PlatformId) {
    const t = await token();
    await platformApi.disconnect(platform, t);
    setConnections((prev) => prev.filter((c) => c.platform !== platform));
  }

  async function rescrape(platform: PlatformId) {
    const t = await token();
    await platformApi.rescrape(platform, t);
    setJustConnected(true);
  }

  return (
    <PlatformContext.Provider
      value={{
        profile,
        connections,
        loading,
        activeSession,
        justConnected,
        startConnect,
        confirmConnect,
        cancelConnect,
        disconnect,
        rescrape,
        refresh,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatforms() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error("usePlatforms must be used inside PlatformProvider");
  return ctx;
}

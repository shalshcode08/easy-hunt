"use client";

import { createContext, useContext, useState } from "react";

export type PlatformId = "linkedin" | "naukri" | "indeed";

interface PlatformContextValue {
  connectedIds: PlatformId[];
  connect: (id: PlatformId) => void;
  disconnect: (id: PlatformId) => void;
}

const PlatformContext = createContext<PlatformContextValue>({
  connectedIds: [],
  connect: () => {},
  disconnect: () => {},
});

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  // Mock state — replace with real persistence later
  const [connectedIds, setConnectedIds] = useState<PlatformId[]>([]);

  function connect(id: PlatformId) {
    setConnectedIds((prev) => prev.includes(id) ? prev : [...prev, id]);
  }

  function disconnect(id: PlatformId) {
    setConnectedIds((prev) => prev.filter((p) => p !== id));
  }

  return (
    <PlatformContext.Provider value={{ connectedIds, connect, disconnect }}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatforms() {
  return useContext(PlatformContext);
}

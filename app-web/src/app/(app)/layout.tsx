import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { PlatformProvider } from "@/contexts/PlatformContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlatformProvider>
      <div className="flex h-dvh overflow-hidden bg-background">
        <Sidebar />
        {/* lg: offset sidebar width | mobile: offset top bar height */}
        <div className="flex-1 lg:ml-[220px] pt-14 lg:pt-0 flex flex-col h-dvh overflow-hidden">
          <Suspense>
            <TopBar />
          </Suspense>
          {children}
        </div>
      </div>
    </PlatformProvider>
  );
}

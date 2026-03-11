import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      {/* lg: offset sidebar width | mobile: offset top bar height */}
      <div className="flex-1 lg:ml-[220px] mt-14 lg:mt-0 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}

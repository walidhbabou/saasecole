"use client";
import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export interface AppProfile {
  role: string;
  first_name: string;
  last_name: string;
  school_name: string;
}

export function AppShell({ children, profile }: { children: React.ReactNode; profile: AppProfile }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar collapsed={collapsed} profile={profile} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar onToggleSidebar={() => setCollapsed((c) => !c)} profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

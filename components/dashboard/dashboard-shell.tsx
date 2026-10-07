"use client";

import { useState } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";
import type { AppRole } from "@/lib/auth/roles";

interface DashboardShellProps {
  role: AppRole;
  userName: string;
  userEmail: string;
  organizationName: string;
  headerTitle: string;
  headerSubtitle?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShell({
  role,
  userName,
  userEmail,
  organizationName,
  headerTitle,
  headerSubtitle,
  headerActions,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/20 text-foreground">
      {/* Role-specific Sidebar */}
      <DashboardSidebar
        role={role}
        userName={userName}
        userEmail={userEmail}
        organizationName={organizationName}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main page content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          role={role}
          title={headerTitle}
          subtitle={headerSubtitle}
          organizationName={organizationName}
          userName={userName}
          onOpenSidebar={() => setSidebarOpen(true)}
        >
          {headerActions}
        </DashboardHeader>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

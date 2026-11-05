"use client";

import { Menu } from "lucide-react";
import { SignOutButton } from "../../shared/sign-out-button";
import type { AppRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  role: AppRole;
  title: string;
  subtitle?: string;
  organizationName?: string;
  userName?: string;
  onOpenSidebar: () => void;
  children?: React.ReactNode;
}

export function DashboardHeader({
  role,
  title,
  subtitle,
  userName,
  onOpenSidebar,
  children,
}: DashboardHeaderProps) {
  const isAdmin = role === "ADMIN";

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation menu"
          className="flex size-9 items-center justify-center border border-border text-foreground hover:bg-muted lg:hidden"
        >
          <Menu className="size-4" />
        </button>

        {/* Title & subtitle / breadcrumb */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-base font-semibold text-foreground sm:text-lg">
              {title}
            </h1>
            <span
              className={cn(
                "hidden px-2 py-0.5 text-[12px] font-semibold sm:inline-block",
                isAdmin
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-primary/10 text-primary dark:text-sky-400",
              )}
            >
              {isAdmin ? "Admin Portal" : "Sales Representative Workspace"}
            </span>
          </div>
          {subtitle && (
            <p className="hidden text-xs text-muted-foreground sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right side items */}
      <div className="flex items-center gap-2.5">
        {children}

        {userName && (
          <div className="hidden text-right text-xs lg:block">
            <span className="block font-medium text-foreground">
              {userName}
            </span>
          </div>
        )}

        <div className="hidden sm:block">
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

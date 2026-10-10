"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Calculator,
  BarChart3,
  ShieldCheck,
  ArrowLeftRight,
  Target,
  X,
  Settings,
  CircleHelp,
  Building2,
  UserPlus,
  Package,
  Bot,
} from "lucide-react";
import { BRAND, Logo } from "@/components/shared/brand";
import { SignOutButton } from "../shared/sign-out-button";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/auth/roles";

interface NavConfigItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const ADMIN_NAV_ITEMS: NavConfigItem[] = [
  {
    label: "Overview",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Customers",
    href: "/dashboard/admin/customers",
    icon: Users,
  },
  {
    label: "Shipments",
    href: "/dashboard/admin/shipments",
    icon: Package,
  },
  {
    label: "Rate comparison",
    href: "/dashboard/admin/rates",
    icon: ArrowLeftRight,
  },
  {
    label: "RFQs",
    href: "/dashboard/admin/rfqs",
    icon: FileSpreadsheet,
    badge: "Soon",
  },
  {
    label: "Quotations",
    href: "/dashboard/admin/quotations",
    icon: Calculator,
    badge: "Soon",
  },
  {
    label: "Reports",
    href: "/dashboard/admin/reports",
    icon: BarChart3,
    badge: "Soon",
  },
  {
    label: "Users & roles",
    href: "/dashboard/admin/users",
    icon: ShieldCheck,
    badge: "Soon",
  },
];

const ADMIN_BOTTOM_ITEMS: NavConfigItem[] = [
  {
    label: "Settings",
    href: "/dashboard/admin/settings",
    icon: Settings,
  },
  {
    label: "Help & Support",
    href: "/dashboard/admin/help",
    icon: CircleHelp,
    badge: "Soon",
  },
];

const SALES_BOTTOM_ITEMS: NavConfigItem[] = [
  {
    label: "Settings",
    href: "/dashboard/sales/settings",
    icon: Settings,
  },
  {
    label: "Help & Support",
    href: "/dashboard/sales/help",
    icon: CircleHelp,
    badge: "Soon",
  },
];

const SALES_NAV_ITEMS: NavConfigItem[] = [
  {
    label: "Overview",
    href: "/dashboard/sales",
    icon: LayoutDashboard,
  },
  {
    label: "My customers",
    href: "/dashboard/sales/customers",
    icon: Users,
  },
  {
    label: "Shipments",
    href: "/dashboard/sales/shipments",
    icon: Package,
  },
  {
    label: "Rate comparison",
    href: "/dashboard/sales/rates",
    icon: ArrowLeftRight,
  },
  {
    label: "Team members",
    href: "/dashboard/sales/team",
    icon: UserPlus,
  },

  {
    label: "Sales targets",
    href: "/dashboard/sales/targets",
    icon: Target,
    badge: "Soon",
  },
  {
    label: "AI Asking",
    href: "/dashboard/sales/targets",
    icon: Bot,
    badge: "Soon",
  },
];

interface DashboardSidebarProps {
  role: AppRole;
  userName: string;
  userEmail: string;
  organizationName: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({
  role,
  userName,
  userEmail,
  organizationName,
  isOpen,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const isAdmin = role === "ADMIN";
  const navItems = isAdmin ? ADMIN_NAV_ITEMS : SALES_NAV_ITEMS;
  const bottomNavItems = isAdmin ? ADMIN_BOTTOM_ITEMS : SALES_BOTTOM_ITEMS;

  // Initials for avatar
  const initials =
    userName
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          role="presentation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen min-h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar transition-transform duration-200 ease-in-out lg:sticky lg:top-0 lg:translate-x-0",
          isOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full lg:shadow-none",
        )}
      >
        {/* Brand header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <Link
            href={isAdmin ? "/dashboard/admin" : "/dashboard/sales"}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <Logo size={33} />
            <div className="flex flex-col">
              <span className="font-heading text-base font-bold tracking-tight text-foreground">
                {BRAND}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                {isAdmin ? "Admin Console" : "Sales Portal"}
              </span>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Organization context badge */}
        <div className="shrink-0 px-4 py-3">
          <div className="flex items-center gap-2.5 rounded-lg border border-border/80 bg-background/60 p-2 text-xs">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md font-semibold text-white">
              <Building2 className="text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">
                {organizationName || "Organization"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {isAdmin ? "Admin workspace" : "Sales workspace"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation list (fixed height, no scroll) */}
        <div className="flex flex-1 flex-col justify-between overflow-hidden px-3 py-2">
          <div>
            <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Navigation
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.href && pathname === item.href;
                const isComingSoon = !!item.badge;

                if (isComingSoon) {
                  return (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium text-muted-foreground/70 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="size-4 text-muted-foreground/50" />
                        <span>{item.label}</span>
                      </div>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                        Soon
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href || "#"}
                    onClick={() => onClose?.()}
                    className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          isActive
                            ? "text-primary-foreground"
                            : "text-muted-foreground",
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {isActive && (
                      <span className="size-1.5 rounded-full bg-primary-foreground" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick info promo box */}
          <div className="mt-3 shrink-0 rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-primary">
              <span>FWD Rate Engine</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {isAdmin
                ? "Manage customer margins, rate parity, and agent access controls."
                : "Compare air & ocean freight quotes in real-time with automated parity."}
            </p>
          </div>
        </div>

        {/* Settings & Bottom items above user profile */}
        <div className="shrink-0 border-t border-border px-3 py-2 space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href && pathname === item.href;
            const isComingSoon = !!item.badge;

            if (isComingSoon) {
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium text-muted-foreground/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="size-4 text-muted-foreground/50" />
                    <span>{item.label}</span>
                  </div>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                    Soon
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href || "#"}
                onClick={() => onClose?.()}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="size-1.5 rounded-full bg-primary-foreground" />
                )}
              </Link>
            );
          })}
        </div>

        {/* User profile footer */}
        <div className="shrink-0 border-t border-border p-3">
          <div className="flex items-center gap-2.5 rounded-lg bg-background/50 p-2">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                isAdmin ? "bg-emerald-600" : "bg-sky-600",
              )}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">
                {userName || "User"}
              </p>
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "inline-block rounded px-1 text-[9px] font-bold uppercase tracking-wider",
                    isAdmin
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
                  )}
                >
                  {role}
                </span>
                <span className="truncate text-[10px] text-muted-foreground">
                  {userEmail}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2">
            <SignOutButton variant="sidebar" />
          </div>
        </div>
      </aside>
    </>
  );
}

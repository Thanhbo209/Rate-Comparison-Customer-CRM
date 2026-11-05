"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { X, PanelLeftClose, PanelLeftOpen, Building2 } from "lucide-react";
import { BRAND, Logo } from "@/components/shared/brand";
import { SignOutButton } from "../../shared/sign-out-button";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/auth/roles";
import {
  ADMIN_BOTTOM_ITEMS,
  ADMIN_NAV_ITEMS,
  NavConfigItem,
  SALES_BOTTOM_ITEMS,
  SALES_NAV_ITEMS,
} from "@/utils/layout/sidebar/constants";
import {
  readCollapsed,
  subscribeCollapsed,
  writeCollapsed,
} from "@/utils/layout/sidebar/helper";
import { NavItem } from "./nav-items";
import Link from "next/link";

/* -------------------------------------------------------------------------- */
/* Collapse state                                                             */
/*                                                                            */
/* Kept in localStorage and read with useSyncExternalStore, so it survives a  */
/* reload, stays in sync across tabs, and never causes a hydration mismatch.  */
/* -------------------------------------------------------------------------- */

// Matches Tailwind's `lg` breakpoint: below it the sidebar is the mobile drawer
// and is never collapsed.
const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeDesktop(onChange: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const readDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;

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
  const [clicked, setClicked] = useState<{
    from: string;
    href: string;
  } | null>(null);

  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    () => false,
  );
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    readDesktop,
    () => false,
  );

  // The rail only exists on desktop; the mobile drawer is always full width.
  const rail = collapsed && isDesktop;

  // Width animates only after the first manual toggle, so restoring a saved
  // "collapsed" state on page load doesn't visibly slide shut.
  const [animateWidth, setAnimateWidth] = useState(false);
  const toggleCollapsed = () => {
    setAnimateWidth(true);
    writeCollapsed(!collapsed);
  };

  const activeHref =
    clicked && clicked.from === pathname ? clicked.href : pathname;

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href?: string,
  ) => {
    onClose?.();

    if (!href || pathname === href) {
      return;
    }

    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }

    setClicked({ from: pathname, href });
  };

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

  const renderNavItem = (item: NavConfigItem) => (
    <NavItem
      key={item.label}
      item={item}
      rail={rail}
      isCurrent={!!item.href && pathname === item.href}
      isHighlighted={!!item.href && activeHref === item.href}
      onClick={(e) => handleNavClick(e, item.href)}
    />
  );

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
        id="dashboard-sidebar"
        data-collapsed={rail}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen min-h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar lg:sticky lg:top-0 lg:translate-x-0",
          "transition-transform duration-200 ease-out",
          animateWidth && "lg:transition-[width] lg:duration-150 lg:ease-out",
          rail ? "lg:w-16" : "lg:w-64",
          isOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full lg:shadow-none",
        )}
      >
        {/* Brand header */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-border",
            rail ? "justify-center px-3" : "justify-between px-4",
          )}
        >
          {rail ? (
            // In the rail the logo doubles as the expand button.
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Expand sidebar"
              aria-expanded={false}
              aria-controls="dashboard-sidebar"
              title="Expand sidebar"
              className="group relative flex size-10 items-center justify-center transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0">
                <Logo size={33} />
              </span>
              <PanelLeftOpen className="absolute size-5 text-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
            </button>
          ) : (
            <>
              <Link
                href={isAdmin ? "/dashboard/admin" : "/dashboard/sales"}
                className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-90"
              >
                <Logo size={33} />
                <div className="flex flex-col">
                  <span className="font-heading text-base font-bold tracking-tight text-foreground">
                    {BRAND}
                  </span>
                  <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                    {isAdmin ? "Admin Console" : "Sales Portal"}
                  </span>
                </div>
              </Link>

              <div className="flex shrink-0 items-center">
                {/* Close button for mobile */}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close sidebar"
                  className="flex size-8 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
                >
                  <X className="size-4" />
                </button>

                {/* Collapse button for desktop */}
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-label="Collapse sidebar"
                  aria-expanded
                  aria-controls="dashboard-sidebar"
                  title="Collapse sidebar"
                  className="hidden size-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:flex"
                >
                  <PanelLeftClose className="size-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Organization context badge */}
        <div className={cn("shrink-0 py-3", rail ? "px-3" : "px-4")}>
          <div
            title={rail ? organizationName || "Organization" : undefined}
            className={cn(
              "flex items-center border border-border/80 bg-background/60 text-xs",
              rail ? "justify-center p-1" : "gap-2.5 p-2",
            )}
          >
            <div className="flex size-7 shrink-0 items-center justify-center font-semibold text-white">
              <Building2 className="text-muted-foreground" />
            </div>
            {!rail && (
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {organizationName || "Organization"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {isAdmin ? "Admin workspace" : "Sales workspace"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation list (fixed height, no scroll) */}
        <div className="flex flex-1 flex-col justify-between overflow-hidden px-3 py-2">
          <div>
            {rail ? (
              <div className="mx-1 mt-1 mb-3 border-t border-border" />
            ) : (
              <div className="mb-2 px-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Navigation
              </div>
            )}

            <nav className="space-y-1">{navItems.map(renderNavItem)}</nav>
          </div>
        </div>

        {/* Settings & Bottom items above user profile */}
        <div className="shrink-0 space-y-1 border-t border-border px-3 py-2">
          {bottomNavItems.map(renderNavItem)}
        </div>

        {/* User profile footer */}
        <div className="shrink-0 border-t border-border p-3">
          <div
            title={
              rail
                ? `${userName || "User"} (${role})${userEmail ? ` · ${userEmail}` : ""}`
                : undefined
            }
            className={cn(
              "flex items-center bg-background/50",
              rail ? "justify-center p-1" : "gap-2.5 p-2",
            )}
          >
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center text-xs font-bold text-white",
                isAdmin ? "bg-emerald-600" : "bg-sky-600",
              )}
            >
              {initials}
            </div>
            {!rail && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">
                  {userName || "User"}
                </p>
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      "inline-block px-1 text-[9px] font-bold tracking-wider uppercase",
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
            )}
          </div>

          {!rail && (
            <div className="mt-2">
              <SignOutButton variant="sidebar" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BRAND, Logo } from "../shared/Brand";
const NAV = [
  { id: "home", label: "Home" },
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How it works" },
  { id: "faq", label: "FAQ" },
];

export function Navbar() {
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // Shadow appears once the page has scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the nav item for the section currently in view
  useEffect(() => {
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Close the mobile menu with Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-3 sm:pt-4">
      <div className="relative mx-auto max-w-5xl">
        <nav
          aria-label="Main"
          className={cn(
            "flex items-center justify-between gap-2 py-3 rounded-md border border-border bg-sidebar pl-4 pr-2 transition-shadow duration-300",
            scrolled && "shadow-lg shadow-black/5",
          )}
        >
          <a
            href="#home"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-primary"
          >
            <Logo size={30} />
            <span className="font-heading text-lg font-semibold text-foreground">
              {BRAND}
            </span>
          </a>

          {/* Desktop links */}
          <ul className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={active === item.id ? "true" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm transition-colors",
                    active === item.id
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "sm" }),
                "rounded-md px-6 p-4 mr-5",
              )}
            >
              Log in
            </Link>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex size-9 items-center justify-center rounded-full text-foreground hover:bg-muted md:hidden"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                {open ? (
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {open && (
          <div
            id="mobile-menu"
            className="absolute inset-x-0 top-full mt-2 rounded-2xl border border-border bg-background p-2 shadow-lg md:hidden"
          >
            <ul>
              {NAV.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={() => setOpen(false)}
                    aria-current={active === item.id ? "true" : undefined}
                    className={cn(
                      "block rounded-xl px-4 py-3 text-sm",
                      active === item.id
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}

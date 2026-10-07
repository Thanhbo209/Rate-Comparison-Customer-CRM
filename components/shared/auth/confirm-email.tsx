"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Status = "loading" | "success" | "error";

const MIN_LOADING_MS = 900; // keeps the loading state from flashing past
const REDIRECT_AFTER_MS = 2500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function ConfirmEmail({
  redirectTo = "/",
}: {
  redirectTo?: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  // 1. Confirm the email
  useEffect(() => {
    let cancelled = false;

    async function confirm() {
      // Supabase reports a bad or expired link in the URL (query or hash)
      const query = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const urlError =
        query.get("error_description") ?? hash.get("error_description");

      // The Supabase browser client reads ?code= from the URL and swaps it for a session
      // on its own. getSession() waits until that has finished, so we don't swap it twice.
      const [{ data }] = await Promise.all([
        supabase.auth.getSession(),
        sleep(MIN_LOADING_MS),
      ]);
      if (cancelled) return;

      if (data.session) {
        setStatus("success");
      } else {
        setMessage(urlError ?? "");
        setStatus("error");
      }
    }

    confirm();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // 2. After success, move on automatically
  useEffect(() => {
    if (status !== "success") return;
    const timer = setTimeout(() => {
      router.replace(redirectTo);
      router.refresh();
    }, REDIRECT_AFTER_MS);
    return () => clearTimeout(timer);
  }, [status, router, redirectTo]);

  return (
    <div aria-live="polite">
      {status === "loading" && (
        <>
          <span
            role="status"
            aria-label="Loading"
            className="block size-14 animate-spin rounded-full border-4 border-primary/20 border-t-primary motion-reduce:animate-none"
          />
          <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight">
            Confirming your email…
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            This only takes a moment. Please don&apos;t close this page.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight">
            Email confirmed
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your account is ready. Taking you to your dashboard…
          </p>
          <Link
            href={redirectTo}
            className={cn(buttonVariants({ size: "lg" }), "mt-8 h-11 w-full")}
          >
            Continue now
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight">
            We couldn&apos;t confirm your email
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {message ||
              "The link may have expired, already been used, or been opened in a different browser than the one you signed up in."}
          </p>
          <div className="mt-8 space-y-3">
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "lg" }), "h-11 w-full")}
            >
              Back to login
            </Link>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "h-11 w-full",
              )}
            >
              Sign up again
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

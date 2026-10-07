import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, Logo } from "@/components/shared/brand";
import { AuthPanel } from "@/components/shared/auth/auth-panel";
import { LoginForm } from "@/components/forms/login-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { headline } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Sign in to Dropwell",
  description: "Track every delivery and keep customers informed.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; error_description?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const errorParam = params?.error_description || params?.error;
  const initialError =
    errorParam === "oauth_failed"
      ? "Google sign-in was cancelled or failed. Please try again."
      : errorParam === "confirmation_failed"
        ? "Email confirmation link is invalid or expired."
        : errorParam;

  return (
    <main className="flex min-h-screen bg-background text-foreground">
      {/* ───────────── login form ───────────── */}
      <section className="flex flex-1 flex-col px-6 py-10 sm:px-12 lg:px-16 xl:px-24">
        <div className="flex items-center text-primary">
          <span className="lg:hidden">
            <Logo size={80} />
          </span>
          <span
            className={`${headline.className} text-xl font-semibold text-foreground lg:text-2xl`}
          >
            {BRAND}
          </span>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          {/* Back button + breadcrumb */}
          <div className="mb-8 flex items-center justify-between gap-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Login</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <h1 className="font-heading text-4xl font-bold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            New here?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
            >
              Create an account
            </Link>
            . It&apos;s free and takes under a minute.
          </p>

          {/* Only this part runs in the browser */}
          <LoginForm initialError={initialError} />
        </div>
      </section>

      {/* ───────────── logistics panel ───────────── */}
      <AuthPanel
        lines={["Every parcel.", "Every customer.", "One view."]}
        description="Track shipments, update delivery windows and keep customers informed without chasing drivers or spreadsheets."
      />
    </main>
  );
}

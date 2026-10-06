import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import Link from "next/link";
import { BRAND, Logo } from "@/components/shared/Brand";
import { LoginForm } from "@/components/forms/LoginForm";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Image from "next/image";

const headline = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Login to Dropwell",
  description: "Track every delivery and keep customers informed.",
};

const STEPS = ["Picked up", "At hub", "Out for delivery", "Delivered"];
const CURRENT_STEP = 2; // active step in the demo card

export default function LoginPage() {
  return (
    <main className="flex min-h-screen bg-background text-foreground">
      {/* ───────────── Right: login form ───────────── */}
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

        {/* Back button + breadcrumb */}
        <div className=" flex items-center justify-between mt-5 gap-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-bold text-primary">
                  Login
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center mb-10">
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
          <LoginForm />
        </div>
      </section>

      {/* ───────────── Left: logistics panel ───────────── */}
      <section
        aria-hidden="true"
        className="relative hidden w-[58%] flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex xl:p-16"
      >
        {/* depth overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-black/0 via-black/20 to-black/55" />

        {/* Route map background */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 800 900"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          {/* faint street grid */}
          <g className="stroke-primary-foreground/10">
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 80} y1="0" x2={i * 80} y2="900" />
            ))}
            {Array.from({ length: 14 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 70} x2="800" y2={i * 70} />
            ))}
          </g>

          {/* secondary route */}
          <path
            d="M-20 330 C 120 300, 200 380, 330 340 S 520 240, 640 270 S 780 330, 840 300"
            className="stroke-primary-foreground/25"
            strokeWidth="2"
            strokeDasharray="4 8"
          />

          {/* main route */}
          <path
            id="mainRoute"
            d="M70 820 C 230 700, 140 560, 330 500 S 560 360, 730 170"
            className="stroke-chart-1"
            strokeWidth="2.5"
            strokeDasharray="2 9"
            strokeLinecap="round"
          />

          {/* stops */}
          {[
            [70, 820],
            [330, 500],
            [730, 170],
          ].map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="14" className="fill-chart-1/20" />
              <circle cx={cx} cy={cy} r="5" className="fill-chart-1" />
            </g>
          ))}

          {/* moving parcel (hidden when reduced motion is on) */}
          <circle
            r="7"
            className="fill-primary-foreground motion-reduce:hidden"
          >
            <animateMotion dur="9s" repeatCount="indefinite" rotate="auto">
              <mpath href="#mainRoute" />
            </animateMotion>
          </circle>
        </svg>

        {/* Brand */}
        <div className="relative flex items-center">
          <Logo size={80} />
          <span
            className={`${headline.className} text-2xl font-semibold tracking-tight`}
          >
            {BRAND}
          </span>
        </div>

        {/* Headline */}
        <div className="relative max-w-xl bottom-35">
          <h2
            className={`${headline.className} text-5xl font-bold leading-[1.05] tracking-tight xl:text-6xl`}
          >
            Every parcel.
            <br />
            Every customer.
            <br />
            One view.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-primary-foreground/80">
            Track shipments, update delivery windows and keep customers informed
            without chasing drivers or spreadsheets.
          </p>
        </div>

        {/* Footer */}
        <p className="relative text-sm text-primary-foreground/50">
          © {new Date().getFullYear()} {BRAND}. All rights reserved.
        </p>

        {/* Layered cards, pinned to the right of the panel (hidden below xl so they never cover the headline) */}
        <div className="absolute bottom-30 right-12 hidden w-88 xl:right-16 xl:block">
          {/* Back card: current shipment */}
          <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-5 pb-10 backdrop-blur-md">
            <Image
              src="/logistic.png"
              alt=""
              width={160}
              height={160}
              className="pointer-events-none absolute bottom-full right-4 h-auto w-36 translate-y-4 drop-shadow-xl"
            />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-primary-foreground/65">Order #1</p>
                <p className="mt-1 font-heading text-xl font-semibold">
                  Out for delivery
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-primary-foreground/65">Arriving</p>
                <p className="mt-1 text-xl font-semibold text-chart-1">
                  2:40 PM
                </p>
              </div>
            </div>

            <ol className="mt-5 grid grid-cols-4 gap-1.5">
              {STEPS.map((step, i) => (
                <li key={step}>
                  <div
                    className={`h-1.5 rounded-full ${
                      i <= CURRENT_STEP
                        ? "bg-chart-1"
                        : "bg-primary-foreground/20"
                    }`}
                  />
                  <p
                    className={`mt-2 text-xs leading-tight ${
                      i === CURRENT_STEP
                        ? "font-semibold text-primary-foreground"
                        : "text-primary-foreground/60"
                    }`}
                  >
                    {step}
                  </p>
                </li>
              ))}
            </ol>

            <p className="mt-5 border-t border-primary-foreground/20 pt-4 text-sm text-primary-foreground/80">
              Customer notified by SMS · 2 min ago
            </p>
          </div>

          {/* Front card: a delivered order */}
          <div className="absolute -bottom-20 -left-16 w-72 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xl shadow-black/30">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm font-semibold">Delivered</p>
                <p className="truncate text-xs text-muted-foreground">
                  Order #RD-48190 · Oak Avenue 18
                </p>
              </div>
              <p className="shrink-0 text-xs text-muted-foreground">11:05 AM</p>
            </div>
            <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              Proof of delivery saved
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

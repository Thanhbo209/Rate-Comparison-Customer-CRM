import Image from "next/image";
import { BRAND, Logo } from "@/components/shared/brand";
import { headline } from "@/lib/fonts";

const STEPS = ["Picked up", "At hub", "Out for delivery", "Delivered"];
const CURRENT_STEP = 2; // active step in the demo card

/**
 * Green logistics panel shared by the login and register pages.
 * Pass the headline as an array of lines, one per row.
 */
export function AuthPanel({
  lines,
  description,
  image = "/logistic.png",
}: {
  /** Headline, one string per row */
  lines: string[];
  /** Short paragraph under the headline */
  description: string;
  /** Illustration on the top-right of the back card (file in /public) */
  image?: string;
}) {
  return (
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
        <circle r="7" className="fill-primary-foreground motion-reduce:hidden">
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
      <div className="relative max-w-xl">
        <h2
          className={`${headline.className} text-5xl font-bold leading-[1.05] tracking-tight xl:text-6xl`}
        >
          {lines.map((line, i) => (
            <span key={line}>
              {line}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
        </h2>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-primary-foreground/80">
          {description}
        </p>
      </div>

      {/* Footer */}
      <p className="relative text-sm text-primary-foreground/50">
        © {new Date().getFullYear()} {BRAND}. All rights reserved.
      </p>

      {/* Layered cards, pinned to the right of the panel (hidden below xl so they never cover the headline) */}
      <div className="absolute bottom-24 right-12 hidden w-88 xl:right-16 xl:block">
        {/* Back card: current shipment */}
        <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-5 pb-10 backdrop-blur-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-primary-foreground/65">
                Order #RD-48213
              </p>
              <p className="mt-1 font-heading text-xl font-semibold">
                Out for delivery
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-foreground/65">Arriving</p>
              <p className="mt-1 text-xl font-semibold text-chart-1">2:40 PM</p>
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

        {/* Illustration sitting on the top-right corner of the back card */}
        <Image
          src={image}
          alt=""
          width={160}
          height={160}
          className="pointer-events-none absolute bottom-full right-4 h-auto w-36 translate-y-4 drop-shadow-xl"
        />
      </div>
    </section>
  );
}

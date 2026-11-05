import { cn } from "cn";
import { ReactNode } from "react";

type BadgeTone = "winner" | "cost" | "margin" | "warning";

const BADGE_TONES: Record<BadgeTone, string> = {
  winner:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30",
  cost: "bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/25",
  margin: "bg-primary/10 text-primary ring-primary/25",
  warning:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/30",
};

export function RateBadge({
  tone,
  icon,
  title,
  children,
}: {
  tone: BadgeTone;
  icon: ReactNode;
  title?: string;
  children: ReactNode;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium leading-none ring-1 ring-inset",
        BADGE_TONES[tone],
      )}
    >
      {icon}
      {children}
    </span>
  );
}

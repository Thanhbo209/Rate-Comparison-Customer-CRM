import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatCardVariant = "primary" | "sky" | "amber" | "emerald" | "purple";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  variant?: StatCardVariant;
  className?: string;
  valueClassName?: string;
}

const VARIANT_ICON_STYLES: Record<StatCardVariant, string> = {
  primary: "bg-primary/10 text-primary",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = "primary",
  className,
  valueClassName,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-lg",
            VARIANT_ICON_STYLES[variant]
          )}
        >
          <Icon className="size-4" />
        </div>
      </div>

      <div className="mt-3">
        <div
          className={cn(
            "text-2xl font-bold tracking-tight text-foreground",
            valueClassName
          )}
        >
          {value}
        </div>

        {trend && (
          <p
            className={cn(
              "mt-1 flex items-center text-xs font-medium",
              trend.isPositive !== false
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-destructive"
            )}
          >
            {trend.isPositive !== false ? (
              <ArrowUpRight className="mr-0.5 size-3.5 shrink-0" />
            ) : (
              <ArrowDownRight className="mr-0.5 size-3.5 shrink-0" />
            )}
            <span>{trend.value}</span>
          </p>
        )}

        {description && !trend && (
          <div className="mt-1 text-xs text-muted-foreground">{description}</div>
        )}
      </div>
    </div>
  );
}

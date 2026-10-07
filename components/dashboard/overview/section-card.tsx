import React from "react";
import { cn } from "@/lib/utils";

export interface SectionCardProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  headerBorder?: boolean;
  contentPadding?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function SectionCard({
  title,
  subtitle,
  badge,
  action,
  headerBorder = true,
  contentPadding = true,
  className,
  children,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-xs",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between p-5",
          headerBorder && "border-b border-border"
        )}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base font-semibold text-foreground">
              {title}
            </h2>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action}
      </div>

      <div className={cn(contentPadding && "p-5")}>{children}</div>
    </div>
  );
}

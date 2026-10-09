import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface DashboardBannerProps {
  tag?: React.ReactNode;
  organizationName?: string;
  slogan: string;
  description?: string;
  actions?: React.ReactNode;
  imageSrc?: string;
  className?: string;
}

export function DashboardBanner({
  tag,
  organizationName,
  slogan,
  description,
  actions,
  imageSrc = "/images/logistic.png",
  className,
}: DashboardBannerProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-7",
        className,
      )}
    >
      <div className="flex flex-col-reverse gap-6 md:flex-row md:items-center md:justify-between">
        {/* Left: Slogan, Description & Actions */}
        <div className="max-w-xl flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {tag}
            {organizationName && (
              <span className="text-xs text-muted-foreground">
                • {organizationName}
              </span>
            )}
          </div>

          <h1 className="mt-2.5 font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
            {slogan}
          </h1>

          {description && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {description}
            </p>
          )}

          {actions && (
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              {actions}
            </div>
          )}
        </div>

        {/* Right: Logistics Illustration */}
        <div className="relative flex shrink-0 items-center justify-center self-center md:self-auto">
          <Image
            src={imageSrc}
            alt="Logistics and Freight"
            width={800}
            height={360}
            className="h-auto w-full max-w-[280px] sm:max-w-[340px] md:max-w-[360px] lg:max-w-[420px] object-contain drop-shadow-xs"
            priority
          />
        </div>
      </div>
    </div>
  );
}

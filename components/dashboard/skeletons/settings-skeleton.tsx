import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "./page-header-skeleton";

export function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-12" role="status" aria-busy="true">
      <span className="sr-only">Loading settings & preferences...</span>

      {/* Top Header */}
      <PageHeaderSkeleton hasAction={false} />

      {/* SECTION 1: Personal Profile */}
      <section className="border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3.5 w-64" />
            </div>
          </div>
          <Skeleton className="h-6 w-24" />
        </div>

        <div className="mt-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 border border-border/70 bg-muted/20 p-3.5 sm:grid-cols-2">
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-4 shrink-0" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-28" />
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-4 shrink-0" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Organization Details */}
      <section className="border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3.5 w-72" />
            </div>
          </div>
          <Skeleton className="h-6 w-28" />
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-1.5 max-w-md">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </section>

      {/* SECTION 3: Base Currency */}
      <section className="border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3.5 w-60" />
            </div>
          </div>
          <Skeleton className="h-6 w-24" />
        </div>

        <div className="mt-6 space-y-4 max-w-md">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </section>

      {/* SECTION 4: Exchange Rates */}
      <section className="border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3.5 w-72" />
            </div>
          </div>
          <Skeleton className="h-8.5 w-32" />
        </div>

        <div className="mt-6 border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="p-4 flex justify-between items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="size-7" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

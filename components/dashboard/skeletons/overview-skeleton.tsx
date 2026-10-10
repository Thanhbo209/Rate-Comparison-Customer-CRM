import { Skeleton } from "@/components/ui/skeleton";
import { StatCardsSkeleton } from "./stat-cards-skeleton";

export function OverviewSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-busy="true">
      <span className="sr-only">Loading dashboard overview...</span>

      {/* Hero Slogan Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-7">
        <div className="flex flex-col-reverse gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-36 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-72 sm:w-96" />
            <Skeleton className="h-4 w-full max-w-md" />
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <Skeleton className="h-9 w-36 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          </div>
          <Skeleton className="hidden md:block h-32 w-44 rounded-xl shrink-0" />
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <StatCardsSkeleton count={4} />

      {/* Main Content Grid: 2 Cols Left + 1 Col Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Card (Charts / Table) */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="space-y-1">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3.5 w-60" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>

        {/* Right Card (Rankings / Activity) */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3.5 w-48" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0"
              >
                <div className="flex items-center gap-2.5">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

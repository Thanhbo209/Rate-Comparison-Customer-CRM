import { Skeleton } from "@/components/ui/skeleton";
import { StatCardsSkeleton } from "./stat-cards-skeleton";

export function SalesOverviewSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-busy="true">
      <span className="sr-only">Loading sales overview...</span>

      {/* Hero Slogan Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-7">
        <div className="flex flex-col-reverse gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-32 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-72 sm:w-96" />
            <Skeleton className="h-4 w-full max-w-md" />
            <div className="pt-2">
              <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
          </div>
          <Skeleton className="hidden md:block h-32 w-44 rounded-xl shrink-0" />
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <StatCardsSkeleton count={4} />

      {/* Sales Analytics Charts (2 cards side by side) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="space-y-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3.5 w-64" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-60 w-full rounded-xl" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="space-y-1">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3.5 w-60" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-60 w-full rounded-xl" />
        </div>
      </div>

      {/* Recent Shipments & Rate Comparison Snapshot */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="space-y-1">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-3.5 w-72" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20"
            >
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Carrier Performance & Customer Portfolio (2 cols left, 1 col right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top Carriers & Freight Agents by Profit (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/60 p-5">
            <div className="space-y-1">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-3.5 w-80" />
            </div>
            <Skeleton className="h-4 w-28" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium"><Skeleton className="h-3.5 w-24" /></th>
                  <th className="px-5 py-3 font-medium"><Skeleton className="h-3.5 w-14" /></th>
                  <th className="px-5 py-3 font-medium"><Skeleton className="h-3.5 w-16" /></th>
                  <th className="px-5 py-3 font-medium"><Skeleton className="h-3.5 w-20" /></th>
                  <th className="px-5 py-3 text-right font-medium"><Skeleton className="ml-auto h-3.5 w-16" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-5 rounded-full shrink-0" />
                        <div className="space-y-1">
                          <Skeleton className="h-3.5 w-32" />
                          <Skeleton className="h-2.5 w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><Skeleton className="h-3.5 w-16" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-3.5 w-16" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-3.5 w-20" /></td>
                    <td className="px-5 py-3.5 text-right"><Skeleton className="ml-auto h-3.5 w-12" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Key Customers & Quick Operations (1 col) */}
        <div className="space-y-6">
          {/* Key Customer Accounts */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3.5 w-16" />
            </div>
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20"
                >
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Operations Launchpad */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="space-y-1 pb-2 border-b border-border/60">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-background"
                >
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="size-7 rounded-md shrink-0" />
                    <div className="space-y-1">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-2.5 w-36" />
                    </div>
                  </div>
                  <Skeleton className="size-3.5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

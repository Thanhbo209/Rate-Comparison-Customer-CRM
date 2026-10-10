import { Skeleton } from "@/components/ui/skeleton";
import { StatCardsSkeleton } from "./stat-cards-skeleton";

export function AdminOverviewSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-busy="true">
      <span className="sr-only">Loading administrator overview...</span>

      {/* Hero Slogan Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-7">
        <div className="flex flex-col-reverse gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-36 rounded-full" />
              <Skeleton className="h-4 w-28" />
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

      {/* Main Content Split: Team Members Table (2 cols) & Org Info / Activity (1 col) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Organization Team Members (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/60 p-5">
            <div className="space-y-1">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3.5 w-60" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium"><Skeleton className="h-3.5 w-16" /></th>
                  <th className="px-5 py-3 font-medium"><Skeleton className="h-3.5 w-12" /></th>
                  <th className="px-5 py-3 font-medium"><Skeleton className="h-3.5 w-16" /></th>
                  <th className="px-5 py-3 font-medium"><Skeleton className="h-3.5 w-14" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-7 rounded-full shrink-0" />
                        <div className="space-y-1">
                          <Skeleton className="h-3.5 w-28" />
                          <Skeleton className="h-2.5 w-20" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-4 w-16 rounded" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-3.5 w-24" />
                    </td>
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-3.5 w-16" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Activity & CRM Status (1 col) */}
        <div className="space-y-6">
          {/* Organization Info Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
            <Skeleton className="h-5 w-32 border-b border-border/60 pb-2" />
            <div className="space-y-3 pt-1">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-border/50 last:border-b-0">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-28" />
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
            <Skeleton className="h-5 w-28" />
            <div className="space-y-3.5">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Skeleton className="size-6 rounded-full shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-52" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

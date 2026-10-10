import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "./page-header-skeleton";

export function RateComparisonSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-busy="true">
      <span className="sr-only">Loading freight rate comparison...</span>

      {/* Top Header */}
      <PageHeaderSkeleton hasAction={false} />

      {/* Overall Totals & Agent Analytics Banner */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-5">
        {/* Banner Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-9 rounded-xl shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-3 w-72" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-24 rounded-lg" />
            <Skeleton className="h-6 w-24 rounded-lg" />
            <Skeleton className="h-6 w-28 rounded-lg" />
          </div>
        </div>

        {/* Analytics Grid: 4 Stat Cards Left + Top 5 Providers Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border bg-card p-5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="size-9 rounded-lg shrink-0" />
                </div>
                <div className="mt-3 space-y-1.5">
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-6 rounded-xl border border-border/80 bg-muted/20 p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="divide-y divide-border/40">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2.5 first:pt-1 last:pb-1"
                  >
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="size-6 rounded-full shrink-0" />
                      <div className="space-y-1">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-2.5 w-36" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Toolbar Card */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-full sm:w-80 rounded-lg" />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-8.5 w-36 rounded-lg" />
            <Skeleton className="h-8.5 w-36 rounded-lg" />
            <Skeleton className="h-8.5 w-36 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Multi-Carrier Shipments Table */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted/50 border-b border-border text-[11px] text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="py-3 px-3 w-10 text-center"></th>
                <th className="py-3 px-4"><Skeleton className="h-3.5 w-20" /></th>
                <th className="py-3 px-4"><Skeleton className="h-3.5 w-20" /></th>
                <th className="py-3 px-4"><Skeleton className="h-3.5 w-16" /></th>
                <th className="py-3 px-4"><Skeleton className="h-3.5 w-20" /></th>
                <th className="py-3 px-4"><Skeleton className="h-3.5 w-20" /></th>
                <th className="py-3 px-4"><Skeleton className="h-3.5 w-20" /></th>
                <th className="py-3 px-4 text-right"><Skeleton className="ml-auto h-3.5 w-14" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, rIdx) => (
                <tr key={rIdx}>
                  <td className="py-3.5 px-3 text-center">
                    <Skeleton className="size-6 rounded-md mx-auto" />
                  </td>
                  <td className="py-3.5 px-4">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </td>
                  <td className="py-3.5 px-4"><Skeleton className="h-4 w-28" /></td>
                  <td className="py-3.5 px-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="py-3.5 px-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="py-3.5 px-4"><Skeleton className="h-5 w-14 rounded-full" /></td>
                  <td className="py-3.5 px-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="py-3.5 px-4 text-right">
                    <Skeleton className="ml-auto h-8 w-24 rounded-lg" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

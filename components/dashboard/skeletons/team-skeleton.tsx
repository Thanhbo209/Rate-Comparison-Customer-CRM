import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "./page-header-skeleton";
import { StatCardsSkeleton } from "./stat-cards-skeleton";

export function TeamSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-busy="true">
      <span className="sr-only">Loading team members...</span>

      {/* Top Header */}
      <PageHeaderSkeleton hasAction={true} />

      {/* 3 Summary Cards */}
      <StatCardsSkeleton
        count={3}
        columnsClass="grid grid-cols-1 gap-4 sm:grid-cols-3"
      />

      {/* Table 1: Active Members */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 p-5">
          <div className="space-y-1">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3.5 w-60" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground">
              <tr>
                <th className="py-3 px-5"><Skeleton className="h-4 w-20" /></th>
                <th className="py-3 px-5"><Skeleton className="h-4 w-16" /></th>
                <th className="py-3 px-5"><Skeleton className="h-4 w-24" /></th>
                <th className="py-3 px-5 text-right"><Skeleton className="ml-auto h-4 w-16" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {Array.from({ length: 4 }).map((_, idx) => (
                <tr key={idx}>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-8 rounded-full shrink-0" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </td>
                  <td className="py-4 px-5">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <Skeleton className="h-8 w-28 rounded-lg" />
                      <Skeleton className="size-8 rounded-lg" />
                    </div>
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

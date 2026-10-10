import { Skeleton } from "@/components/ui/skeleton";

interface DataTableSkeletonProps {
  columns?: number;
  rows?: number;
  hasFilters?: boolean;
  hasPagination?: boolean;
  asStatus?: boolean;
}

export function DataTableSkeleton({
  columns = 6,
  rows = 8,
  hasFilters = true,
  hasPagination = true,
  asStatus = false,
}: DataTableSkeletonProps) {
  return (
    <div
      className="rounded-md border border-border bg-card shadow-xs"
      role={asStatus ? "status" : undefined}
      aria-busy={asStatus ? "true" : undefined}
    >
      {asStatus && <span className="sr-only">Loading table data...</span>}

      {/* Search and Filters Bar */}
      {hasFilters && (
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-8.5 w-36 rounded-lg" />
            <Skeleton className="h-8.5 w-36 rounded-lg" />
            <Skeleton className="h-8.5 w-28 rounded-lg" />
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th
                  key={i}
                  className={`px-5 py-3 font-medium ${
                    i === columns - 1 ? "text-right" : ""
                  }`}
                >
                  <Skeleton
                    className={`h-4 ${
                      i === 0
                        ? "w-28"
                        : i === columns - 1
                          ? "ml-auto w-16"
                          : "w-20"
                    }`}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, rIdx) => (
              <tr key={rIdx}>
                {Array.from({ length: columns }).map((_, cIdx) => (
                  <td
                    key={cIdx}
                    className={`px-5 py-3.5 ${
                      cIdx === columns - 1 ? "text-right" : ""
                    }`}
                  >
                    {cIdx === 0 ? (
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-8 shrink-0 rounded-lg" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-28 sm:w-36" />
                          <Skeleton className="h-3 w-20 sm:w-24" />
                        </div>
                      </div>
                    ) : cIdx === columns - 1 ? (
                      <div className="inline-flex items-center justify-end gap-1">
                        <Skeleton className="size-7 rounded-md" />
                        <Skeleton className="size-7 rounded-md" />
                        <Skeleton className="size-7 rounded-md" />
                      </div>
                    ) : (
                      <Skeleton
                        className={`h-4 ${
                          cIdx % 2 === 0 ? "w-24" : "w-16"
                        }`}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {hasPagination && (
        <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-4 w-36" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}

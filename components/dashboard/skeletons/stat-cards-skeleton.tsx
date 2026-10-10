import { Skeleton } from "@/components/ui/skeleton";

interface StatCardsSkeletonProps {
  count?: number;
  columnsClass?: string;
  asStatus?: boolean;
}

export function StatCardsSkeleton({
  count = 4,
  columnsClass = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
  asStatus = false,
}: StatCardsSkeletonProps) {
  return (
    <div
      className={columnsClass}
      role={asStatus ? "status" : undefined}
      aria-busy={asStatus ? "true" : undefined}
    >
      {asStatus && <span className="sr-only">Loading metrics...</span>}
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-border bg-card p-5 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="size-9 rounded-lg shrink-0" />
          </div>

          <div className="mt-3 space-y-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3.5 w-36" />
          </div>
        </div>
      ))}
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

interface PageHeaderSkeletonProps {
  hasAction?: boolean;
  asStatus?: boolean;
}

export function PageHeaderSkeleton({
  hasAction = true,
  asStatus = false,
}: PageHeaderSkeletonProps) {
  return (
    <div
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      role={asStatus ? "status" : undefined}
      aria-busy={asStatus ? "true" : undefined}
    >
      {asStatus && <span className="sr-only">Loading page header...</span>}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-52 sm:w-64" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-72 sm:w-96 max-w-full" />
      </div>

      {hasAction && (
        <Skeleton className="h-9 w-32 rounded-lg shrink-0" />
      )}
    </div>
  );
}

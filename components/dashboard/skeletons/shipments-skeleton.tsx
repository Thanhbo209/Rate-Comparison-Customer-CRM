import { PageHeaderSkeleton } from "./page-header-skeleton";
import { StatCardsSkeleton } from "./stat-cards-skeleton";
import { DataTableSkeleton } from "./data-table-skeleton";

export function ShipmentsSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-busy="true">
      <span className="sr-only">Loading shipments directory...</span>
      <PageHeaderSkeleton hasAction={true} />
      <StatCardsSkeleton count={4} />
      <DataTableSkeleton columns={7} rows={8} hasFilters={true} hasPagination={true} />
    </div>
  );
}

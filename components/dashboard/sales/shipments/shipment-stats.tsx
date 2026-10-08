import { Package, ArrowDownLeft, ArrowUpRight, Building2 } from "lucide-react";
import type { ShipmentStats as ShipmentStatsType } from "@/lib/shipment/types";

export function ShipmentStats({ stats }: { stats: ShipmentStatsType }) {
  const cards = [
    {
      title: "Total Shipments",
      value: stats.totalShipments,
      description: "active freight flows",
      icon: Package,
      tone: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Import Flows",
      value: stats.importCount,
      description: "inbound shipments",
      icon: ArrowDownLeft,
      tone: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Export Flows",
      value: stats.exportCount,
      description: "outbound shipments",
      icon: ArrowUpRight,
      tone: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Shipper Accounts",
      value: stats.totalCustomers,
      description: "with active cargo",
      icon: Building2,
      tone: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.title}
            className="rounded-2xl border border-border bg-card p-5 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {c.title}
              </span>
              <div
                className={`flex size-8 items-center justify-center rounded-lg ${c.bg} ${c.tone}`}
              >
                <Icon className="size-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {c.value}
              </span>
              <span className="text-xs text-muted-foreground">
                {c.description}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

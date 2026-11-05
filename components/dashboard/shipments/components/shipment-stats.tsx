import { Package, ArrowDownLeft, ArrowUpRight, Building2 } from "lucide-react";
import type { ShipmentStats as ShipmentStatsType } from "@/lib/shipment/types";
import { StatCard } from "@/components/ui/stat-card";

export function ShipmentStats({ stats }: { stats: ShipmentStatsType }) {
  const cards = [
    {
      title: "Total Shipments",
      value: stats.totalShipments,
      description: "active freight flows",
      icon: Package,
      variant: "primary" as const,
    },
    {
      title: "Import Flows",
      value: stats.importCount,
      description: "inbound shipments",
      icon: ArrowDownLeft,
      variant: "sky" as const,
    },
    {
      title: "Export Flows",
      value: stats.exportCount,
      description: "outbound shipments",
      icon: ArrowUpRight,
      variant: "emerald" as const,
    },
    {
      title: "Shipper Accounts",
      value: stats.totalCustomers,
      description: "with active cargo",
      icon: Building2,
      variant: "amber" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          description={card.description}
          icon={card.icon}
          variant={card.variant}
        />
      ))}
    </div>
  );
}

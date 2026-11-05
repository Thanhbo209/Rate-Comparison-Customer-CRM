import { Users, Package, Tags, MapPin } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import type { CustomerStats as CustomerStatsType } from "@/lib/customer/types";

interface CustomerStatsProps {
  stats: CustomerStatsType;
}

export function CustomerStats({ stats }: CustomerStatsProps) {
  const cards = [
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      description: "Active CRM accounts",
      icon: Users,
      variant: "primary" as const,
    },
    {
      title: "Active Shipments",
      value: stats.totalShipments,
      description: "Import & export flows",
      icon: Package,
      variant: "sky" as const,
    },
    {
      title: "Commodity Sectors",
      value: stats.totalCommodities,
      description: "Distinct cargo categories",
      icon: Tags,
      variant: "emerald" as const,
    },
    {
      title: "Industrial Zones",
      value: stats.totalZones,
      description: "Manufacturing hubs covered",
      icon: MapPin,
      variant: "purple" as const,
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

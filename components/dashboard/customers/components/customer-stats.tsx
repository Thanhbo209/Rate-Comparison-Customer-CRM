import React from "react";
import { Users, Package, Tags, MapPin } from "lucide-react";
import { StatCard } from "@/components/dashboard/overview/stat-card";
import type { CustomerStats as CustomerStatsType } from "@/lib/customer/types";

interface CustomerStatsProps {
  stats: CustomerStatsType;
}

export function CustomerStats({ stats }: CustomerStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Customers"
        value={stats.totalCustomers}
        icon={Users}
        variant="primary"
        description="Active CRM accounts"
      />

      <StatCard
        title="Active Shipments"
        value={stats.totalShipments}
        icon={Package}
        variant="sky"
        description="Import & export flows"
      />

      <StatCard
        title="Commodity Sectors"
        value={stats.totalCommodities}
        icon={Tags}
        variant="emerald"
        description="Distinct cargo categories"
      />

      <StatCard
        title="Industrial Zones"
        value={stats.totalZones}
        icon={MapPin}
        variant="purple"
        description="Manufacturing hubs covered"
      />
    </div>
  );
}

"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { SectionCard } from "@/components/dashboard/overview/section-card";
import { Building2 } from "lucide-react";
import type { ShipmentComparisonDetail } from "@/lib/rate/types";
import { rankShipments } from "@/lib/rate/shipment-ranking";

interface CostVsProfitShipmentChartProps {
  shipments: ShipmentComparisonDetail[];
  customers: { id: string; companyName: string }[];
  baseCurrency: string;
  initialCustomerId?: string;
}

const chartConfig: ChartConfig = {
  cost: {
    label: "Pay Agent (Net)",
    color: "#94a3b8", // Grey
  },
  profit: {
    label: "You Keep (Profit)",
    color: "#10b981", // Green
  },
};

export function CostVsProfitShipmentChart({
  shipments,
  customers,
  baseCurrency,
  initialCustomerId,
}: CostVsProfitShipmentChartProps) {
  // Rank all shipments upfront globally using shipment-ranking
  const rankings = React.useMemo(() => {
    return rankShipments(shipments);
  }, [shipments]);

  // Find customers who have shipments
  const customersWithShipments = React.useMemo(() => {
    const custIdsWithShipments = new Set(shipments.map((s) => s.customerId));
    return customers.filter((c) => custIdsWithShipments.has(c.id));
  }, [customers, shipments]);

  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>(
    () => {
      if (initialCustomerId) return initialCustomerId;
      if (customersWithShipments.length > 0)
        return customersWithShipments[0].id;
      return customers[0]?.id || "";
    },
  );

  // Filter shipments for the selected customer
  const filteredShipments = React.useMemo(() => {
    if (!selectedCustomerId) return [];
    return shipments.filter((s) => s.customerId === selectedCustomerId);
  }, [shipments, selectedCustomerId]);

  const chartData = React.useMemo(() => {
    return filteredShipments.map((s) => {
      const rankInfo = rankings.get(s.id);
      const net = rankInfo?.net ?? 0;
      const profit = rankInfo?.profit ?? 0;
      const gross = rankInfo?.gross ?? net + profit;
      const isBest = rankInfo?.isBest ?? false;
      const marginPercent = rankInfo?.marginPercent ?? 0;

      return {
        id: s.id,
        name: s.name.length > 18 ? `${s.name.slice(0, 16)}...` : s.name,
        fullName: s.name,
        cost: Math.round(net),
        profit: Math.round(Math.max(0, profit)),
        gross: Math.round(gross),
        marginPercent,
        isBest,
      };
    });
  }, [filteredShipments, rankings]);

  const bestShipment = React.useMemo(() => {
    return chartData.find((d) => d.isBest);
  }, [chartData]);

  const selectedCustomerName =
    customers.find((c) => c.id === selectedCustomerId)?.companyName ||
    "Selected Customer";

  return (
    <SectionCard
      title="Cost vs. Profit per Shipment"
      subtitle="Selling price split into agent cost (grey) and kept profit (green)"
      action={
        <div className="flex items-center gap-2">
          <Building2 className="size-3.5 text-muted-foreground hidden sm:inline-block" />
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="h-8 max-w-40 rounded-lg border border-border bg-background px-2.5 py-1 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </div>
      }
      className="h-full flex flex-col justify-between"
    >
      {chartData.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center text-center text-xs text-muted-foreground italic">
          <p>No shipments recorded for {selectedCustomerName}.</p>
          <p className="mt-1 text-[11px] opacity-75">
            Select a different customer account from the dropdown.
          </p>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {/* Highlight Banner if there is a Best Choice */}
          {bestShipment && chartData.length > 1 && (
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-1.5 font-medium">
                <span>
                  Best Choice: <strong>{bestShipment.fullName}</strong>
                </span>
              </span>
              <span className="font-bold">
                {bestShipment.marginPercent.toFixed(1)}% margin
              </span>
            </div>
          )}

          {/* Recharts Stacked Horizontal Bar Chart */}
          <ChartContainer config={chartConfig} className="h-52 w-full">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                opacity={0.25}
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v.toLocaleString()}`}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={100}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const isCost = name === "cost";
                      const label = isCost
                        ? "Agent Cost (Pay)"
                        : "Your Profit (Keep)";
                      const color = isCost
                        ? "text-[#ff7d13]"
                        : "text-[#10b981] dark:text-emerald-400";
                      return (
                        <div className="flex items-center justify-between gap-4 text-xs">
                          <span className="text-muted-foreground">
                            {label}:
                          </span>
                          <span className={`font-bold ${color}`}>
                            {isCost ? "" : "+"}
                            {Number(value).toLocaleString()} {baseCurrency}
                          </span>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Bar
                dataKey="cost"
                stackId="shipmentBar"
                fill="#ff7d13"
                radius={[4, 0, 0, 4]}
                name="cost"
              />
              <Bar
                dataKey="profit"
                stackId="shipmentBar"
                fill="#10b981"
                radius={[0, 4, 4, 0]}
                name="profit"
              />
            </BarChart>
          </ChartContainer>

          {/* Legend and Price Tag Description */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-xs bg-[#ff7d13]" />
                <span>Agent Cost (Pay)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-xs bg-emerald-500" />
                <span>Profit (Keep)</span>
              </span>
            </div>
            <span className="text-[10px]">Total Bar = Selling Price</span>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

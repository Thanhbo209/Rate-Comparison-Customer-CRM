"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { SectionCard } from "@/components/dashboard/overview/section-card";
import { Clock } from "lucide-react";
import type { ShipmentComparisonDetail } from "@/lib/rate/types";
import { getShipmentTotals } from "@/lib/rate/shipment-ranking";

interface ProfitOverTimeChartProps {
  shipments: ShipmentComparisonDetail[];
  baseCurrency: string;
}

const chartConfig: ChartConfig = {
  profit: {
    label: "Quoted Profit",
    color: "#10b981",
  },
};

export function ProfitOverTimeChart({
  shipments,
  baseCurrency,
}: ProfitOverTimeChartProps) {
  const chartData = React.useMemo(() => {
    // Group shipments by Month Year
    const monthMap = new Map<
      string,
      {
        timestamp: number;
        monthLabel: string;
        profit: number;
        shipmentsCount: number;
      }
    >();

    for (const s of shipments) {
      const date = s.createdAt ? new Date(s.createdAt) : new Date();
      if (isNaN(date.getTime())) continue;

      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11
      const key = `${year}-${String(month + 1).padStart(2, "0")}`;
      const monthLabel = date.toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      });

      const totals = getShipmentTotals(s.rates);
      const existing = monthMap.get(key) || {
        timestamp: new Date(year, month, 1).getTime(),
        monthLabel,
        profit: 0,
        shipmentsCount: 0,
      };

      existing.profit += Math.max(0, totals.profit);
      existing.shipmentsCount += 1;
      monthMap.set(key, existing);
    }

    // Sort chronologically
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => ({
        month: data.monthLabel,
        profit: Math.round(data.profit),
        shipmentsCount: data.shipmentsCount,
      }));
  }, [shipments]);

  return (
    <SectionCard
      title="Profit Over Time"
      subtitle="Quoted freight profit aggregated by month"
      action={
        <span
          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
          title="Past months calculated using today's exchange rates"
        >
          <Clock className="size-3 text-muted-foreground" />
          at current rates
        </span>
      }
      className="h-full flex flex-col justify-between"
    >
      {chartData.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-xs text-muted-foreground italic">
          No dated shipments available to chart.
        </div>
      ) : (
        <div className="pt-2">
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="profitAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                opacity={0.25}
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v.toLocaleString()}`}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip
                cursor={{
                  stroke: "#10b981",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
                content={
                  <ChartTooltipContent
                    formatter={(val) => (
                      <div className="flex items-center justify-between gap-4 text-xs">
                        <span className="text-muted-foreground">Profit:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          +{Number(val).toLocaleString()} {baseCurrency}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#profitAreaGrad)"
              />
            </AreaChart>
          </ChartContainer>
          <p className="mt-2 text-right text-[10px] text-muted-foreground">
            Calculated in base currency ({baseCurrency}) • at current rates
          </p>
        </div>
      )}
    </SectionCard>
  );
}

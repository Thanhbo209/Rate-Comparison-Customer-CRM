"use client";

import * as React from "react";
import type { ShipmentComparisonDetail } from "@/lib/rate/types";
import { CostVsProfitShipmentChart } from "./cost-vs-profit-shipment-chart";
import { ProfitOverTimeChart } from "./profit-over-time-chart";

interface SalesAnalyticsChartsProps {
  shipments: ShipmentComparisonDetail[];
  customers: { id: string; companyName: string }[];
  baseCurrency: string;
}

export function SalesAnalyticsCharts({
  shipments,
  customers,
  baseCurrency,
}: SalesAnalyticsChartsProps) {
  return (
    <div className="flex flex-col xl:flex-row gap-6 items-stretch">
      {/* Chart 1: Cost vs. Profit per Shipment (Horizontal Bar Chart) */}
      <div className="flex-1 min-w-0">
        <CostVsProfitShipmentChart
          shipments={shipments}
          customers={customers}
          baseCurrency={baseCurrency}
        />
      </div>

      {/* Chart 3: Profit Over Time (Area Chart with 'at current rates') */}
      <div className="flex-1 min-w-0">
        <ProfitOverTimeChart
          shipments={shipments}
          baseCurrency={baseCurrency}
        />
      </div>
    </div>
  );
}

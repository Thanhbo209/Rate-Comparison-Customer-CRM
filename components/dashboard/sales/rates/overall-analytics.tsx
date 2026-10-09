import React from "react";
import {
  BarChart3,
  Award,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Percent,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/overview/stat-card";

export interface MinimalFreightItem {
  freight: string;
  net: number;
  gross: number;
  quantity?: number;
}

export interface MinimalRate {
  providerId?: string;
  providerName?: string;
  provider?: { id?: string; name: string };
  freightItems?: MinimalFreightItem[];
}

export interface MinimalShipment {
  id?: string;
  rates?: MinimalRate[];
}

export interface AgentComparisonSummary {
  providerId: string;
  providerName: string;
  shipmentCount: number;
  optionsCount: number;
  totalFreightItems?: number;
  totalNet: number;
  totalGross: number;
  totalProfit: number;
  averageMarginPercent: number;
  bestCostCount?: number;
  topMarginCount?: number;
}

export interface OverallProfitSummaryProps {
  totalShipments: number;
  totalRates: number;
  totalFreightItems: number;
  totalNet: number;
  totalGross: number;
  totalProfit: number;
  averageMarginPercent: number;
  agentRankings?: AgentComparisonSummary[];
}

export interface OverallAnalyticsProps {
  overall: OverallProfitSummaryProps;
  baseCurrency: string;
  shipments: MinimalShipment[];
}

export interface TopProviderItem {
  rank: number;
  providerId: string;
  name: string;
  profit: number;
  gross: number;
  net: number;
  marginPercent: number;
  optionsCount: number;
  shipmentCount: number;
}

/**
 * Computes the top 5 providers (carriers/agents) ranked by net profit.
 * Prioritizes pre-aggregated agentRankings from the overall profit summary
 * and falls back to computing directly from shipments.
 */
export function getTopProviders(
  shipments?: MinimalShipment[] | null,
  agentRankings?: AgentComparisonSummary[] | null,
  limit = 5
): TopProviderItem[] {
  if (agentRankings && agentRankings.length > 0) {
    return agentRankings
      .filter((ag) => ag.totalProfit > 0)
      .slice(0, limit)
      .map((ag, idx) => ({
        rank: idx + 1,
        providerId: ag.providerId,
        name: ag.providerName,
        profit: ag.totalProfit,
        gross: ag.totalGross,
        net: ag.totalNet,
        marginPercent: ag.averageMarginPercent,
        optionsCount: ag.optionsCount,
        shipmentCount: ag.shipmentCount,
      }));
  }

  if (!shipments || shipments.length === 0) return [];

  const providerMap = new Map<
    string,
    {
      providerId: string;
      name: string;
      totalProfit: number;
      totalGross: number;
      totalNet: number;
      optionsCount: number;
      shipmentIds: Set<string>;
    }
  >();

  shipments.forEach((s, sIdx) => {
    const shipmentId = s.id || `shipment-${sIdx}`;
    (s.rates || []).forEach((r) => {
      const pId =
        r.providerId || r.provider?.id || r.providerName || r.provider?.name || "unknown";
      const pName =
        r.provider?.name || r.providerName || "Unknown Carrier";

      let rateNet = 0;
      let rateGross = 0;
      (r.freightItems || []).forEach((fi) => {
        const qty =
          typeof fi.quantity === "number" && fi.quantity > 0 ? fi.quantity : 1;
        rateNet += (fi.net || 0) * qty;
        rateGross += (fi.gross || 0) * qty;
      });
      const rateProfit = rateGross - rateNet;

      const existing = providerMap.get(pId);
      if (!existing) {
        providerMap.set(pId, {
          providerId: pId,
          name: pName,
          totalProfit: rateProfit,
          totalGross: rateGross,
          totalNet: rateNet,
          optionsCount: 1,
          shipmentIds: new Set([shipmentId]),
        });
      } else {
        existing.totalProfit += rateProfit;
        existing.totalGross += rateGross;
        existing.totalNet += rateNet;
        existing.optionsCount += 1;
        existing.shipmentIds.add(shipmentId);
      }
    });
  });

  return Array.from(providerMap.values())
    .filter((p) => p.totalProfit > 0)
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, limit)
    .map((p, idx) => ({
      rank: idx + 1,
      providerId: p.providerId,
      name: p.name,
      profit: p.totalProfit,
      gross: p.totalGross,
      net: p.totalNet,
      marginPercent:
        p.totalGross > 0 ? (p.totalProfit / p.totalGross) * 100 : 0,
      optionsCount: p.optionsCount,
      shipmentCount: p.shipmentIds.size,
    }));
}

export function OverallAnalytics({
  overall,
  baseCurrency,
  shipments,
}: OverallAnalyticsProps) {
  const topProviders = getTopProviders(shipments, overall.agentRankings, 5);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-5">
      {/* Header with Title, Description, and Summary Chips */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BarChart3 className="size-4.5" />
          </div>
          <div>
            <h2 className="font-heading text-sm font-bold text-foreground">
              Overall Total & Agent Analytics
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Consolidated profit across all active shipments converted into{" "}
              {baseCurrency}.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
            {overall.totalShipments} Shipments
          </span>
          <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
            {overall.totalRates} Rate Quotes
          </span>
          <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
            {overall.totalFreightItems} Freight Items
          </span>
        </div>
      </div>

      {/* Grid: 4 Stat Cards on Left (2x2) and Top 5 Providers on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 4 Stat Cards in 2x2 grid (1 col on mobile) */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatCard
            title="Total Buying Cost (Net)"
            value={`${overall.totalNet.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })} ${baseCurrency}`}
            icon={Wallet}
            variant="sky"
            description="Consolidated carrier purchasing cost across all quotes"
          />
          <StatCard
            title="Total Selling Quote (Gross)"
            value={`${overall.totalGross.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })} ${baseCurrency}`}
            icon={ArrowUpRight}
            variant="primary"
            description="Total quotation value presented to customers"
          />
          <StatCard
            title="Total Profit"
            value={`+${overall.totalProfit.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })} ${baseCurrency}`}
            icon={TrendingUp}
            variant="emerald"
            description="Net profit spread across all carrier quote lines"
          />
          <StatCard
            title="Avg. Profit Margin %"
            value={`${overall.averageMarginPercent.toFixed(1)}%`}
            icon={Percent}
            variant="purple"
            description="Average return on gross quoted revenue"
          />
        </div>

        {/* Top 5 Providers by Profit List */}
        <div className="lg:col-span-6 rounded-xl border border-border/80 bg-muted/20 p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Award className="size-3.5 text-primary" />
                <span>Top 5 Providers by Profit</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">
                Ranked by net profit spread
              </span>
            </div>

            {topProviders.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground italic">
                No profitable providers yet. Configure carrier rates to view rankings.
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {topProviders.map((item) => (
                  <div
                    key={item.providerId || item.name}
                    className="flex items-center justify-between py-2.5 first:pt-1 last:pb-1"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                        {item.rank}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-xs truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {item.optionsCount}{" "}
                          {item.optionsCount === 1 ? "quote" : "quotes"} &middot;{" "}
                          {item.shipmentCount}{" "}
                          {item.shipmentCount === 1 ? "shipment" : "shipments"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        +
                        {item.profit.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}{" "}
                        {baseCurrency}
                      </p>
                      <p className="text-[10px] font-medium text-foreground/75 mt-0.5">
                        {item.marginPercent.toFixed(1)}% margin
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

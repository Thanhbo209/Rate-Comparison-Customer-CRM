"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  Truck,
  Plus,
  Trash2,
  TrendingUp,
  Award,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Tag,
  DollarSign,
  Percent,
  CheckCircle2,
  Layers,
  ArrowLeftRight,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
  ChevronRight,
  Package,
  BarChart3,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddRateDialog } from "./add-rate-dialog";
import { ManageFreightItemsDialog } from "./manage-freight-items-dialog";
import { deleteShipmentRateAction } from "@/lib/rate/actions";
import type {
  ShipmentComparisonDetail,
  ProviderItem,
  ShipmentRateItem,
  MultiShipmentRateOverview,
} from "@/lib/rate/types";

interface RateComparisonViewProps {
  shipment: ShipmentComparisonDetail | null;
  availableShipments: {
    id: string;
    name: string;
    direction: "IMPORT" | "EXPORT";
    customer: { id: string; companyName: string };
    _count?: { rates: number };
  }[];
  providers: ProviderItem[];
  overview?: MultiShipmentRateOverview | null;
  role: "ADMIN" | "SALES" | "SALES_MANAGER";
  organizationName: string;
  onManageFreightItems?: (rate: ShipmentRateItem) => void;
}

export function RateComparisonView({
  shipment,
  availableShipments,
  providers,
  overview,
  role,
  organizationName,
  onManageFreightItems,
}: RateComparisonViewProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [expandedShipments, setExpandedShipments] = useState<Record<string, boolean>>(() => {
    // Expand the current shipment by default if selected
    if (shipment?.id) return { [shipment.id]: true };
    if (overview?.shipments[0]?.id) return { [overview.shipments[0].id]: true };
    return {};
  });

  const [addRateOpen, setAddRateOpen] = useState(false);
  const [targetShipmentForAdd, setTargetShipmentForAdd] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [activeManageRate, setActiveManageRate] = useState<ShipmentRateItem | null>(null);
  const [activeManageShipmentName, setActiveManageShipmentName] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const toggleShipmentExpand = (id: string) => {
    setExpandedShipments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectShipment = (id: string) => {
    router.push(`?shipmentId=${id}`);
  };

  const handleDeleteRate = (rateId: string, providerName: string) => {
    if (!confirm(`Are you sure you want to remove the rate option for ${providerName}?`)) {
      return;
    }
    startTransition(async () => {
      const res = await deleteShipmentRateAction({ shipmentRateId: rateId });
      if (res.success) {
        router.refresh();
      }
    });
  };

  // List of shipments to render
  const shipmentsToDisplay = overview?.shipments || (shipment ? [shipment] : []);
  const baseCurrency = overview?.baseCurrency || shipment?.baseCurrency || "USD";
  const overall = overview?.overall;

  return (
    <div className="space-y-8">
      {/* Top Header & Global Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Freight Rate Comparison
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Multi-Carrier Analysis
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Compare carrier buying costs, customer quotes, and profit margins side-by-side for {organizationName}.
          </p>
        </div>

        {/* View Switcher: Card vs Table */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-border bg-muted/40 p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("card")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === "card"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="size-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === "table"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TableIcon className="size-3.5" />
              <span>Table</span>
            </button>
          </div>

          {availableShipments.length > 0 && (
            <Button
              onClick={() => {
                const target = shipment || shipmentsToDisplay[0];
                if (target) {
                  setTargetShipmentForAdd({ id: target.id, name: target.name });
                  setAddRateOpen(true);
                }
              }}
              size="sm"
              className="gap-1.5 h-9 text-xs shrink-0"
            >
              <Plus className="size-3.5" />
              <span>Add Carrier Option</span>
            </Button>
          )}
        </div>
      </div>

      {/* OVERALL TOTALS & AGENT COMPARISON BANNER */}
      {overall && overall.totalRates > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-5">
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
                  Consolidated profit across all active shipments converted into {baseCurrency}.
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

          {/* Aggregate Profit Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3">
              <span className="text-[11px] text-muted-foreground">Total Buying Cost (Net)</span>
              <p className="font-mono text-sm font-bold text-foreground mt-0.5">
                {overall.totalNet.toLocaleString(undefined, { maximumFractionDigits: 2 })} {baseCurrency}
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3">
              <span className="text-[11px] text-muted-foreground">Total Selling Quote (Gross)</span>
              <p className="font-mono text-sm font-bold text-foreground mt-0.5">
                {overall.totalGross.toLocaleString(undefined, { maximumFractionDigits: 2 })} {baseCurrency}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
              <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                Total Profit Margin
              </span>
              <p className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                +{overall.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })} {baseCurrency}
              </p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
              <span className="text-[11px] font-medium text-primary">Avg. Profit Margin %</span>
              <p className="font-mono text-sm font-bold text-foreground mt-0.5">
                {overall.averageMarginPercent.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* AGENT (CARRIER/PROVIDER) PROFIT COMPARISON TABLE */}
          {overall.agentRankings.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Users className="size-3.5 text-primary" />
                <span>Agent Performance & Profit Comparison</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-[11px] text-muted-foreground uppercase font-semibold">
                    <tr>
                      <th className="px-3.5 py-2.5">Agent / Carrier</th>
                      <th className="px-3.5 py-2.5">Shipments</th>
                      <th className="px-3.5 py-2.5">Quotes</th>
                      <th className="px-3.5 py-2.5">Buying Net</th>
                      <th className="px-3.5 py-2.5">Selling Gross</th>
                      <th className="px-3.5 py-2.5">Total Profit</th>
                      <th className="px-3.5 py-2.5">Margin %</th>
                      <th className="px-3.5 py-2.5 text-right">Highlights</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {overall.agentRankings.map((agent, idx) => (
                      <tr key={agent.providerId} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3.5 py-2.5 font-semibold text-foreground flex items-center gap-2">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                            {idx + 1}
                          </span>
                          <span>{agent.providerName}</span>
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-muted-foreground">
                          {agent.shipmentCount}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-muted-foreground">
                          {agent.optionsCount} ({agent.totalFreightItems} charges)
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-foreground">
                          {agent.totalNet.toLocaleString(undefined, { maximumFractionDigits: 2 })} {baseCurrency}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-foreground font-semibold">
                          {agent.totalGross.toLocaleString(undefined, { maximumFractionDigits: 2 })} {baseCurrency}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          +{agent.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })} {baseCurrency}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-foreground font-medium">
                          {agent.averageMarginPercent.toFixed(1)}%
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {agent.bestCostCount > 0 && (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                {agent.bestCostCount}x Lowest Cost
                              </span>
                            )}
                            {agent.topMarginCount > 0 && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                {agent.topMarginCount}x Best Margin
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ALL SHIPMENTS LIST WITH ACCORDION DROPDOWN OF FREIGHTS */}
      {shipmentsToDisplay.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mx-auto">
            <ArrowLeftRight className="size-6" />
          </div>
          <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
            No shipments found
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            Create your first shipment to begin comparing carrier rates and itemized freight charges.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {shipmentsToDisplay.map((s) => {
            const isExpanded = !!expandedShipments[s.id];
            const hasRates = s.rates.length > 0;

            // Calculate shipment-level summary across all carrier rates
            const shipmentTotalNet = s.rates.reduce((acc, r) => acc + r.consolidatedNet, 0);
            const shipmentTotalGross = s.rates.reduce((acc, r) => acc + r.consolidatedGross, 0);
            const shipmentTotalProfit = shipmentTotalGross - shipmentTotalNet;

            return (
              <div
                key={s.id}
                className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden transition-all"
              >
                {/* BIG SHIPMENT HEADER BAR (Clickable Accordion Dropdown) */}
                <div
                  onClick={() => toggleShipmentExpand(s.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 cursor-pointer hover:bg-muted/30 transition-colors gap-4 border-b border-border/60"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <button
                      type="button"
                      className="mt-0.5 sm:mt-0 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-transform"
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-heading text-base font-bold text-foreground">
                          {s.name}
                        </h2>
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground">
                          {s.customer.companyName}
                        </span>
                        {s.direction === "IMPORT" ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                            <ArrowDownLeft className="size-3" />
                            Import
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <ArrowUpRight className="size-3" />
                            Export
                          </span>
                        )}
                        {s.commodity && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Tag className="size-3" />
                            {s.commodity}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-0.5 block">
                        {s.rates.length} carrier quote option{s.rates.length !== 1 ? "s" : ""} configured
                      </span>
                    </div>
                  </div>

                  {/* Shipment Right Controls / Quick Totals & Best for Customer Decision */}
                  <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
                    {s.bestCustomerRateCarrier && (
                      <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs">
                        <Award className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                            Best for Customer
                          </div>
                          <div className="font-semibold text-emerald-950 dark:text-emerald-100 flex items-center gap-1">
                            <span>{s.bestCustomerRateCarrier}</span>
                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              (+{s.bestCustomerRateProfit?.toLocaleString(undefined, { maximumFractionDigits: 0 })} {baseCurrency} profit)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetShipmentForAdd({ id: s.id, name: s.name });
                        setAddRateOpen(true);
                      }}
                      className="h-8 gap-1.5 text-xs font-medium"
                    >
                      <Plus className="size-3.5" />
                      <span>Add Rate</span>
                    </Button>
                  </div>
                </div>

                {/* ACCORDION CONTENT: DROPDOWN OF FREIGHTS / RATES */}
                {isExpanded && (
                  <div className="p-5 bg-background/50 space-y-6">
                    {s.rates.length === 0 ? (
                      <div className="p-8 text-center rounded-xl border border-dashed border-border/80">
                        <Truck className="size-8 mx-auto text-muted-foreground opacity-60" />
                        <h4 className="mt-2 text-xs font-semibold text-foreground">
                          No carrier rates added yet for this shipment
                        </h4>
                        <p className="mt-1 text-[11px] text-muted-foreground max-w-sm mx-auto">
                          Add a carrier quote (e.g. Maersk Direct, MSC) to configure and compare freight charges.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => {
                            setTargetShipmentForAdd({ id: s.id, name: s.name });
                            setAddRateOpen(true);
                          }}
                          className="mt-3 gap-1.5 text-xs h-8"
                        >
                          <Plus className="size-3.5" />
                          <span>Add Carrier Rate</span>
                        </Button>
                      </div>
                    ) : viewMode === "card" ? (
                      /* ─── CARD VIEW ─── */
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {s.rates.map((rate) => {
                          const isBestCustomerOption = rate.id === s.bestCustomerRateId;
                          const isBestCost = rate.id === s.bestRateId;
                          const isBestMargin = rate.id === s.highestMarginRateId;

                          return (
                            <div
                              key={rate.id}
                              className={`rounded-2xl border bg-card p-5 shadow-xs flex flex-col justify-between transition-all ${
                                isBestCustomerOption
                                  ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/2"
                                  : isBestCost
                                  ? "border-emerald-500/50 ring-1 ring-emerald-500/30"
                                  : "border-border"
                              }`}
                            >
                              <div>
                                {/* Carrier Title & Badges */}
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h3 className="font-heading text-lg font-bold text-foreground">
                                        {rate.provider.name}
                                      </h3>
                                      {isBestCustomerOption && (
                                        <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                                          Best for Customer
                                        </span>
                                      )}
                                      {isBestCost && !isBestCustomerOption && (
                                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                          Lowest Cost
                                        </span>
                                      )}
                                      {isBestMargin && (
                                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                          Top Margin
                                        </span>
                                      )}
                                    </div>
                                    {rate.optionName && (
                                      <p className="text-xs font-medium text-primary">
                                        {rate.optionName}
                                      </p>
                                    )}
                                    <span className="text-[11px] text-muted-foreground">
                                      {rate.freightItems.length} charge line items
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRate(rate.id, rate.provider.name)}
                                    disabled={isPending}
                                    title="Remove Carrier Rate"
                                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </div>

                                {/* Pricing Comparison in System Base Currency */}
                                <div className="mt-5 space-y-3">
                                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-2.5">
                                    <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                                      <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                                        Pricing ({rate.baseCurrency})
                                      </span>
                                      <span
                                        className={`font-mono font-bold text-xs ${
                                          rate.consolidatedProfit >= 0
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-destructive"
                                        }`}
                                      >
                                        {rate.consolidatedProfit >= 0 ? "+" : ""}
                                        {rate.consolidatedProfit.toLocaleString(undefined, {
                                          maximumFractionDigits: 2,
                                        })}{" "}
                                        {rate.baseCurrency} ({rate.consolidatedMarginPercent.toFixed(1)}%)
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground">Buying Cost (Net):</span>
                                      <span className="font-mono font-bold text-foreground">
                                        {rate.consolidatedNet.toLocaleString(undefined, {
                                          maximumFractionDigits: 2,
                                        })}{" "}
                                        {rate.baseCurrency}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground">Selling Quote (Gross):</span>
                                      <span className="font-mono font-bold text-foreground">
                                        {rate.consolidatedGross.toLocaleString(undefined, {
                                          maximumFractionDigits: 2,
                                        })}{" "}
                                        {rate.baseCurrency}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Line Item Previews */}
                                <div className="mt-4 space-y-1.5">
                                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Item Breakdown ({rate.baseCurrency})
                                  </div>
                                  {rate.freightItems.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">
                                      No freight items added yet. Click &quot;Manage Line Items&quot; below.
                                    </p>
                                  ) : (
                                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                      {rate.freightItems.slice(0, 4).map((fi) => (
                                        <div
                                          key={fi.id}
                                          className="flex items-center justify-between text-xs py-1 border-b border-border/40"
                                        >
                                          <span className="font-medium text-foreground truncate max-w-[140px]">
                                            {fi.freight}
                                          </span>
                                          <span className="font-mono text-muted-foreground text-[11px]">
                                            {fi.net.toLocaleString(undefined, { maximumFractionDigits: 1 })} / {fi.gross.toLocaleString(undefined, { maximumFractionDigits: 1 })} {fi.currency}
                                          </span>
                                        </div>
                                      ))}
                                      {rate.freightItems.length > 4 && (
                                        <p className="text-[10px] text-muted-foreground text-center pt-1">
                                          + {rate.freightItems.length - 4} more items
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Manage Items Action Button */}
                              <div className="mt-5 pt-3 border-t border-border/60">
                                <Button
                                  onClick={() => {
                                    setActiveManageRate(rate);
                                    setActiveManageShipmentName(s.name);
                                    onManageFreightItems?.(rate);
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-xs font-semibold gap-1.5"
                                >
                                  <Layers className="size-3.5" />
                                  <span>Manage Freight Line Items</span>
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* ─── TABLE VIEW ─── */
                      <div className="space-y-4">
                        <div className="overflow-x-auto rounded-xl border border-border bg-card">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 border-b border-border text-[11px] text-muted-foreground uppercase font-semibold">
                              <tr>
                                <th className="px-4 py-3">Carrier / Quote Option</th>
                                <th className="px-4 py-3">Charges Breakdown</th>
                                <th className="px-4 py-3">Buying Cost (Net)</th>
                                <th className="px-4 py-3">Selling Quote (Gross)</th>
                                <th className="px-4 py-3">Profit Spread</th>
                                <th className="px-4 py-3">Margin %</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {s.rates.map((rate) => {
                                const isBestCustomerOption = rate.id === s.bestCustomerRateId;
                                const isBestCost = rate.id === s.bestRateId;
                                const isBestMargin = rate.id === s.highestMarginRateId;

                                return (
                                  <tr
                                    key={rate.id}
                                    className={`hover:bg-muted/20 transition-colors ${
                                      isBestCustomerOption ? "bg-emerald-500/5 font-medium" : ""
                                    }`}
                                  >
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-foreground font-heading">
                                          {rate.provider.name}
                                        </span>
                                        {isBestCustomerOption && (
                                          <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                                            Best for Customer
                                          </span>
                                        )}
                                        {isBestCost && !isBestCustomerOption && (
                                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                            Lowest Cost
                                          </span>
                                        )}
                                        {isBestMargin && (
                                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                            Top Margin
                                          </span>
                                        )}
                                      </div>
                                      {rate.optionName && (
                                        <span className="text-[11px] text-primary block mt-0.5 font-medium">
                                          {rate.optionName}
                                        </span>
                                      )}
                                      <span className="text-[10px] text-muted-foreground">
                                        {rate.freightItems.length} charge line items
                                      </span>
                                    </td>

                                    {/* Freight Charges Pills */}
                                    <td className="px-4 py-3">
                                      {rate.freightItems.length === 0 ? (
                                        <span className="text-muted-foreground italic text-[11px]">
                                          No charges added
                                        </span>
                                      ) : (
                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                          {rate.freightItems.map((fi) => (
                                            <span
                                              key={fi.id}
                                              className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-foreground font-mono"
                                            >
                                              {fi.freight} ({fi.gross.toLocaleString(undefined, { maximumFractionDigits: 1 })} {fi.currency})
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </td>

                                    <td className="px-4 py-3 font-mono font-medium text-foreground">
                                      {rate.consolidatedNet.toLocaleString(undefined, { maximumFractionDigits: 2 })} {baseCurrency}
                                    </td>

                                    <td className="px-4 py-3 font-mono font-bold text-foreground">
                                      {rate.consolidatedGross.toLocaleString(undefined, { maximumFractionDigits: 2 })} {baseCurrency}
                                    </td>

                                    <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                      +{rate.consolidatedProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })} {baseCurrency}
                                    </td>

                                    <td className="px-4 py-3 font-mono text-foreground font-semibold">
                                      {rate.consolidatedMarginPercent.toFixed(1)}%
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setActiveManageRate(rate);
                                            setActiveManageShipmentName(s.name);
                                            onManageFreightItems?.(rate);
                                          }}
                                          className="h-7 px-2.5 text-[11px] gap-1"
                                        >
                                          <Layers className="size-3" />
                                          <span>Manage Items</span>
                                        </Button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteRate(rate.id, rate.provider.name)}
                                          disabled={isPending}
                                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                          title="Delete Quote Option"
                                        >
                                          <Trash2 className="size-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Carrier Rate Modal */}
      {targetShipmentForAdd && (
        <AddRateDialog
          open={addRateOpen}
          onOpenChange={(open) => {
            setAddRateOpen(open);
            if (!open) setTargetShipmentForAdd(null);
          }}
          shipmentId={targetShipmentForAdd.id}
          shipmentName={targetShipmentForAdd.name}
          existingProviders={providers}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* Manage Freight Line Items Modal */}
      {activeManageRate && (
        <ManageFreightItemsDialog
          open={!!activeManageRate}
          onOpenChange={(open) => !open && setActiveManageRate(null)}
          rate={activeManageRate}
          shipmentName={activeManageShipmentName || "Shipment"}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}

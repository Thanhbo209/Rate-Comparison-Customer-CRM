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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddRateDialog } from "./add-rate-dialog";
import { ManageFreightItemsDialog } from "./manage-freight-items-dialog";
import { deleteShipmentRateAction } from "@/lib/rate/actions";
import type {
  ShipmentComparisonDetail,
  ProviderItem,
  ShipmentRateItem,
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
  role: "ADMIN" | "SALES" | "SALES_MANAGER";
  organizationName: string;
  onManageFreightItems?: (rate: ShipmentRateItem) => void;
}

export function RateComparisonView({
  shipment,
  availableShipments,
  providers,
  role,
  organizationName,
  onManageFreightItems,
}: RateComparisonViewProps) {
  const router = useRouter();
  const [addRateOpen, setAddRateOpen] = useState(false);
  const [activeManageRate, setActiveManageRate] = useState<ShipmentRateItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSelectShipment = (id: string) => {
    const basePath = role === "ADMIN" ? "/dashboard/admin" : "/dashboard/sales";
    router.push(`${basePath}/rates?shipmentId=${id}`);
  };

  const handleDeleteRate = (rateId: string, providerName: string) => {
    if (
      !confirm(
        `Are you sure you want to remove the rate comparison for "${providerName}"? All its freight items will be deleted.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      await deleteShipmentRateAction({ shipmentRateId: rateId });
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Shipment Switcher */}
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
            Compare carrier buying costs, selling quotations, and profit margins side-by-side for {organizationName}.
          </p>
        </div>

        {/* Shipment Selector Dropdown */}
        <div className="flex items-center gap-2.5">
          <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Shipment:
          </label>
          <select
            value={shipment?.id || ""}
            onChange={(e) => handleSelectShipment(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden max-w-[260px] truncate"
          >
            {availableShipments.length === 0 ? (
              <option value="" disabled>
                No shipments found
              </option>
            ) : (
              availableShipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.customer.companyName})
                </option>
              ))
            )}
          </select>

          {shipment && (
            <Button
              onClick={() => setAddRateOpen(true)}
              size="sm"
              className="gap-1.5 h-9 text-xs shrink-0"
            >
              <Plus className="size-3.5" />
              <span>Add Carrier Rate</span>
            </Button>
          )}
        </div>
      </div>

      {!shipment ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mx-auto">
            <ArrowLeftRight className="size-6" />
          </div>
          <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
            No shipment selected
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            Select an existing shipment from the dropdown above or create a new
            shipment to begin comparing carrier rates.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Shipment Banner Card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Active Shipment Target
                </span>
                <h2 className="text-lg font-heading font-bold text-foreground mt-0.5">
                  {shipment.name}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Building2 className="size-3.5 text-primary" />
                    {shipment.customer.companyName}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    {shipment.direction === "IMPORT" ? (
                      <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                        <ArrowDownLeft className="size-3.5" />
                        Import
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <ArrowUpRight className="size-3.5" />
                        Export
                      </span>
                    )}
                  </span>
                  {shipment.commodity && (
                    <>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Tag className="size-3 text-muted-foreground" />
                        {shipment.commodity}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Best Recommendation Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {shipment.bestRateId && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                      <Award className="size-3.5" />
                      Lowest Net Cost
                    </div>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium mt-0.5">
                      {
                        shipment.rates.find((r) => r.id === shipment.bestRateId)
                          ?.provider.name
                      }
                    </p>
                  </div>
                )}

                {shipment.highestMarginRateId && (
                  <div className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-primary">
                      <TrendingUp className="size-3.5" />
                      Best Profit Margin
                    </div>
                    <p className="text-[11px] text-foreground font-medium mt-0.5">
                      {
                        shipment.rates.find(
                          (r) => r.id === shipment.highestMarginRateId
                        )?.provider.name
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rates Side-by-Side Comparison Grid */}
          {shipment.rates.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mx-auto">
                <Truck className="size-6" />
              </div>
              <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
                No carrier rates added yet
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Add freight carriers such as Maersk, MSC, or CMA CGM to start
                building and comparing itemized rate structures.
              </p>
              <Button
                onClick={() => setAddRateOpen(true)}
                size="sm"
                className="mt-4 gap-1.5"
              >
                <Plus className="size-4" />
                <span>Add First Carrier</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {shipment.rates.map((rate) => {
                const isBestCost = rate.id === shipment.bestRateId;
                const isBestMargin = rate.id === shipment.highestMarginRateId;

                return (
                  <div
                    key={rate.id}
                    className={`rounded-2xl border bg-card p-5 shadow-xs flex flex-col justify-between transition-all ${
                      isBestCost
                        ? "border-emerald-500/50 ring-1 ring-emerald-500/30"
                        : "border-border"
                    }`}
                  >
                    <div>
                      {/* Carrier Title & Badges */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-heading text-lg font-bold text-foreground">
                              {rate.provider.name}
                            </h3>
                            {isBestCost && (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                Best Cost
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
                            {rate.freightItems.length} line items configured
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteRate(rate.id, rate.provider.name)
                          }
                          disabled={isPending}
                          title="Remove Carrier Rate"
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      {/* Currency Breakdown & Consolidated Totals */}
                      <div className="mt-5 space-y-3">
                        {/* Currency-Grouped Sections */}
                        {rate.currencies.length > 0 && (
                          <div className="space-y-2">
                            {rate.currencies.map((b) => (
                              <div
                                key={b.currency}
                                className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs space-y-1.5"
                              >
                                <div className="flex items-center justify-between font-semibold">
                                  <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                                    {b.currency}
                                  </span>
                                  <span
                                    className={`font-mono text-xs ${
                                      b.totalProfit >= 0
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-destructive"
                                    }`}
                                  >
                                    {b.totalProfit >= 0 ? "+" : ""}
                                    {b.totalProfit.toLocaleString()}{" "}
                                    ({b.marginPercent.toFixed(1)}%)
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                  <span>Net: {b.totalNet.toLocaleString()}</span>
                                  <span>Gross: {b.totalGross.toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Consolidated Base Currency Total Banner */}
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                              Consolidated ({rate.baseCurrency})
                            </span>
                            <span
                              className={`font-mono font-bold ${
                                rate.consolidatedProfit >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-destructive"
                              }`}
                            >
                              {rate.consolidatedProfit >= 0 ? "+" : ""}
                              {rate.consolidatedProfit.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}{" "}
                              {rate.baseCurrency} (
                              {rate.consolidatedMarginPercent.toFixed(1)}%)
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Total Net Cost:</span>
                            <span className="font-mono font-semibold text-foreground">
                              {rate.consolidatedNet.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}{" "}
                              {rate.baseCurrency}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Total Selling Quote:</span>
                            <span className="font-mono font-semibold text-foreground">
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
                          Item Breakdown
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
                                  {fi.net.toLocaleString()} / {fi.gross.toLocaleString()}{" "}
                                  {fi.currency}
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
          )}
        </div>
      )}

      {/* Add Carrier Rate Modal */}
      {shipment && (
        <AddRateDialog
          open={addRateOpen}
          onOpenChange={setAddRateOpen}
          shipmentId={shipment.id}
          shipmentName={shipment.name}
          existingProviders={providers}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* Manage Freight Line Items Modal */}
      {activeManageRate && shipment && (
        <ManageFreightItemsDialog
          open={!!activeManageRate}
          onOpenChange={(open) => !open && setActiveManageRate(null)}
          rate={activeManageRate}
          shipmentName={shipment.name}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}

import React from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  ArrowLeftRight,
  Package,
  Building2,
  Layers,
} from "lucide-react";
import { getShipmentTotals } from "@/lib/rate/shipment-ranking";
import type { ShipmentComparisonDetail } from "@/lib/rate/types";

interface RecentShipmentsRatesProps {
  shipments: ShipmentComparisonDetail[];
  baseCurrency: string;
}

export function RecentShipmentsRates({
  shipments,
  baseCurrency,
}: RecentShipmentsRatesProps) {
  const recentShipments = shipments.slice(0, 5);

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ArrowLeftRight className="size-4" />
            </div>
            <h3 className="font-heading text-base font-semibold text-foreground">
              Recent Shipments & Rate Comparison Snapshot
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Live profitability and quote options across latest customer
            shipments
          </p>
        </div>

        <Link
          href="/dashboard/sales/rates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline self-start sm:self-auto"
        >
          <span>View all in Rate Comparison</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* Table Content */}
      {recentShipments.length === 0 ? (
        <div className="p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Package className="size-6 opacity-60" />
          </div>
          <h4 className="mt-4 font-heading text-sm font-semibold text-foreground">
            No shipments found
          </h4>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            Create your first shipment to begin comparing carrier rates and
            tracking profit margins.
          </p>
          <Link
            href="/dashboard/sales/shipments"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
          >
            <span>Go to Shipments</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Shipment & Customer</th>
                <th className="px-5 py-3 font-medium">Direction</th>
                <th className="px-5 py-3 font-medium">Carrier Quotes</th>
                <th className="px-5 py-3 font-medium">Total Profit</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentShipments.map((s) => {
                const totals = getShipmentTotals(s.rates);
                const hasRates = totals.rateCount > 0;

                // Extract unique carrier names
                const providerNames = Array.from(
                  new Set(s.rates.map((r) => r.provider?.name).filter(Boolean)),
                );

                return (
                  <tr
                    key={s.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    {/* Shipment & Customer */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={`/dashboard/sales/rates?shipmentId=${s.id}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors hover:underline"
                        >
                          {s.name}
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                            <Building2 className="size-3" />
                            {s.customer.companyName}
                          </span>
                          {s.commodity && (
                            <>
                              <span>•</span>
                              <span>{s.commodity}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Direction Badge */}
                    <td className="px-5 py-3.5">
                      {s.direction === "IMPORT" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                          <ArrowDownLeft className="size-3" />
                          Import
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                          <ArrowUpRight className="size-3" />
                          Export
                        </span>
                      )}
                    </td>

                    {/* Carrier Quotes Count & Provider Preview */}
                    <td className="px-5 py-3.5">
                      {hasRates ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-muted/80 px-2.5 py-0.5 text-[11px] font-medium text-foreground">
                            <Layers className="size-3 text-muted-foreground" />
                            {totals.rateCount}{" "}
                            {totals.rateCount === 1 ? "quote" : "quotes"}
                          </span>
                          {providerNames.length > 0 && (
                            <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                              {providerNames.join(", ")}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="rounded-full bg-muted/50 px-2.5 py-0.5 text-[11px] text-muted-foreground italic">
                          0 quotes
                        </span>
                      )}
                    </td>

                    {/* Total Shipment Profit */}
                    <td className="px-5 py-3.5">
                      {hasRates ? (
                        <div className="flex flex-col">
                          <span className=" text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {totals.profit >= 0 ? "+" : ""}
                            {totals.profit.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}{" "}
                            {baseCurrency}
                          </span>
                          <span className="text-[11px] text-muted-foreground ">
                            {totals.marginPercent.toFixed(1)}% margin
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          No quotes yet
                        </span>
                      )}
                    </td>

                    {/* Action Link */}
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/dashboard/sales/rates?shipmentId=${s.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <span>Open in Rate Comparison</span>
                        <ArrowRight className="size-3.5 text-muted-foreground" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

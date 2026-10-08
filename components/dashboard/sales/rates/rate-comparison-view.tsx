"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  Plus,
  Trash2,
  Award,
  ArrowDownLeft,
  ArrowUpRight,
  Tag,
  Layers,
  ArrowLeftRight,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Package,
  Search,
  Check,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { OverallAnalytics } from "./overall-analytics";
import { Button } from "@/components/ui/button";
import { AddRateDialog } from "./add-rate-dialog";
import { ManageFreightItemsDialog } from "./manage-freight-items-dialog";
import {
  deleteShipmentRateAction,
  selectShipmentRateAction,
} from "@/lib/rate/actions";
import type {
  ShipmentComparisonDetail,
  ProviderItem,
  ShipmentRateItem,
  MultiShipmentRateOverview,
} from "@/lib/rate/types";
import { rankShipments } from "@/lib/rate/shipment-ranking";
import {
  ShipmentProfitCell,
  RatesTotalRow,
  RatesTotalStrip,
} from "@/components/rate/shipment-profit";

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
  const [expandedShipments, setExpandedShipments] = useState<
    Record<string, boolean>
  >(() => {
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
  const [activeManageRate, setActiveManageRate] =
    useState<ShipmentRateItem | null>(null);
  const [activeManageShipmentName, setActiveManageShipmentName] =
    useState<string>("");
  const [isPending, startTransition] = useTransition();

  const toggleShipmentExpand = (id: string) => {
    setExpandedShipments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDeleteRate = (rateId: string, providerName: string) => {
    if (
      !confirm(
        `Are you sure you want to remove the rate option for ${providerName}?`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await deleteShipmentRateAction({ shipmentRateId: rateId });
      if (res.success) {
        router.refresh();
      }
    });
  };

  const [selectingRateId, setSelectingRateId] = useState<string | null>(null);

  const handleSelectRate = (shipmentId: string, rateId: string | null) => {
    if (role !== "ADMIN" && role !== "SALES_MANAGER") {
      alert(
        "Only Sales Managers and Administrators have permission to select a carrier rate.",
      );
      return;
    }
    setSelectingRateId(rateId || "unselect");
    startTransition(async () => {
      try {
        const res = await selectShipmentRateAction({
          shipmentId,
          shipmentRateId: rateId,
        });
        if (res.success) {
          router.refresh();
        } else {
          alert(res.error || "Failed to select rate option.");
        }
      } catch {
        alert("Failed to update carrier selection.");
      } finally {
        setSelectingRateId(null);
      }
    });
  };

  // Pagination & Search state (limited to 10 items per page)
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // List of shipments to render
  const shipmentsToDisplay =
    overview?.shipments || (shipment ? [shipment] : []);
  const baseCurrency =
    overview?.baseCurrency || shipment?.baseCurrency || "USD";
  const overall = overview?.overall;

  // Compute shipment-level profit rankings from the FULL list (pre-filter,
  // pre-pagination) so that "Best choice" is globally correct.
  const rankings = rankShipments(shipmentsToDisplay);

  // Filter shipments based on search query
  const filteredShipments = shipmentsToDisplay.filter((s) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.customer.companyName.toLowerCase().includes(q) ||
      (s.commodity && s.commodity.toLowerCase().includes(q)) ||
      (s.bestCustomerRateCarrier &&
        s.bestCustomerRateCarrier.toLowerCase().includes(q))
    );
  });

  const totalItems = filteredShipments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
  const currentShipments = filteredShipments.slice(startIndex, endIndex);

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
            Compare carrier buying costs, customer quotes, and profit margins
            side-by-side for {organizationName}.
          </p>
        </div>
      </div>

      {/* OVERALL TOTALS & AGENT ANALYTICS BANNER */}
      {overall && overall.totalRates > 0 && (
        <OverallAnalytics
          overall={overall}
          baseCurrency={baseCurrency}
          shipments={shipmentsToDisplay}
        />
      )}

      {/* SHIPMENTS DIRECTORY TABLE WITH DROPDOWN OF FREIGHTS */}
      <div className="space-y-4">
        {/* Directory Controls: Title, Search, Item Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <Package className="size-5 text-primary" />
              <span>Shipments Directory</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Click on any shipment to open its dropdown of carrier quotes,
              freight charges, and rate comparisons.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search shipments..."
                className="h-8.5 w-56 sm:w-64 rounded-xl border border-border bg-background px-3 pl-8 text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
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
                      setTargetShipmentForAdd({
                        id: target.id,
                        name: target.name,
                      });
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
        </div>

        {totalItems === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mx-auto">
              <ArrowLeftRight className="size-6" />
            </div>
            <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
              No shipments found
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              {searchTerm
                ? "No shipments matched your search criteria. Try a different query."
                : "Create your first shipment to begin comparing carrier rates and itemized freight charges."}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/50 border-b border-border text-[11px] text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center"></th>
                    <th className="py-3 px-4">Shipment</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Direction</th>
                    <th className="py-3 px-4">Commodity</th>
                    <th className="py-3 px-4">Total rates</th>
                    <th className="py-3 px-4">Total Profit</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentShipments.map((s) => {
                    const isExpanded = !!expandedShipments[s.id];

                    return (
                      <React.Fragment key={s.id}>
                        {/* SHIPMENT ROW (CLICKABLE TO OPEN DROPDOWN) */}
                        <tr
                          onClick={() => toggleShipmentExpand(s.id)}
                          className={`cursor-pointer transition-colors ${
                            isExpanded
                              ? "bg-muted-foreground/10 border-2 border-muted-foreground/40  font-medium"
                              : "hover:bg-muted/20"
                          }`}
                        >
                          <td className="py-3.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleShipmentExpand(s.id);
                              }}
                              className="flex size-6 items-center justify-center rounded-md bg-background text-muted-foreground hover:text-foreground transition-colors mx-auto"
                            >
                              {isExpanded ? (
                                <ChevronDown className="text-primary size-3.5" />
                              ) : (
                                <ChevronRight className="size-3.5" />
                              )}
                            </button>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-heading font-bold text-foreground text-sm block">
                              {s.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {isExpanded
                                ? "Click to collapse"
                                : "Click to view freights"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                              {s.customer.companyName}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
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
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground">
                            {s.commodity ? (
                              <span className="inline-flex items-center gap-1 text-xs">
                                <Tag className="size-3" />
                                {s.commodity}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/60">
                                —
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <span className="rounded-full bg-muted/80 px-2.5 py-0.5 text-[11px] font-medium text-foreground">
                              {s.rates.length}{" "}
                              {s.rates.length === 1 ? "rate" : "rates"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <ShipmentProfitCell
                              result={rankings.get(s.id)}
                              baseCurrency={baseCurrency}
                            />
                          </td>

                          <td
                            className="py-3.5 px-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setTargetShipmentForAdd({
                                    id: s.id,
                                    name: s.name,
                                  });
                                  setAddRateOpen(true);
                                }}
                                className="h-7.5 px-2.5 text-xs font-medium gap-1"
                              >
                                <Plus className="size-3" />
                                <span>Add Rate</span>
                              </Button>
                            </div>
                          </td>
                        </tr>

                        {/* DROPDOWN SUB-ROW INSIDE THE TABLE: FREIGHTS & RATES */}
                        {isExpanded && (
                          <tr className="bg-muted/15 border-b border-border/80">
                            <td colSpan={8} className="space-y-4">
                              {/* Unranked rates warning banner */}
                              {s.unrankedRateIds &&
                                s.unrankedRateIds.length > 0 && (
                                  <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                                    <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                                    <div>
                                      <span className="font-semibold block">
                                        {s.unrankedRateIds.length} carrier quote
                                        {s.unrankedRateIds.length > 1
                                          ? "s"
                                          : ""}{" "}
                                        could not be ranked
                                      </span>
                                      <span className="text-[11px] opacity-90 mt-0.5 block">
                                        Foreign currency charges without
                                        exchange rates cannot be converted into{" "}
                                        {baseCurrency}. Please configure
                                        organization exchange rates to include
                                        them in profit ranking.
                                      </span>
                                    </div>
                                  </div>
                                )}

                              {/* FREIGHT RATES CONTENT: CARDS OR TABLE VIEW */}
                              {s.rates.length === 0 ? (
                                <div className="p-8 text-center  border border-dashed border-border/80 bg-background/50">
                                  <Truck className="size-8 mx-auto text-muted-foreground opacity-60" />
                                  <h4 className="mt-2 text-xs font-semibold text-foreground">
                                    No carrier rates added yet for this shipment
                                  </h4>
                                  <p className="mt-1 text-[11px] text-muted-foreground max-w-sm mx-auto">
                                    Add a carrier quote (e.g. Maersk Direct,
                                    MSC) to configure and compare freight
                                    charges.
                                  </p>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setTargetShipmentForAdd({
                                        id: s.id,
                                        name: s.name,
                                      });
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
                                <>
                                  <RatesTotalStrip
                                    result={rankings.get(s.id)}
                                    baseCurrency={baseCurrency}
                                  />
                                  <div className="sm:p-6 p-4 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                                    {s.rates.map((rate) => {
                                      const isWinner =
                                        rate.id === s.bestCustomerRateId;
                                      const isSelected =
                                        rate.id === s.selectedRateId;
                                      const isBestCost = rate.id === s.bestRateId;
                                      const isBestMargin =
                                        rate.id === s.highestMarginRateId;
                                      const canSelect =
                                        role === "ADMIN" ||
                                        role === "SALES_MANAGER";

                                      return (
                                      <div
                                        key={rate.id}
                                        className={`rounded-2xl border bg-card p-5 shadow-xs flex flex-col justify-between transition-all ${
                                          isSelected
                                            ? "border-primary ring-2 ring-primary/40 bg-primary/5"
                                            : isWinner
                                              ? "border-emerald-500/50 ring-1 ring-emerald-500/30 bg-card"
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
                                                {isSelected && (
                                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow-2xs">
                                                    <CheckCircle2 className="size-3" />
                                                    Selected
                                                  </span>
                                                )}
                                                {isWinner && (
                                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                                                    <Award className="size-3" />
                                                    Most Profit
                                                    {s.tieBreakUsed && (
                                                      <span className="text-[9px] opacity-90 ml-0.5 font-normal">
                                                        (tie-break)
                                                      </span>
                                                    )}
                                                  </span>
                                                )}
                                                {isBestCost && !isWinner && (
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
                                            </div>

                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleDeleteRate(
                                                  rate.id,
                                                  rate.provider.name,
                                                )
                                              }
                                              disabled={isPending}
                                              title="Remove Carrier Rate"
                                              className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                            >
                                              <Trash2 className="size-4" />
                                            </button>
                                          </div>

                                          {/* Warning for unranked rate with missing exchange rate */}
                                          {rate.hasMissingExchangeRate && (
                                            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                                              <AlertTriangle className="size-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                                              <div>
                                                <span className="font-semibold block">
                                                  Missing exchange rate
                                                </span>
                                                <span className="text-[11px] opacity-90 block">
                                                  Charges in{" "}
                                                  {rate.missingCurrencies?.join(
                                                    ", ",
                                                  ) || "foreign currency"}{" "}
                                                  cannot be converted to{" "}
                                                  {baseCurrency}. Excluded from
                                                  profit ranking.
                                                </span>
                                              </div>
                                            </div>
                                          )}

                                          {/* Pricing Comparison in System Base Currency */}
                                          <div className="mt-5 space-y-3">
                                            <div className="rounded-xl border border-primary/20 bg-card p-4 text-xs space-y-2.5">
                                              <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                                                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                                                  Profit
                                                </span>
                                                <span
                                                  className={`font-mono font-bold text-xs ${
                                                    rate.consolidatedProfit >= 0
                                                      ? "text-primary dark:text-emerald-400"
                                                      : "text-destructive"
                                                  }`}
                                                >
                                                  {rate.consolidatedProfit >= 0
                                                    ? "+"
                                                    : ""}
                                                  {rate.consolidatedProfit.toLocaleString(
                                                    undefined,
                                                    {
                                                      maximumFractionDigits: 2,
                                                    },
                                                  )}{" "}
                                                  {rate.baseCurrency} (
                                                  {rate.consolidatedMarginPercent.toFixed(
                                                    1,
                                                  )}
                                                  %)
                                                </span>
                                              </div>

                                              <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">
                                                  Net:
                                                </span>
                                                <span className="font-mono font-bold text-foreground">
                                                  {rate.consolidatedNet.toLocaleString(
                                                    undefined,
                                                    {
                                                      maximumFractionDigits: 2,
                                                    },
                                                  )}{" "}
                                                  <span className="text-muted-foreground">
                                                    {rate.baseCurrency}
                                                  </span>
                                                </span>
                                              </div>

                                              <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">
                                                  Gross:
                                                </span>
                                                <span className="font-mono font-bold text-foreground">
                                                  {rate.consolidatedGross.toLocaleString(
                                                    undefined,
                                                    {
                                                      maximumFractionDigits: 2,
                                                    },
                                                  )}{" "}
                                                  <span className="text-muted-foreground">
                                                    {rate.baseCurrency}
                                                  </span>
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Line Item Previews */}
                                          <div className="mt-4 space-y-1.5">
                                            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                              Item Breakdown (
                                              {rate.baseCurrency})
                                            </div>
                                            {rate.freightItems.length === 0 ? (
                                              <p className="text-xs text-muted-foreground italic">
                                                No freight items added yet.
                                                Click &quot;Manage Line
                                                Items&quot; below.
                                              </p>
                                            ) : (
                                              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                                {rate.freightItems
                                                  .slice(0, 4)
                                                  .map((fi) => (
                                                    <div
                                                      key={fi.id}
                                                      className="flex items-center justify-between text-xs py-1 border-b border-border/40"
                                                    >
                                                      <span className="font-medium text-foreground truncate max-w-[140px]">
                                                        {fi.freight}
                                                      </span>
                                                      <span className="font-mono text-muted-foreground text-[11px]">
                                                        {fi.net.toLocaleString(
                                                          undefined,
                                                          {
                                                            maximumFractionDigits: 1,
                                                          },
                                                        )}{" "}
                                                        /{" "}
                                                        {fi.gross.toLocaleString(
                                                          undefined,
                                                          {
                                                            maximumFractionDigits: 1,
                                                          },
                                                        )}{" "}
                                                        {fi.currency}
                                                      </span>
                                                    </div>
                                                  ))}
                                                {rate.freightItems.length >
                                                  4 && (
                                                  <p className="text-[10px] text-muted-foreground text-center pt-1">
                                                    +{" "}
                                                    {rate.freightItems.length -
                                                      4}{" "}
                                                    more items
                                                  </p>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Card Action Buttons */}
                                        <div className="mt-5 pt-3 border-t border-border/60 space-y-2">
                                          <Button
                                            type="button"
                                            onClick={() =>
                                              handleSelectRate(
                                                s.id,
                                                isSelected ? null : rate.id,
                                              )
                                            }
                                            disabled={
                                              isPending &&
                                              selectingRateId ===
                                                (isSelected
                                                  ? "unselect"
                                                  : rate.id)
                                            }
                                            variant={
                                              isSelected
                                                ? "default"
                                                : "secondary"
                                            }
                                            size="sm"
                                            className={`w-full text-xs font-semibold gap-1.5 transition-all ${
                                              !canSelect
                                                ? "opacity-60 cursor-not-allowed"
                                                : ""
                                            }`}
                                            title={
                                              !canSelect
                                                ? "Sales Manager or Admin role required to select rate"
                                                : isSelected
                                                  ? "Click to unselect this agent"
                                                  : "Select this agent for this shipment"
                                            }
                                          >
                                            {isPending &&
                                            selectingRateId ===
                                              (isSelected
                                                ? "unselect"
                                                : rate.id) ? (
                                              <>
                                                <Loader2 className="size-3.5 animate-spin" />
                                                <span>Updating...</span>
                                              </>
                                            ) : isSelected ? (
                                              <>
                                                <Check className="size-3.5" />
                                                <span>Selected Agent</span>
                                              </>
                                            ) : (
                                              <>
                                                <CheckCircle2 className="size-3.5 text-primary" />
                                                <span>Select this agent</span>
                                              </>
                                            )}
                                          </Button>

                                          <Button
                                            onClick={() => {
                                              setActiveManageRate(rate);
                                              setActiveManageShipmentName(
                                                s.name,
                                              );
                                              onManageFreightItems?.(rate);
                                            }}
                                            variant="outline"
                                            size="sm"
                                            className="w-full text-xs font-semibold gap-1.5"
                                          >
                                            <Layers className="size-3.5" />
                                            <span>
                                              Manage Freight Line Items
                                            </span>
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                               </>
                              ) : (
                                /* ─── TABLE VIEW ─── */
                                <div className="space-y-4">
                                  <div className="overflow-x-auto border border-border bg-card">
                                    <table className="w-full text-left text-xs">
                                      <thead className="bg-muted/50 border-b border-border text-[11px] text-muted-foreground uppercase font-semibold">
                                        <tr>
                                          <th className="px-4 py-3">Freight</th>
                                          <th className="px-4 py-3">
                                            Charges Breakdown
                                          </th>
                                          <th className="px-4 py-3">Net</th>
                                          <th className="px-4 py-3">Gross</th>
                                          <th className="px-4 py-3">Profit</th>
                                          <th className="px-4 py-3">
                                            Margin %
                                          </th>
                                          <th className="px-4 py-3 text-right">
                                            Actions
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-border">
                                        {s.rates.map((rate) => {
                                          const isWinner =
                                            rate.id === s.bestCustomerRateId;
                                          const isSelected =
                                            rate.id === s.selectedRateId;
                                          const isBestCost =
                                            rate.id === s.bestRateId;
                                          const isBestMargin =
                                            rate.id === s.highestMarginRateId;
                                          const canSelect =
                                            role === "ADMIN" ||
                                            role === "SALES_MANAGER";

                                          return (
                                            <tr
                                              key={rate.id}
                                              className={`hover:bg-muted/20 transition-colors ${
                                                isSelected
                                                  ? "bg-primary/5 font-medium"
                                                  : isWinner
                                                    ? "bg-emerald-500/5 font-medium"
                                                    : ""
                                              }`}
                                            >
                                              <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="font-bold text-foreground font-heading">
                                                    {rate.provider.name}
                                                  </span>
                                                  {isSelected && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow-2xs">
                                                      <CheckCircle2 className="size-2.5" />
                                                      Selected
                                                    </span>
                                                  )}
                                                  {isWinner && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                                                      <Award className="size-2.5" />
                                                      Most Profit
                                                      {s.tieBreakUsed && (
                                                        <span className="text-[9px] opacity-90 ml-0.5 font-normal">
                                                          (tie-break)
                                                        </span>
                                                      )}
                                                    </span>
                                                  )}
                                                  {isBestCost && !isWinner && (
                                                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                      Lowest Cost
                                                    </span>
                                                  )}
                                                  {isBestMargin && (
                                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                                      Top Margin
                                                    </span>
                                                  )}
                                                  {rate.hasMissingExchangeRate && (
                                                    <span
                                                      className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400"
                                                      title={`Missing exchange rates: ${rate.missingCurrencies?.join(", ") || "foreign currency"}. Excluded from ranking.`}
                                                    >
                                                      <AlertTriangle className="size-2.5" />
                                                      Missing FX
                                                    </span>
                                                  )}
                                                </div>
                                                {rate.optionName && (
                                                  <span className="text-[11px] text-primary block mt-0.5 font-medium">
                                                    {rate.optionName}
                                                  </span>
                                                )}
                                              </td>

                                              {/* Freight Charges Pills */}
                                              <td className="px-4 py-3">
                                                {rate.freightItems.length ===
                                                0 ? (
                                                  <span className="text-muted-foreground italic text-[11px]">
                                                    No charges added
                                                  </span>
                                                ) : (
                                                  <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {rate.freightItems.map(
                                                      (fi) => (
                                                        <span
                                                          key={fi.id}
                                                          className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-foreground font-mono"
                                                        >
                                                          {fi.freight} (
                                                          {fi.gross.toLocaleString(
                                                            undefined,
                                                            {
                                                              maximumFractionDigits: 1,
                                                            },
                                                          )}{" "}
                                                          {fi.currency})
                                                        </span>
                                                      ),
                                                    )}
                                                  </div>
                                                )}
                                              </td>

                                              <td className="px-4 py-3 font-mono font-medium text-foreground">
                                                {rate.consolidatedNet.toLocaleString(
                                                  undefined,
                                                  { maximumFractionDigits: 2 },
                                                )}{" "}
                                                {baseCurrency}
                                              </td>

                                              <td className="px-4 py-3 font-mono font-bold text-foreground">
                                                {rate.consolidatedGross.toLocaleString(
                                                  undefined,
                                                  { maximumFractionDigits: 2 },
                                                )}{" "}
                                                {baseCurrency}
                                              </td>

                                              <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                +
                                                {rate.consolidatedProfit.toLocaleString(
                                                  undefined,
                                                  { maximumFractionDigits: 2 },
                                                )}{" "}
                                                {baseCurrency}
                                              </td>

                                              <td className="px-4 py-3 font-mono text-foreground font-semibold">
                                                {rate.consolidatedMarginPercent.toFixed(
                                                  1,
                                                )}
                                                %
                                              </td>

                                              <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                  <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={
                                                      isSelected
                                                        ? "default"
                                                        : "outline"
                                                    }
                                                    disabled={
                                                      isPending &&
                                                      selectingRateId ===
                                                        (isSelected
                                                          ? "unselect"
                                                          : rate.id)
                                                    }
                                                    onClick={() =>
                                                      handleSelectRate(
                                                        s.id,
                                                        isSelected
                                                          ? null
                                                          : rate.id,
                                                      )
                                                    }
                                                    className={`h-7 px-2.5 text-[11px] gap-1 ${
                                                      !canSelect
                                                        ? "opacity-60 cursor-not-allowed"
                                                        : ""
                                                    }`}
                                                    title={
                                                      !canSelect
                                                        ? "Sales Manager or Admin role required to select rate"
                                                        : isSelected
                                                          ? "Click to unselect this agent"
                                                          : "Select this agent for this shipment"
                                                    }
                                                  >
                                                    {isPending &&
                                                    selectingRateId ===
                                                      (isSelected
                                                        ? "unselect"
                                                        : rate.id) ? (
                                                      <Loader2 className="size-3 animate-spin" />
                                                    ) : isSelected ? (
                                                      <>
                                                        <Check className="size-3" />
                                                        <span>Selected</span>
                                                      </>
                                                    ) : (
                                                      <>
                                                        <CheckCircle2 className="size-3 text-primary" />
                                                        <span>Select</span>
                                                      </>
                                                    )}
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                      setActiveManageRate(rate);
                                                      setActiveManageShipmentName(
                                                        s.name,
                                                      );
                                                      onManageFreightItems?.(
                                                        rate,
                                                      );
                                                    }}
                                                    className="h-7 px-2.5 text-[11px] gap-1"
                                                  >
                                                    <Layers className="size-3" />
                                                    <span>Manage Items</span>
                                                  </Button>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleDeleteRate(
                                                        rate.id,
                                                        rate.provider.name,
                                                      )
                                                    }
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
                                      <tfoot>
                                        <RatesTotalRow
                                          result={rankings.get(s.id)}
                                          baseCurrency={baseCurrency}
                                          colCount={7}
                                        />
                                      </tfoot>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION BAR (LIMITED TO 10 ITEMS EACH) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-border bg-muted/20 text-xs">
              <span className="text-muted-foreground">
                Showing{" "}
                <strong className="text-foreground font-mono">
                  {startIndex + 1}
                </strong>{" "}
                to{" "}
                <strong className="text-foreground font-mono">
                  {endIndex}
                </strong>{" "}
                of{" "}
                <strong className="text-foreground font-mono">
                  {totalItems}
                </strong>{" "}
                shipments
              </span>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={validCurrentPage <= 1}
                    className="h-8 px-2.5 text-xs gap-1"
                  >
                    <ChevronLeft className="size-3.5" />
                    <span>Previous</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`size-8 rounded-lg text-xs font-semibold transition-all ${
                            validCurrentPage === pageNum
                              ? "bg-primary text-primary-foreground shadow-2xs"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {pageNum}
                        </button>
                      ),
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={validCurrentPage >= totalPages}
                    className="h-8 px-2.5 text-xs gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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

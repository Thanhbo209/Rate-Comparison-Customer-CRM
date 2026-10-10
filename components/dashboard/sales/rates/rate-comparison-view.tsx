"use client";

import React, { useState, useTransition, useMemo } from "react";
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
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Package,
  Search,
  AlertTriangle,
  Building2,
  SlidersHorizontal,
  X,
  RotateCcw,
} from "lucide-react";
import { OverallAnalytics } from "./overall-analytics";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddRateDialog } from "./add-rate-dialog";
import { ManageFreightItemsDialog } from "./manage-freight-items-dialog";
import { deleteShipmentRateAction } from "@/lib/rate/actions";
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
  customers?: { id: string; companyName: string }[];
  initialCustomerId?: string;
}

export function RateComparisonView({
  shipment,
  availableShipments,
  providers,
  overview,
  organizationName,
  onManageFreightItems,
  customers,
  initialCustomerId,
}: RateComparisonViewProps) {
  const router = useRouter();
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

  // Pagination & Search state (limited to 10 items per page)
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Advanced Filter state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomerId || "ALL",
  );
  const [selectedDirection, setSelectedDirection] = useState<
    "ALL" | "IMPORT" | "EXPORT"
  >("ALL");
  const [selectedRateStatus, setSelectedRateStatus] = useState<
    "ALL" | "WITH_RATES" | "NO_RATES"
  >("ALL");
  const [selectedProfitability, setSelectedProfitability] = useState<
    "ALL" | "PROFITABLE" | "UNPROFITABLE"
  >("ALL");
  const [sortBy, setSortBy] = useState<
    "DEFAULT" | "MOST_RATES" | "HIGHEST_PROFIT" | "NAME"
  >("DEFAULT");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // List of shipments to render
  const shipmentsToDisplay =
    overview?.shipments || (shipment ? [shipment] : []);
  const baseCurrency =
    overview?.baseCurrency || shipment?.baseCurrency || "USD";
  const overall = overview?.overall;

  // Compute shipment-level profit rankings from the FULL list (pre-filter,
  // pre-pagination) so that "Best choice" is globally correct.
  const rankings = rankShipments(shipmentsToDisplay);

  // Unique list of customers with their shipment count
  const customerOptions = useMemo(() => {
    const map = new Map<string, { id: string; companyName: string; count: number }>();

    // From shipments to display
    shipmentsToDisplay.forEach((s) => {
      const cId = s.customer?.id || (s as unknown as { customerId?: string }).customerId;
      const cName = s.customer?.companyName || "Unknown Customer";
      if (cId) {
        const existing = map.get(cId);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(cId, { id: cId, companyName: cName, count: 1 });
        }
      }
    });

    // Also include any organization customers with 0 shipments
    (customers || []).forEach((c) => {
      if (!map.has(c.id)) {
        map.set(c.id, { id: c.id, companyName: c.companyName, count: 0 });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.companyName.localeCompare(b.companyName),
    );
  }, [shipmentsToDisplay, customers]);

  const selectedCustomerObj = customerOptions.find(
    (c) => c.id === selectedCustomerId,
  );

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setCurrentPage(1);

    if (customerId !== "ALL") {
      // Auto-expand shipments belonging to this customer so user immediately sees their rates
      const targetShipments = shipmentsToDisplay.filter(
        (s) =>
          s.customer?.id === customerId ||
          (s as unknown as { customerId?: string }).customerId === customerId,
      );
      if (targetShipments.length > 0) {
        const toExpand: Record<string, boolean> = {};
        targetShipments.forEach((s) => {
          toExpand[s.id] = true;
        });
        setExpandedShipments((prev) => ({ ...prev, ...toExpand }));
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedCustomerId("ALL");
    setSelectedDirection("ALL");
    setSelectedRateStatus("ALL");
    setSelectedProfitability("ALL");
    setSortBy("DEFAULT");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const activeFilterCount =
    (selectedCustomerId !== "ALL" ? 1 : 0) +
    (selectedDirection !== "ALL" ? 1 : 0) +
    (selectedRateStatus !== "ALL" ? 1 : 0) +
    (selectedProfitability !== "ALL" ? 1 : 0) +
    (sortBy !== "DEFAULT" ? 1 : 0) +
    (searchTerm.trim() ? 1 : 0);

  // Filter shipments based on search query, customer, direction, rate status, and profitability
  const filteredShipments = useMemo(() => {
    return shipmentsToDisplay
      .filter((s) => {
        // Customer filter
        if (selectedCustomerId !== "ALL") {
          const matchCustomer =
            s.customer?.id === selectedCustomerId ||
            (s as unknown as { customerId?: string }).customerId === selectedCustomerId;
          if (!matchCustomer) return false;
        }

        // Direction filter
        if (selectedDirection !== "ALL" && s.direction !== selectedDirection) {
          return false;
        }

        const rateCount = s.rates?.length ?? 0;

        // Rate status filter
        if (selectedRateStatus === "WITH_RATES" && rateCount === 0) {
          return false;
        }
        if (selectedRateStatus === "NO_RATES" && rateCount > 0) {
          return false;
        }

        // Profitability filter
        if (selectedProfitability !== "ALL") {
          const profit = rankings.get(s.id)?.profit ?? 0;
          if (selectedProfitability === "PROFITABLE" && profit <= 0) {
            return false;
          }
          if (selectedProfitability === "UNPROFITABLE" && profit > 0) {
            return false;
          }
        }

        // Search term
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.customer.companyName.toLowerCase().includes(q) ||
          (s.commodity && s.commodity.toLowerCase().includes(q)) ||
          (s.bestCustomerRateCarrier &&
            s.bestCustomerRateCarrier.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === "MOST_RATES") {
          return (b.rates?.length ?? 0) - (a.rates?.length ?? 0);
        }
        if (sortBy === "HIGHEST_PROFIT") {
          const profitA = rankings.get(a.id)?.profit ?? 0;
          const profitB = rankings.get(b.id)?.profit ?? 0;
          return profitB - profitA;
        }
        if (sortBy === "NAME") {
          return a.name.localeCompare(b.name);
        }
        return 0; // DEFAULT preserves original order
      });
  }, [
    shipmentsToDisplay,
    selectedCustomerId,
    selectedDirection,
    selectedRateStatus,
    selectedProfitability,
    searchTerm,
    sortBy,
    rankings,
  ]);

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
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                <Package className="size-5 text-primary" />
                <span>Shipments Directory</span>
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {totalItems} {totalItems === 1 ? "shipment" : "shipments"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Click on any shipment to open its dropdown of carrier quotes,
              freight charges, and rate comparisons.
            </p>
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
              className="gap-1.5 h-9 text-xs shrink-0 self-start sm:self-auto"
            >
              <Plus className="size-3.5" />
              <span>Add Carrier Option</span>
            </Button>
          )}
        </div>

        {/* ADVANCED FILTER TOOLBAR */}
        <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search shipments, commodity, carrier..."
                className="h-9 w-full rounded-xl border border-border bg-background px-3 pl-8.5 pr-8 text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Customer Selection Filter (Advanced filter requirement) */}
            <div className="min-w-[190px] sm:min-w-[220px]">
              <Select
                value={selectedCustomerId}
                onValueChange={(val) => {
                  if (val) handleCustomerChange(val);
                }}
              >
                <SelectTrigger
                  className={`h-9 w-full rounded-xl text-xs transition-colors ${
                    selectedCustomerId !== "ALL"
                      ? "border-primary bg-primary/5 text-primary font-semibold"
                      : "border-border bg-background"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                    <SelectValue>
                      {(val: string | null) => {
                        if (!val || val === "ALL") {
                          return `All Customers (${shipmentsToDisplay.length})`;
                        }
                        const found = customerOptions.find((c) => c.id === val);
                        return found
                          ? `${found.companyName} (${found.count})`
                          : "Select Customer";
                      }}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-72">
                  <SelectItem value="ALL">
                    All Customers ({shipmentsToDisplay.length})
                  </SelectItem>
                  {customerOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName} ({c.count} {c.count === 1 ? "shipment" : "shipments"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Direction Filter Pills */}
            <div className="inline-flex items-center gap-1 p-0.5 rounded-xl border border-border bg-muted/40">
              <button
                type="button"
                onClick={() => {
                  setSelectedDirection("ALL");
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedDirection === "ALL"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDirection("IMPORT");
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedDirection === "IMPORT"
                    ? "bg-blue-600 text-white font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ArrowDownLeft className="size-3" />
                <span>Imports</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDirection("EXPORT");
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedDirection === "EXPORT"
                    ? "bg-emerald-600 text-white font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ArrowUpRight className="size-3" />
                <span>Exports</span>
              </button>
            </div>

            {/* Advanced Filters Expand/Collapse Toggle */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`h-9 gap-1.5 text-xs rounded-xl ${
                showAdvancedFilters ||
                selectedRateStatus !== "ALL" ||
                selectedProfitability !== "ALL" ||
                sortBy !== "DEFAULT"
                  ? "border-primary text-primary bg-primary/5"
                  : ""
              }`}
            >
              <SlidersHorizontal className="size-3.5" />
              <span>More Filters</span>
              {(selectedRateStatus !== "ALL" ||
                selectedProfitability !== "ALL" ||
                sortBy !== "DEFAULT") && (
                <span className="rounded-full bg-primary size-1.5" />
              )}
            </Button>
          </div>

          {/* Collapsible Advanced Filters Drawer */}
          {showAdvancedFilters && (
            <div className="pt-3 border-t border-border/70 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Rate Quotes Status */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Carrier Quotes Status
                </label>
                <Select
                  value={selectedRateStatus}
                  onValueChange={(val) => {
                    if (val) {
                      setSelectedRateStatus(val as "ALL" | "WITH_RATES" | "NO_RATES");
                      setCurrentPage(1);
                    }
                  }}
                >
                  <SelectTrigger className="h-8.5 w-full rounded-lg border-border bg-background text-xs">
                    <SelectValue>
                      {(val: string | null) => {
                        if (val === "WITH_RATES") return "Has Quotes (≥ 1 option)";
                        if (val === "NO_RATES") return "Needs Quotes (0 options)";
                        return "All Quotes Statuses";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="ALL">All Quotes Statuses</SelectItem>
                    <SelectItem value="WITH_RATES">Has Quotes (≥ 1 option)</SelectItem>
                    <SelectItem value="NO_RATES">Needs Quotes (0 options)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Profitability Status */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Profitability
                </label>
                <Select
                  value={selectedProfitability}
                  onValueChange={(val) => {
                    if (val) {
                      setSelectedProfitability(val as "ALL" | "PROFITABLE" | "UNPROFITABLE");
                      setCurrentPage(1);
                    }
                  }}
                >
                  <SelectTrigger className="h-8.5 w-full rounded-lg border-border bg-background text-xs">
                    <SelectValue>
                      {(val: string | null) => {
                        if (val === "PROFITABLE") return "Profitable (> $0)";
                        if (val === "UNPROFITABLE") return "Loss / Breakeven (≤ $0)";
                        return "All Profit Margins";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="ALL">All Profit Margins</SelectItem>
                    <SelectItem value="PROFITABLE">Profitable (&gt; $0)</SelectItem>
                    <SelectItem value="UNPROFITABLE">Loss / Breakeven (≤ $0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Sort Shipments By
                </label>
                <Select
                  value={sortBy}
                  onValueChange={(val) => {
                    if (val) {
                      setSortBy(val as "DEFAULT" | "MOST_RATES" | "HIGHEST_PROFIT" | "NAME");
                      setCurrentPage(1);
                    }
                  }}
                >
                  <SelectTrigger className="h-8.5 w-full rounded-lg border-border bg-background text-xs">
                    <SelectValue>
                      {(val: string | null) => {
                        if (val === "MOST_RATES") return "Most Carrier Options";
                        if (val === "HIGHEST_PROFIT") return "Highest Quoted Profit";
                        if (val === "NAME") return "Shipment Name (A–Z)";
                        return "Default (Creation Order)";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="DEFAULT">Default (Creation Order)</SelectItem>
                    <SelectItem value="MOST_RATES">Most Carrier Options</SelectItem>
                    <SelectItem value="HIGHEST_PROFIT">Highest Quoted Profit</SelectItem>
                    <SelectItem value="NAME">Shipment Name (A–Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Active Filter Chips & Feedback Bar */}
          {activeFilterCount > 0 && (
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground mr-1 text-[11px]">
                  Active filters ({activeFilterCount}):
                </span>

                {selectedCustomerId !== "ALL" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    <Building2 className="size-3" />
                    <span>
                      Customer: {selectedCustomerObj?.companyName || "Selected"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCustomerChange("ALL")}
                      className="ml-0.5 hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}

                {selectedDirection !== "ALL" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2 py-0.5 text-[11px] font-medium text-foreground">
                    <span>
                      Direction: {selectedDirection === "IMPORT" ? "Imports" : "Exports"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDirection("ALL");
                        setCurrentPage(1);
                      }}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}

                {selectedRateStatus !== "ALL" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2 py-0.5 text-[11px] font-medium text-foreground">
                    <span>
                      Quotes: {selectedRateStatus === "WITH_RATES" ? "Has Quotes" : "Needs Quotes"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRateStatus("ALL");
                        setCurrentPage(1);
                      }}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}

                {selectedProfitability !== "ALL" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2 py-0.5 text-[11px] font-medium text-foreground">
                    <span>
                      Profit: {selectedProfitability === "PROFITABLE" ? "Profitable (> $0)" : "Loss / Breakeven"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProfitability("ALL");
                        setCurrentPage(1);
                      }}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}

                {sortBy !== "DEFAULT" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2 py-0.5 text-[11px] font-medium text-foreground">
                    <span>
                      Sorted: {sortBy === "MOST_RATES" ? "Most Options" : sortBy === "HIGHEST_PROFIT" ? "Highest Profit" : "Name"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy("DEFAULT");
                        setCurrentPage(1);
                      }}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}

                {searchTerm.trim() && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2 py-0.5 text-[11px] font-medium text-foreground">
                    <span>Search: &ldquo;{searchTerm}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setCurrentPage(1);
                      }}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <RotateCcw className="size-3" />
                <span>Reset all</span>
              </button>
            </div>
          )}
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
              {selectedCustomerId !== "ALL"
                ? `No shipments found for customer "${selectedCustomerObj?.companyName || "selected"}". Try choosing another customer or clearing your filters.`
                : searchTerm
                ? "No shipments matched your search criteria. Try a different query."
                : "No shipments matched the current filter criteria."}
            </p>
            {activeFilterCount > 0 && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="gap-1.5 text-xs"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Reset All Filters</span>
                </Button>
              </div>
            )}
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
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCustomerChange(s.customer.id);
                              }}
                              title={`Filter directory by ${s.customer.companyName}`}
                              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left cursor-pointer"
                            >
                              <Building2 className="size-3 text-muted-foreground" />
                              <span>{s.customer.companyName}</span>
                            </button>
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
                          <td className="py-3.5 px-4 ">
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
                              ) : (
                                <div className="space-y-4">
                                  <div className="overflow-x-auto border border-border bg-card">
                                    <table className="w-full text-left text-xs">
                                      <thead className="bg-muted/50 border-b border-border text-[13px] text-muted-foreground uppercase font-semibold">
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
                                          const isBestCost =
                                            rate.id === s.bestRateId;
                                          const isBestMargin =
                                            rate.id === s.highestMarginRateId;

                                          return (
                                            <tr
                                              key={rate.id}
                                              className={`hover:bg-muted/20 transition-colors ${
                                                isWinner ? " font-medium" : ""
                                              }`}
                                            >
                                              <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="font-bold text-[17px] text-foreground font-heading">
                                                    {rate.provider.name}
                                                  </span>
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
                                                          className="inline-flex items-center rounded-md bg-muted/40 px-2 py-0.5 text-[12px] text-foreground"
                                                        >
                                                          {fi.freight}
                                                        </span>
                                                      ),
                                                    )}
                                                  </div>
                                                )}
                                              </td>

                                              <td className="px-4 py-3 text-[13px] font-semibold text-destructive">
                                                {rate.consolidatedNet.toLocaleString(
                                                  undefined,
                                                  { maximumFractionDigits: 2 },
                                                )}{" "}
                                                {baseCurrency}
                                              </td>

                                              <td className="px-4 py-3 text-[13px] font-bold text-primary">
                                                {rate.consolidatedGross.toLocaleString(
                                                  undefined,
                                                  { maximumFractionDigits: 2 },
                                                )}{" "}
                                                {baseCurrency}
                                              </td>

                                              <td
                                                className={`px-4 py-3 text-[13px] font-bold ${
                                                  rate.consolidatedProfit >= 0
                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                    : "text-destructive"
                                                }`}
                                              >
                                                {rate.consolidatedProfit >= 0 ? "+" : ""}
                                                {rate.consolidatedProfit.toLocaleString(
                                                  undefined,
                                                  { maximumFractionDigits: 2 },
                                                )}{" "}
                                                {baseCurrency}
                                              </td>

                                              <td className="px-4 py-3  text-foreground font-semibold">
                                                {rate.consolidatedMarginPercent.toFixed(
                                                  1,
                                                )}
                                                %
                                              </td>

                                              <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
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
                <strong className="text-foreground ">{startIndex + 1}</strong>{" "}
                to <strong className="text-foreground ">{endIndex}</strong> of{" "}
                <strong className="text-foreground ">{totalItems}</strong>{" "}
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

"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  Package,
  Building2,
  Tag,
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ShipmentItem, ShipmentDirection } from "@/lib/shipment/types";

interface CustomerOption {
  id: string;
  companyName: string;
}

interface ShipmentTableProps {
  shipments: ShipmentItem[];
  customers: CustomerOption[];
  role?: "ADMIN" | "SALES" | "SALES_MANAGER";
  onView: (shipment: ShipmentItem) => void;
  onEdit: (shipment: ShipmentItem) => void;
  onDelete: (shipment: ShipmentItem) => void;
  onAddNew: () => void;
  onViewRates?: (shipment: ShipmentItem) => void;
}

const ITEMS_PER_PAGE = 8;

export function ShipmentTable({
  shipments,
  customers,
  role = "SALES",
  onView,
  onEdit,
  onDelete,
  onAddNew,
  onViewRates,
}: ShipmentTableProps) {
  const [search, setSearch] = useState("");
  const [selectedDirection, setSelectedDirection] = useState<string>("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered shipments
  const filtered = useMemo(() => {
    return shipments.filter((s) => {
      // Direction filter
      if (selectedDirection !== "ALL" && s.direction !== selectedDirection) {
        return false;
      }

      // Customer filter
      if (selectedCustomer !== "ALL" && s.customerId !== selectedCustomer) {
        return false;
      }

      // Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesCustomer = s.customer?.companyName?.toLowerCase().includes(q);
        const matchesCommodity = s.commodity?.toLowerCase().includes(q);
        if (!matchesName && !matchesCustomer && !matchesCommodity) return false;
      }

      return true;
    });
  }, [shipments, selectedDirection, selectedCustomer, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const canDelete = role !== "SALES";

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by shipment ref, shipper or commodity..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>

          {/* Direction Filter */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedDirection("ALL");
                setCurrentPage(1);
              }}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                selectedDirection === "ALL"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted text-muted-foreground hover:text-foreground"
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
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                selectedDirection === "IMPORT"
                  ? "bg-blue-600 text-white font-semibold"
                  : "bg-muted text-muted-foreground hover:text-foreground"
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
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                selectedDirection === "EXPORT"
                  ? "bg-emerald-600 text-white font-semibold"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowUpRight className="size-3" />
              <span>Exports</span>
            </button>
          </div>
        </div>

        {/* Customer Select Filter */}
        <div className="flex items-center gap-2">
          {customers.length > 0 && (
            <div className="min-w-[180px]">
              <Select
                value={selectedCustomer}
                onValueChange={(val) => {
                  if (val) {
                    setSelectedCustomer(val);
                    setCurrentPage(1);
                  }
                }}
              >
                <SelectTrigger className="h-8.5 rounded-lg border-border bg-background text-xs">
                  <SelectValue>
                    {(val: string | null) => {
                      if (!val || val === "ALL") return "All Shipper Accounts";
                      const found = customers.find((c) => c.id === val);
                      return found ? found.companyName : "All Shipper Accounts";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-72">
                  <SelectItem value="ALL">All Shipper Accounts</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            <Plus className="size-3.5" />
            <span>New Shipment</span>
          </button>
        </div>
      </div>

      {/* Shipments Table Body */}
      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Package className="size-6" />
          </div>
          <h3 className="mt-4 font-heading text-sm font-semibold text-foreground">
            No shipments found
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {search || selectedDirection !== "ALL" || selectedCustomer !== "ALL"
              ? "Try adjusting your search criteria or clearing active filters."
              : "Register your first shipment to start configuring freight provider rates."}
          </p>
          <button
            type="button"
            onClick={onAddNew}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            <Plus className="size-3.5" />
            <span>Add First Shipment</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Shipment & Ref</th>
                <th className="px-5 py-3 font-medium">Shipper Account</th>
                <th className="px-5 py-3 font-medium">Direction</th>
                <th className="px-5 py-3 font-medium">Commodity</th>
                <th className="px-5 py-3 font-medium">Rates</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.map((shipment) => (
                <tr
                  key={shipment.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  {/* Shipment Name */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        <Package className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate max-w-[220px]">
                          {shipment.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {shipment.id.slice(0, 12)}...
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Customer Account */}
                  <td className="px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate max-w-[180px]">
                        {shipment.customer.companyName}
                      </p>
                      {role === "ADMIN" && shipment.customer.organization && (
                        <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium mt-0.5">
                          <Building2 className="size-2.5" />
                          {shipment.customer.organization.name}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Direction */}
                  <td className="px-5 py-3.5">
                    {shipment.direction === "IMPORT" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                        <ArrowDownLeft className="size-3" />
                        <span>Import</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <ArrowUpRight className="size-3" />
                        <span>Export</span>
                      </span>
                    )}
                  </td>

                  {/* Commodity */}
                  <td className="px-5 py-3.5">
                    {shipment.commodity ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        <Tag className="size-3 shrink-0" />
                        <span className="truncate max-w-[120px]">
                          {shipment.commodity}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Rates */}
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => onViewRates?.(shipment)}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Calculator className="size-3" />
                      <span>{shipment._count?.rates ?? 0} rates</span>
                    </button>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3.5 text-muted-foreground text-[11px]">
                    {new Date(shipment.createdAt).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onView(shipment)}
                        title="View Details"
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Eye className="size-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit(shipment)}
                        title="Edit Shipment"
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>

                      {onViewRates && (
                        <button
                          type="button"
                          onClick={() => onViewRates(shipment)}
                          title="Rate Comparison"
                          className="flex size-7 items-center justify-center rounded-md text-primary hover:bg-primary/10"
                        >
                          <Calculator className="size-3.5" />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(shipment)}
                          title="Delete Shipment"
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
          <div>
            Showing{" "}
            <span className="font-medium text-foreground">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {filtered.length}
            </span>{" "}
            shipments
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex size-7 items-center justify-center rounded-md border border-border text-foreground hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex size-7 items-center justify-center rounded-md border border-border text-foreground hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Tag,
  Package,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { CustomerItem } from "@/lib/customer/types";

interface CustomerTableProps {
  customers: CustomerItem[];
  onView: (customer: CustomerItem) => void;
  onEdit: (customer: CustomerItem) => void;
  onDelete: (customer: CustomerItem) => void;
  onAddNew: () => void;
}

const ITEMS_PER_PAGE = 8;

export function CustomerTable({
  customers,
  onView,
  onEdit,
  onDelete,
  onAddNew,
}: CustomerTableProps) {
  const [search, setSearch] = useState("");
  const [selectedZone, setSelectedZone] = useState<string>("ALL");
  const [selectedCommodity, setSelectedCommodity] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Extract unique industrial zones and commodities for filter dropdowns
  const industrialZones = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.industrialZone) set.add(c.industrialZone);
    });
    return Array.from(set).sort();
  }, [customers]);

  const commodities = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.commodity) set.add(c.commodity);
    });
    return Array.from(set).sort();
  }, [customers]);

  // Filtered customers
  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.companyName.toLowerCase().includes(q) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.cellPhone && c.cellPhone.toLowerCase().includes(q)) ||
        (c.commodity && c.commodity.toLowerCase().includes(q)) ||
        (c.industrialZone && c.industrialZone.toLowerCase().includes(q)) ||
        (c.location && c.location.toLowerCase().includes(q));

      const matchZone =
        selectedZone === "ALL" || c.industrialZone === selectedZone;

      const matchCommodity =
        selectedCommodity === "ALL" || c.commodity === selectedCommodity;

      return matchSearch && matchZone && matchCommodity;
    });
  }, [customers, search, selectedZone, selectedCommodity]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleZoneChange = (val: string) => {
    setSelectedZone(val);
    setCurrentPage(1);
  };

  const handleCommodityChange = (val: string) => {
    setSelectedCommodity(val);
    setCurrentPage(1);
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs">
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search company, contact, cargo, email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Industrial Zone Filter */}
          {industrialZones.length > 0 && (
            <select
              value={selectedZone}
              onChange={(e) => handleZoneChange(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="ALL">All Industrial Zones</option>
              {industrialZones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          )}

          {/* Commodity Filter */}
          {commodities.length > 0 && (
            <select
              value={selectedCommodity}
              onChange={(e) => handleCommodityChange(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="ALL">All Commodities</option>
              {commodities.map((comm) => (
                <option key={comm} value={comm}>
                  {comm}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
          >
            <Plus className="size-3.5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Building2 className="size-6" />
          </div>
          <h3 className="mt-4 font-heading text-sm font-semibold text-foreground">
            No customers found
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {search || selectedZone !== "ALL" || selectedCommodity !== "ALL"
              ? "No customer matches your search criteria. Try resetting filters."
              : "Start by registering your first customer profile to manage forwarder rates."}
          </p>
          <button
            type="button"
            onClick={onAddNew}
            className="mt-5 inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
          >
            <Plus className="size-3.5" />
            <span>Create New Customer</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Contact Person</th>
                <th className="px-5 py-3 font-medium">Commodity</th>
                <th className="px-5 py-3 font-medium">Industrial Zone & City</th>
                <th className="px-5 py-3 font-medium">Shipments</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.map((customer) => {
                const isMenuOpen = activeMenuId === customer.id;

                return (
                  <tr
                    key={customer.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    {/* Company Name & Address */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                          {customer.companyName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate max-w-[200px]">
                            {customer.companyName}
                          </p>
                          {customer.address && (
                            <p className="truncate max-w-[200px] text-[11px] text-muted-foreground">
                              {customer.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact Person */}
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium text-foreground">
                          {customer.contactPerson || "—"}
                        </p>
                        <div className="mt-0.5 flex flex-col text-[11px] text-muted-foreground">
                          {customer.email && (
                            <span className="truncate max-w-[150px]">
                              {customer.email}
                            </span>
                          )}
                          {customer.cellPhone && (
                            <span className="font-mono">{customer.cellPhone}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Commodity */}
                    <td className="px-5 py-3.5">
                      {customer.commodity ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          <Tag className="size-3 shrink-0" />
                          <span className="truncate max-w-[120px]">
                            {customer.commodity}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Industrial Zone & Location */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">
                            {customer.industrialZone || "—"}
                          </p>
                          {customer.location && (
                            <p className="text-[11px] text-muted-foreground">
                              {customer.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Shipments count */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-medium text-sky-600 dark:text-sky-400">
                        <Package className="size-3" />
                        <span>{customer._count?.shipments ?? 0}</span>
                      </span>
                    </td>

                    {/* Actions dropdown */}
                    <td className="px-5 py-3.5 text-right relative">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onView(customer)}
                          title="View Details"
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Eye className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(customer)}
                          title="Edit Customer"
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(customer)}
                          title="Delete Customer"
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
            customers
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

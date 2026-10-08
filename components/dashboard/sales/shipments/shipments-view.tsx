"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Plus } from "lucide-react";
import { ShipmentStats } from "./shipment-stats";
import { ShipmentTable } from "./shipment-table";
import { ShipmentDialog } from "./shipment-dialog";
import { ShipmentViewDialog } from "./shipment-view-dialog";
import { ShipmentDeleteDialog } from "./shipment-delete-dialog";
import type {
  ShipmentItem,
  ShipmentStats as ShipmentStatsType,
} from "@/lib/shipment/types";

interface CustomerOption {
  id: string;
  companyName: string;
}

interface ShipmentsViewProps {
  initialShipments: ShipmentItem[];
  customers: CustomerOption[];
  stats: ShipmentStatsType;
  role: "ADMIN" | "SALES" | "SALES_MANAGER";
  organizationName: string;
}

export function ShipmentsView({
  initialShipments,
  customers,
  stats,
  role,
  organizationName,
}: ShipmentsViewProps) {
  const router = useRouter();

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<ShipmentItem | null>(null);
  const [viewingShipment, setViewingShipment] = useState<ShipmentItem | null>(null);
  const [deletingShipment, setDeletingShipment] = useState<ShipmentItem | null>(null);

  const handleSuccess = () => {
    router.refresh();
  };

  const handleViewRates = (shipment: ShipmentItem) => {
    // Navigate to rates comparison view or page
    const basePath = role === "ADMIN" ? "/dashboard/admin" : "/dashboard/sales";
    router.push(`${basePath}/rates?shipmentId=${shipment.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Shipments & Freight Flows
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {stats.totalShipments} Active
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Manage import and export shipments, assign accounts, and track rate
            comparisons for {organizationName}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateDialogOpen(true)}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          <span>New Shipment</span>
        </button>
      </div>

      {/* KPI Stats */}
      <ShipmentStats stats={stats} />

      {/* Shipments Data Table */}
      <ShipmentTable
        shipments={initialShipments}
        customers={customers}
        role={role}
        onAddNew={() => setCreateDialogOpen(true)}
        onView={(s) => setViewingShipment(s)}
        onEdit={(s) => setEditingShipment(s)}
        onDelete={(s) => setDeletingShipment(s)}
        onViewRates={handleViewRates}
      />

      {/* Create Modal */}
      <ShipmentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        customers={customers}
        onSuccess={handleSuccess}
      />

      {/* Edit Modal */}
      <ShipmentDialog
        open={!!editingShipment}
        onOpenChange={(open) => !open && setEditingShipment(null)}
        shipment={editingShipment}
        customers={customers}
        onSuccess={handleSuccess}
      />

      {/* View Details Modal */}
      <ShipmentViewDialog
        open={!!viewingShipment}
        onOpenChange={(open) => !open && setViewingShipment(null)}
        shipment={viewingShipment}
        onEdit={(s) => {
          setViewingShipment(null);
          setEditingShipment(s);
        }}
        onViewRates={(s) => {
          setViewingShipment(null);
          handleViewRates(s);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ShipmentDeleteDialog
        open={!!deletingShipment}
        onOpenChange={(open) => !open && setDeletingShipment(null)}
        shipment={deletingShipment}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

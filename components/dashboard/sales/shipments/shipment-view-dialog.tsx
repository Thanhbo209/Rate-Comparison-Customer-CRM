"use client";

import React from "react";
import {
  Package,
  Building2,
  Tag,
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { ShipmentItem } from "@/lib/shipment/types";

interface ShipmentViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: ShipmentItem | null;
  onEdit: (shipment: ShipmentItem) => void;
  onViewRates?: (shipment: ShipmentItem) => void;
}

export function ShipmentViewDialog({
  open,
  onOpenChange,
  shipment,
  onEdit,
  onViewRates,
}: ShipmentViewDialogProps) {
  if (!shipment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package className="size-5" />
            </div>
            <div>
              <DialogTitle>{shipment.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 flex-wrap">
                <span>Shipment ID: {shipment.id}</span>
                {shipment.customer?.organization && (
                  <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium">
                    <Building2 className="size-2.5" />
                    {shipment.customer.organization.name}
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4 text-xs">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <span className="text-[11px] font-medium text-muted-foreground">
                Direction
              </span>
              <div className="mt-1 flex items-center gap-1.5 font-semibold">
                {shipment.direction === "IMPORT" ? (
                  <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <ArrowDownLeft className="size-3.5" />
                    Import (Inbound)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <ArrowUpRight className="size-3.5" />
                    Export (Outbound)
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <span className="text-[11px] font-medium text-muted-foreground">
                Configured Provider Rates
              </span>
              <p className="mt-1 flex items-center gap-1.5 font-semibold text-foreground">
                <Calculator className="size-3.5 text-primary" />
                <span>{shipment._count?.rates ?? 0} freight rates</span>
              </p>
            </div>
          </div>

          {/* Account & Cargo Info */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Building2 className="size-3.5" />
                Shipper Account
              </span>
              <span className="font-semibold text-foreground">
                {shipment.customer.companyName}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Tag className="size-3.5" />
                Commodity
              </span>
              <span className="font-semibold text-foreground">
                {shipment.commodity || "Not specified"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Created At
              </span>
              <span className="text-muted-foreground">
                {new Date(shipment.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 flex items-center justify-between gap-2">
          {onViewRates && (
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onViewRates(shipment);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 font-medium text-primary hover:bg-primary/20 text-xs"
            >
              <Calculator className="size-3.5" />
              <span>Compare Rates</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-border bg-background px-4 py-2 font-medium text-foreground hover:bg-muted"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onEdit(shipment);
              }}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
            >
              Edit Shipment
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

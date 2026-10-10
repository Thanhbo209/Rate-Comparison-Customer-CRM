"use client";

import React, { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { deleteShipmentAction } from "@/lib/shipment/actions";
import type { ShipmentItem } from "@/lib/shipment/types";
import { toast } from "react-toastify";

interface ShipmentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: ShipmentItem | null;
  onSuccess: () => void;
}

export function ShipmentDeleteDialog({
  open,
  onOpenChange,
  shipment,
  onSuccess,
}: ShipmentDeleteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!shipment) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await deleteShipmentAction(shipment.id);
      if (!res.success) {
        setError(res.error || "Failed to delete shipment");
        setLoading(false);
        return;
      }
      toast.success("Shipment deleted");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete shipment",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <DialogTitle>Delete Shipment</DialogTitle>
              <DialogDescription>
                This action cannot be undone. All configured provider rates and
                freight line items will be permanently removed.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="mt-3 rounded-xl border border-border/80 bg-muted/30 p-3 text-xs">
          <p className="font-semibold text-foreground">{shipment.name}</p>
          <p className="text-muted-foreground mt-0.5">
            Shipper: {shipment.customer.companyName} &bull; Direction:{" "}
            {shipment.direction}
          </p>
        </div>

        <DialogFooter className="mt-4">
          <button
            type="button"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-background disabled:opacity-50"
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            <span>Delete Shipment</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2,
  Package,
  Building2,
  Tag,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createShipmentAction,
  updateShipmentAction,
} from "@/lib/shipment/actions";
import type { ShipmentItem, ShipmentFormData } from "@/lib/shipment/types";
import { toast } from "react-toastify";

interface CustomerOption {
  id: string;
  companyName: string;
}

interface ShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment?: ShipmentItem | null;
  customers: CustomerOption[];
  onSuccess: () => void;
}

export function ShipmentDialog({
  open,
  onOpenChange,
  shipment,
  customers,
  onSuccess,
}: ShipmentDialogProps) {
  const isEdit = !!shipment;

  const [formData, setFormData] = useState<ShipmentFormData>({
    name: "",
    customerId: "",
    direction: "IMPORT",
    commodity: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shipment) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: shipment.name,
        customerId: shipment.customerId,
        direction: shipment.direction,
        commodity: shipment.commodity || "",
      });
    } else {
      setFormData({
        name: "",
        customerId: customers[0]?.id || "",
        direction: "IMPORT",
        commodity: "",
      });
    }
    setError(null);
  }, [shipment, customers, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Shipment name or reference is required.");
      return;
    }

    if (!formData.customerId) {
      setError("Please select a customer for this shipment.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = isEdit
        ? await updateShipmentAction(shipment!.id, formData)
        : await createShipmentAction(formData);

      if (!res.success) {
        setError(res.error || "Failed to save shipment.");
        setLoading(false);
        return;
      }

      toast.success(isEdit ? "Shipment updated" : "Shipment added");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package className="size-5" />
            </div>
            <div>
              <DialogTitle>
                {isEdit ? "Edit Shipment" : "Create New Shipment"}
              </DialogTitle>
              <DialogDescription>
                {isEdit
                  ? "Update shipment routing details and commodity specifications."
                  : "Register a new shipment for an account to start configuring rates."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive">
              {error}
            </div>
          )}

          {/* Customer Selection */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground flex items-center gap-1.5">
              <Building2 className="size-3.5 text-muted-foreground" />
              Shipper / Customer Account{" "}
              <span className="text-destructive">*</span>
            </label>
            {customers.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                No customer accounts found. Please create a customer first.
              </p>
            ) : (
              <Select
                value={formData.customerId}
                onValueChange={(val) => {
                  if (val) {
                    setFormData((prev) => ({
                      ...prev,
                      customerId: val,
                    }));
                  }
                }}
              >
                <SelectTrigger className="w-full h-10 rounded-lg border-border bg-background text-sm">
                  <SelectValue placeholder="Select a customer account...">
                    {(val: string | null) => {
                      if (!val) return "Select a customer account...";
                      const found = customers.find((c) => c.id === val);
                      return found ? found.companyName : "Select a customer account...";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-72">
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Shipment Name / Reference */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground flex items-center gap-1.5">
              <Package className="size-3.5 text-muted-foreground" />
              Shipment Name / Order Ref{" "}
              <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. PO-9842 Precision Machinery Lot 1"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>

          {/* Shipment Direction Toggle */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground">
              Freight Direction <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, direction: "IMPORT" }))
                }
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 font-medium transition-all ${
                  formData.direction === "IMPORT"
                    ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <ArrowDownLeft className="size-4" />
                <span>Import (Inbound)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, direction: "EXPORT" }))
                }
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 font-medium transition-all ${
                  formData.direction === "EXPORT"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <ArrowUpRight className="size-4" />
                <span>Export (Outbound)</span>
              </button>
            </div>
          </div>

          {/* Commodity */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground flex items-center gap-1.5">
              <Tag className="size-3.5 text-muted-foreground" />
              Cargo Commodity
            </label>
            <input
              type="text"
              placeholder="e.g. Industrial Electronics, Textile, Raw Material"
              value={formData.commodity}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, commodity: e.target.value }))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-border bg-background px-4 py-2 font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || customers.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              <span>{isEdit ? "Save Changes" : "Create Shipment"}</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

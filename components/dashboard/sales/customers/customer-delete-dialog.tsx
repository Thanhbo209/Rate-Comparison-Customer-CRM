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
import { deleteCustomerAction } from "@/lib/customer/actions";
import type { CustomerItem } from "@/lib/customer/types";

interface CustomerDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerItem | null;
  onSuccess: () => void;
}

export function CustomerDeleteDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerDeleteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!customer) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await deleteCustomerAction(customer.id);
      if (!res.success) {
        setError(res.error || "Failed to delete customer");
        setLoading(false);
        return;
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete customer");
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
              <DialogTitle>Delete Customer</DialogTitle>
              <DialogDescription>
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-3 text-xs text-muted-foreground leading-relaxed">
          <p>
            Are you sure you want to permanently delete{" "}
            <strong className="text-foreground">{customer.companyName}</strong>?
          </p>
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-[11px] text-destructive">
            Warning: All associated shipment records, carrier rate comparisons,
            and freight items for this customer will also be deleted.
          </div>
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-destructive px-4 text-xs font-medium text-destructive-foreground shadow-xs transition-colors hover:bg-destructive/90 disabled:opacity-50"
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            <span>Delete Customer</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

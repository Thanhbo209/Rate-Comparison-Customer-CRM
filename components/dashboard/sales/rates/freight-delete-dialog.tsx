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
import { deleteFreightItemAction } from "@/lib/freight/actions";
import type { FreightItemSummary } from "@/lib/rate/types";
import { toast } from "react-toastify";

interface FreightDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FreightItemSummary | null;
  onSuccess: (deletedItemId: string) => void;
}

export function FreightDeleteDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: FreightDeleteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!item) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await deleteFreightItemAction(item.id);
      if (!res.success) {
        setError(res.error || "Failed to delete charge");
        setLoading(false);
        return;
      }
      toast.success("Charge deleted");
      onOpenChange(false);
      onSuccess(item.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete charge",
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
              <DialogTitle>Delete Charge</DialogTitle>
              <DialogDescription>
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="mt-3 space-y-1.5 rounded-xl border border-border/80 bg-muted/30 p-3 text-xs">
          <p className="font-semibold text-foreground">{item.freight}</p>
          <p className="text-muted-foreground">
            Unit: {item.unit || "CONTAINER"} &bull; Quantity: {item.quantity} &bull; Buy: {item.net} &bull; Sell: {item.gross}
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
            <span>Delete Charge</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

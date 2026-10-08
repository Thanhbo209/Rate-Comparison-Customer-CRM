"use client";

import React, { useState } from "react";
import { Loader2, Plus, Building2, Truck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { addShipmentRateAction } from "@/lib/rate/actions";
import type { ProviderItem } from "@/lib/rate/types";

interface AddRateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipmentId: string;
  shipmentName: string;
  existingProviders: ProviderItem[];
  onSuccess: () => void;
}

export function AddRateDialog({
  open,
  onOpenChange,
  shipmentId,
  shipmentName,
  existingProviders,
  onSuccess,
}: AddRateDialogProps) {
  const [mode, setMode] = useState<"select" | "new">(
    existingProviders.length > 0 ? "select" : "new"
  );
  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    existingProviders[0]?.id || ""
  );
  const [newProviderName, setNewProviderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "select" && !selectedProviderId) {
      setError("Please select a carrier or freight provider.");
      return;
    }

    if (mode === "new" && !newProviderName.trim()) {
      setError("Please enter a carrier or freight provider name.");
      return;
    }

    try {
      setLoading(true);
      const res = await addShipmentRateAction({
        shipmentId,
        providerId: mode === "select" ? selectedProviderId : undefined,
        providerName: mode === "new" ? newProviderName.trim() : undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to add carrier rate.");
        setLoading(false);
        return;
      }

      setNewProviderName("");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Truck className="size-5" />
            </div>
            <div>
              <DialogTitle>Add Carrier Rate</DialogTitle>
              <DialogDescription>
                Add a freight provider to compare rates for &quot;{shipmentName}&quot;.
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

          {existingProviders.length > 0 && (
            <div className="grid grid-cols-2 p-1 rounded-xl bg-muted/60 border border-border">
              <button
                type="button"
                onClick={() => {
                  setMode("select");
                  setError(null);
                }}
                className={`py-2 px-3 rounded-lg font-medium transition-all text-xs ${
                  mode === "select"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Existing Carrier
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("new");
                  setError(null);
                }}
                className={`py-2 px-3 rounded-lg font-medium transition-all text-xs ${
                  mode === "new"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                New Carrier
              </button>
            </div>
          )}

          {mode === "select" && existingProviders.length > 0 ? (
            <div className="space-y-1.5">
              <label className="font-medium text-foreground flex items-center gap-1.5">
                <Truck className="size-3.5 text-muted-foreground" />
                Select Carrier / Provider
              </label>
              <select
                value={selectedProviderId}
                onChange={(e) => setSelectedProviderId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
              >
                {existingProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="font-medium text-foreground flex items-center gap-1.5">
                <Truck className="size-3.5 text-muted-foreground" />
                Carrier / Line Name
              </label>
              <input
                type="text"
                placeholder="e.g. Maersk Line, MSC, CMA CGM, ONE"
                value={newProviderName}
                onChange={(e) => setNewProviderName(e.target.value)}
                autoFocus
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
              />
            </div>
          )}

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
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              <span>Add Carrier Option</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

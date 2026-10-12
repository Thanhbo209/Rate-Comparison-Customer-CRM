"use client";

import React, { useState } from "react";
import { Loader2, Truck, Pencil } from "lucide-react";
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
import { updateShipmentRateProviderAction } from "@/lib/rate/actions";
import type { ProviderItem, ShipmentRateItem } from "@/lib/rate/types";
import { toast } from "react-toastify";

interface EditRateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate: ShipmentRateItem;
  shipmentName: string;
  existingProviders: ProviderItem[];
  onSuccess: () => void;
}

export function EditRateDialog({
  open,
  onOpenChange,
  rate,
  shipmentName,
  existingProviders,
  onSuccess,
}: EditRateDialogProps) {
  const [mode, setMode] = useState<"select" | "new">("select");
  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    rate.providerId || rate.provider?.id || existingProviders[0]?.id || "",
  );
  const [newProviderName, setNewProviderName] = useState(
    rate.provider?.name || "",
  );
  const [optionName, setOptionName] = useState(rate.optionName || "");
  const [renameExisting, setRenameExisting] = useState(false);
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
      const res = await updateShipmentRateProviderAction({
        shipmentRateId: rate.id,
        providerId: mode === "select" ? selectedProviderId : undefined,
        providerName: mode === "new" ? newProviderName.trim() : undefined,
        optionName: optionName.trim(),
        renameExistingProvider: mode === "new" ? renameExisting : false,
      });

      if (!res.success) {
        setError(res.error || "Failed to update carrier rate.");
        setLoading(false);
        return;
      }

      toast.success("Carrier / Freight updated successfully");
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
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Pencil className="size-5" />
            </div>
            <div>
              <DialogTitle>Change Carrier / Freight</DialogTitle>
              <DialogDescription>
                Update the freight provider or option label for &quot;
                {shipmentName}&quot;.
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
                Existing Freight
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
                New Freight
              </button>
            </div>
          )}

          {mode === "select" && existingProviders.length > 0 ? (
            <div className="space-y-1.5">
              <label className="font-medium text-foreground flex items-center gap-1.5">
                <Truck className="size-3.5 text-muted-foreground" />
                Select Freight / Provider
              </label>
              <Select
                value={selectedProviderId}
                onValueChange={(val) => {
                  if (val) setSelectedProviderId(val);
                }}
              >
                <SelectTrigger className="w-full h-10 rounded-lg border-border bg-background text-xs">
                  <SelectValue placeholder="Select freight provider...">
                    {(val: string | null) => {
                      if (!val) return "Select freight provider...";
                      const found = existingProviders.find((p) => p.id === val);
                      return found ? found.name : "Select freight provider...";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-72">
                  {existingProviders.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="space-y-1.5">
                <label className="font-medium text-foreground flex items-center gap-1.5">
                  <Truck className="size-3.5 text-muted-foreground" />
                  Freight / Line Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Trucking, Custom VN, Express, Delivery, DOC"
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                  autoFocus
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              {rate.provider?.name && (
                <label className="flex items-center gap-2 cursor-pointer pt-1 text-[11px] text-muted-foreground hover:text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={renameExisting}
                    onChange={(e) => setRenameExisting(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary/20"
                  />
                  <span>
                    Rename &quot;{rate.provider.name}&quot; provider directly
                  </span>
                </label>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-medium text-foreground flex items-center justify-between">
              <span>
                Option / Routing Label{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </span>
            </label>
            <input
              type="text"
              placeholder="e.g. Direct - 18 days, Via Singapore, Spot Rate"
              value={optionName}
              onChange={(e) => setOptionName(e.target.value)}
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
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

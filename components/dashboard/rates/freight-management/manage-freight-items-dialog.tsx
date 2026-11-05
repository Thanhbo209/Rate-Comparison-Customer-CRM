"use client";

import { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  createFreightItemAction,
  updateFreightItemAction,
} from "@/lib/freight/actions";
import type { ShipmentRateItem, FreightItemSummary } from "@/lib/rate/types";
import { toast } from "react-toastify";
import { FreightDeleteDialog } from "../dialogs/freight-delete-dialog";
import { ChargeDraft, toPayload } from "@/utils/freight-management/constants";
import { SummaryBar } from "./components/summary-bar";
import { ChargeSheet } from "./components/charge-sheet";
import { AddChargeForm } from "@/components/forms/add-charge-form";

interface ManageFreightItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate: ShipmentRateItem | null;
  shipmentName: string;
  onSuccess: () => void;
}

export function ManageFreightItemsDialog({
  open,
  onOpenChange,
  rate,
  shipmentName,
  onSuccess,
}: ManageFreightItemsDialogProps) {
  const [items, setItems] = useState<FreightItemSummary[]>(
    rate?.freightItems || [],
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<FreightItemSummary | null>(
    null,
  );

  // Pending flags and errors live next to the form they belong to
  const [isAdding, setIsAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (rate) setItems(rate.freightItems);
    setEditingId(null);
    setDeletingItem(null);
    setAddError(null);
    setRowError(null);
  }, [rate, open]);

  if (!rate) return null;

  const baseCurrency = rate.baseCurrency;

  // Live totals from the items shown, so they stay correct after every add, edit and delete
  const totals = items.reduce(
    (acc, item) => {
      acc.net += item.net * item.quantity;
      acc.gross += item.gross * item.quantity;
      return acc;
    },
    { net: 0, gross: 0 },
  );

  /* ───────────── Actions ───────────── */

  const handleAddItem = async (draft: ChargeDraft): Promise<boolean> => {
    setAddError(null);

    if (!draft.freight.trim()) {
      setAddError("Charge description is required.");
      return false;
    }

    setIsAdding(true);
    try {
      const res = await createFreightItemAction({
        shipmentRateId: rate.id,
        ...toPayload(draft),
        currency: rate.baseCurrency,
      });

      if (!res.success || !res.data) {
        setAddError(res.error || "Failed to add freight item.");
        return false;
      }

      const created = res.data;
      setItems((prev) => [
        ...prev,
        {
          id: created.id,
          freight: created.freight,
          chargeType: created.chargeType,
          unit: created.unit,
          quantity: created.quantity,
          net: created.net,
          gross: created.gross,
          profit: created.profit,
          currency: rate.baseCurrency,
          originalNet: created.net,
          originalGross: created.gross,
          originalCurrency: rate.baseCurrency,
        },
      ]);

      toast.success("Charge added");
      onSuccess();
      return true;
    } catch {
      setAddError("Something went wrong while adding the charge. Try again.");
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  const handleStartEdit = (item: FreightItemSummary) => {
    setDeletingItem(null);
    setRowError(null);
    setEditingId(item.id);
  };

  const handleCancelEdit = () => {
    setRowError(null);
    setEditingId(null);
  };

  const handleSaveEdit = async (
    item: FreightItemSummary,
    draft: ChargeDraft,
  ) => {
    setRowError(null);
    setBusyId(item.id);
    try {
      const res = await updateFreightItemAction(item.id, {
        ...toPayload(draft),
        currency: (item.currency || "USD").trim(),
      });

      if (!res.success || !res.data) {
        setRowError(res.error || "Failed to update item.");
        return;
      }

      const updated = res.data;
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                freight: updated.freight,
                chargeType: updated.chargeType,
                unit: updated.unit,
                quantity: updated.quantity,
                net: updated.net,
                gross: updated.gross,
                profit: updated.profit,
                currency: updated.currency,
              }
            : i,
        ),
      );

      setEditingId(null);
      toast.success("Charge updated");
      onSuccess();
    } catch {
      setRowError("Something went wrong while saving. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  /* ───────────── Render ───────────── */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClose={() => onOpenChange(false)}
        className="w-screen max-w-7xl overflow-visible sm:max-w-7xl"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center bg-primary/10 text-primary">
              <Layers className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                Freight line items &bull; {rate.provider.name}
                {rate.optionName && (
                  <span className="ml-2 text-sm font-medium text-primary">
                    {rate.optionName}
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-sm">
                Itemized charges for shipment &quot;{shipmentName}&quot;. All
                amounts in{" "}
                <span className="font-semibold text-foreground">
                  {baseCurrency}
                </span>
                .
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-5 space-y-5">
          <SummaryBar
            net={totals.net}
            gross={totals.gross}
            currency={baseCurrency}
          />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            {/* ───────────── Charges list ───────────── */}
            <section className="h-full border border-border">
              <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Charges ({items.length})
                </h3>
                <span className="text-right text-xs text-muted-foreground">
                  All amounts in {baseCurrency}. Price is per unit; total and
                  profit are per line.
                </span>
              </div>

              {items.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <p className="text-sm font-medium text-foreground">
                    No charges yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add the first one with the form. Pick a quick-pick preset to
                    start faster.
                  </p>
                </div>
              ) : (
                <ChargeSheet
                  items={items}
                  baseCurrency={baseCurrency}
                  editingId={editingId}
                  busyId={busyId}
                  rowError={rowError}
                  onEdit={handleStartEdit}
                  onDelete={setDeletingItem}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                />
              )}
            </section>

            {/* ───────────── Add a charge ───────────── */}
            <AddChargeForm
              baseCurrency={baseCurrency}
              isAdding={isAdding}
              error={addError}
              onSubmit={handleAddItem}
            />
          </div>
        </div>

        <DialogFooter className="mt-5">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>

      <FreightDeleteDialog
        open={!!deletingItem}
        onOpenChange={(open) => {
          if (!open) setDeletingItem(null);
        }}
        item={deletingItem}
        onSuccess={(deletedId) => {
          setItems((prev) => prev.filter((i) => i.id !== deletedId));
          onSuccess();
        }}
      />
    </Dialog>
  );
}

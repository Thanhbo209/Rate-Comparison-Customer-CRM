"use client";

import React, { useState, useTransition } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Truck,
  DollarSign,
  Tag,
  Layers,
  Check,
  TrendingUp,
} from "lucide-react";
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
  deleteFreightItemAction,
} from "@/lib/freight/actions";
import type { ShipmentRateItem, FreightItemSummary } from "@/lib/rate/types";

interface ManageFreightItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate: ShipmentRateItem | null;
  shipmentName: string;
  onSuccess: () => void;
}

const COMMON_PRESETS = [
  "Ocean Freight",
  "Origin THC",
  "Destination THC",
  "Customs Clearance",
  "Inland Haulage / Trucking",
  "Documentation Fee",
  "Bunker Adjustment (BAF)",
  "Port Security Fee",
];

const COMMON_UNITS = ["CONTAINER", "CBM", "TON", "BL", "SHIPMENT", "TRUCK"];

export function ManageFreightItemsDialog({
  open,
  onOpenChange,
  rate,
  shipmentName,
  onSuccess,
}: ManageFreightItemsDialogProps) {
  const [items, setItems] = useState<FreightItemSummary[]>(
    rate?.freightItems || []
  );

  // New item form state
  const [freightName, setFreightName] = useState("");
  const [unit, setUnit] = useState("CONTAINER");
  const [quantity, setQuantity] = useState("1");
  const [net, setNet] = useState("");
  const [gross, setGross] = useState("");
  const [currency, setCurrency] = useState("USD");

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFreight, setEditFreight] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editQuantity, setEditQuantity] = useState("1");
  const [editNet, setEditNet] = useState("");
  const [editGross, setEditGross] = useState("");
  const [editCurrency, setEditCurrency] = useState("USD");

  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    if (rate) {
      setItems(rate.freightItems);
      setCurrency(rate.primaryCurrency || rate.baseCurrency || "USD");
    }
    setEditingId(null);
    setFormError(null);
  }, [rate, open]);

  if (!rate) return null;

  // Group items by currency
  const currencyTotalsMap = new Map<
    string,
    { net: number; gross: number; profit: number }
  >();

  items.forEach((item) => {
    const c = item.currency || "USD";
    const cur = currencyTotalsMap.get(c) || { net: 0, gross: 0, profit: 0 };
    cur.net += item.net * item.quantity;
    cur.gross += item.gross * item.quantity;
    cur.profit += (item.gross - item.net) * item.quantity;
    currencyTotalsMap.set(c, cur);
  });

  const currencyBuckets = Array.from(currencyTotalsMap.entries()).map(
    ([curr, val]) => ({
      currency: curr,
      totalNet: val.net,
      totalGross: val.gross,
      totalProfit: val.profit,
      marginPercent: val.gross > 0 ? (val.profit / val.gross) * 100 : 0,
    })
  );

  // New item preview profit
  const newNetVal = parseFloat(net) || 0;
  const newGrossVal = parseFloat(gross) || 0;
  const newQtyVal = parseFloat(quantity) || 1;
  const newProfitVal = (newGrossVal - newNetVal) * newQtyVal;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!freightName.trim()) {
      setFormError("Charge description is required.");
      return;
    }

    startTransition(async () => {
      const res = await createFreightItemAction({
        shipmentRateId: rate.id,
        freight: freightName.trim(),
        unit: unit.trim(),
        quantity: parseFloat(quantity) || 1,
        net: parseFloat(net) || 0,
        gross: parseFloat(gross) || 0,
        currency: rate.baseCurrency,
      });

      if (!res.success || !res.data) {
        setFormError(res.error || "Failed to add freight item.");
        return;
      }

      setItems((prev) => [
        ...prev,
        {
          id: res.data!.id,
          freight: res.data!.freight,
          unit: res.data!.unit,
          quantity: res.data!.quantity,
          net: res.data!.net,
          gross: res.data!.gross,
          profit: res.data!.profit,
          currency: rate.baseCurrency,
          originalNet: res.data!.net,
          originalGross: res.data!.gross,
          originalCurrency: rate.baseCurrency,
        },
      ]);

      // Reset form
      setFreightName("");
      setNet("");
      setGross("");
      setQuantity("1");
      onSuccess();
    });
  };

  const handleDeleteItem = (itemId: string) => {
    startTransition(async () => {
      const res = await deleteFreightItemAction(itemId);
      if (!res.success) {
        setFormError(res.error || "Failed to delete item.");
        return;
      }

      setItems((prev) => prev.filter((i) => i.id !== itemId));
      onSuccess();
    });
  };

  const handleStartEdit = (item: FreightItemSummary) => {
    setEditingId(item.id);
    setEditFreight(item.freight);
    setEditUnit(item.unit || "CONTAINER");
    setEditQuantity(String(item.quantity));
    setEditNet(String(item.net));
    setEditGross(String(item.gross));
    setEditCurrency(item.currency || "USD");
  };

  const handleSaveEdit = (itemId: string) => {
    startTransition(async () => {
      const res = await updateFreightItemAction(itemId, {
        freight: editFreight.trim(),
        unit: editUnit.trim(),
        quantity: parseFloat(editQuantity) || 1,
        net: parseFloat(editNet) || 0,
        gross: parseFloat(editGross) || 0,
        currency: editCurrency.trim(),
      });

      if (!res.success || !res.data) {
        setFormError(res.error || "Failed to update item.");
        return;
      }

      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                freight: res.data!.freight,
                unit: res.data!.unit,
                quantity: res.data!.quantity,
                net: res.data!.net,
                gross: res.data!.gross,
                profit: res.data!.profit,
                currency: res.data!.currency,
              }
            : i
        )
      );

      setEditingId(null);
      onSuccess();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers className="size-5" />
            </div>
            <div>
              <DialogTitle>
                Freight Line Items &bull; {rate.provider.name}
              </DialogTitle>
              <DialogDescription>
                Configure itemized charges and margins for shipment &quot;{shipmentName}&quot;.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-5 text-xs">
          {/* Running Totals Banner in System Base Currency */}
          <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Carrier Pricing ({rate.baseCurrency})
              </span>
              <span
                className={`font-mono text-xs font-bold ${
                  rate.consolidatedProfit >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive"
                }`}
              >
                Profit: {rate.consolidatedProfit >= 0 ? "+" : ""}
                {rate.consolidatedProfit.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}{" "}
                {rate.baseCurrency} ({rate.consolidatedMarginPercent.toFixed(1)}%)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[11px] text-muted-foreground">Buying Cost (Net):</span>
                <p className="font-mono font-bold text-foreground text-sm mt-0.5">
                  {rate.consolidatedNet.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{" "}
                  {rate.baseCurrency}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground">Selling Quote (Gross):</span>
                <p className="font-mono font-bold text-foreground text-sm mt-0.5">
                  {rate.consolidatedGross.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{" "}
                  {rate.baseCurrency}
                </p>
              </div>
            </div>
          </div>

          {formError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-destructive">
              {formError}
            </div>
          )}

          {/* Current Line Items Table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-muted/50 p-2.5 font-semibold text-foreground border-b border-border text-xs flex items-center justify-between">
              <span>Itemized Charges ({items.length})</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                Net = Cost to carrier &bull; Gross = Customer quote
              </span>
            </div>

            {items.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground italic">
                No freight line items configured yet. Add your first charge below.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/30 border-b border-border/60 text-muted-foreground">
                    <tr>
                      <th className="py-2.5 px-3 font-medium">Charge</th>
                      <th className="py-2.5 px-3 font-medium">Unit & Qty</th>
                      <th className="py-2.5 px-3 font-medium">Net (Buy)</th>
                      <th className="py-2.5 px-3 font-medium">Gross (Sell)</th>
                      <th className="py-2.5 px-3 font-medium">Currency</th>
                      <th className="py-2.5 px-3 font-medium">Total Profit</th>
                      <th className="py-2.5 px-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {items.map((item) => {
                      const isEditing = editingId === item.id;
                      const lineProfit = (item.gross - item.net) * item.quantity;

                      if (isEditing) {
                        return (
                          <tr key={item.id} className="bg-primary/5">
                            <td className="p-2">
                              <input
                                type="text"
                                value={editFreight}
                                onChange={(e) => setEditFreight(e.target.value)}
                                className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  value={editUnit}
                                  onChange={(e) => setEditUnit(e.target.value)}
                                  className="w-16 rounded border border-border bg-background px-1 py-1 text-xs"
                                />
                                <input
                                  type="number"
                                  value={editQuantity}
                                  onChange={(e) => setEditQuantity(e.target.value)}
                                  className="w-12 rounded border border-border bg-background px-1 py-1 text-xs font-mono"
                                />
                              </div>
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={editNet}
                                onChange={(e) => setEditNet(e.target.value)}
                                className="w-20 rounded border border-border bg-background px-1 py-1 text-xs font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={editGross}
                                onChange={(e) => setEditGross(e.target.value)}
                                className="w-20 rounded border border-border bg-background px-1 py-1 text-xs font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <div className="flex h-7 items-center justify-center rounded border border-border bg-muted/40 px-2 font-mono text-[11px] font-bold text-foreground">
                                {rate.baseCurrency}
                              </div>
                            </td>
                            <td className="p-2 font-mono text-muted-foreground text-xs">
                              {((parseFloat(editGross) || 0) - (parseFloat(editNet) || 0)) *
                                (parseFloat(editQuantity) || 1)}
                            </td>
                            <td className="p-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  disabled={isPending}
                                  onClick={() => handleSaveEdit(item.id)}
                                  className="h-7 px-2 text-[10px]"
                                >
                                  Save
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingId(null)}
                                  className="h-7 px-2 text-[10px]"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      const hasOriginal =
                        item.originalCurrency &&
                        item.originalCurrency !== rate.baseCurrency;

                      return (
                        <tr key={item.id} className="hover:bg-muted/20">
                          <td className="py-2.5 px-3 font-semibold text-foreground">
                            <div>{item.freight}</div>
                            {hasOriginal && (
                              <div className="text-[10px] text-muted-foreground font-normal">
                                Orig: {item.originalNet.toLocaleString()} net / {item.originalGross.toLocaleString()} gross ({item.originalCurrency})
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground font-mono">
                            {item.quantity} &times; {item.unit || "UNIT"}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-foreground">
                            {item.net.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-foreground font-semibold">
                            {item.gross.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground">
                              {rate.baseCurrency}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            +{lineProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })} {rate.baseCurrency}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(item)}
                                className="p-1 text-muted-foreground hover:text-foreground"
                                title="Edit Item"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 text-muted-foreground hover:text-destructive"
                                title="Delete Item"
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
          </div>

          {/* Add New Line Item Form */}
          <form
            onSubmit={handleAddItem}
            className="rounded-xl border border-border bg-card p-4 space-y-3"
          >
            <div className="font-semibold text-foreground text-xs flex items-center justify-between">
              <span>Add Freight Line Item</span>
              {newGrossVal > 0 && (
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-xs">
                  Est. Profit: +{newProfitVal.toLocaleString()} {currency}
                </span>
              )}
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground mr-1">Presets:</span>
              {COMMON_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFreightName(p)}
                  className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary hover:text-foreground"
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
              {/* Charge Name */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] text-muted-foreground">
                  Charge Name / Description *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ocean Freight 40HC"
                  value={freightName}
                  onChange={(e) => setFreightName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              {/* Unit */}
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                >
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Quantity</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Net Buying Cost */}
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">
                  Buying Rate (Net) *
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={net}
                  onChange={(e) => setNet(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden font-mono"
                />
              </div>

              {/* Gross Selling Price */}
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">
                  Selling Quote (Gross) *
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={gross}
                  onChange={(e) => setGross(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden font-mono"
                />
              </div>

              {/* System Base Currency Display & Add Button */}
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>Currency</span>
                  <span className="text-[10px] text-primary font-medium">System fixed</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex h-8 items-center justify-center rounded-lg border border-border bg-muted/40 px-3 text-xs font-mono font-bold text-foreground">
                    {rate.baseCurrency}
                  </div>

                  <Button
                    type="submit"
                    disabled={isPending || !freightName.trim()}
                    className="flex-1 text-xs h-8"
                  >
                    {isPending ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <>
                        <Plus className="size-3.5 mr-1" />
                        <span>Add Item</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

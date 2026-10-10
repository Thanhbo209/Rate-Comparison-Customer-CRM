"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { Layers, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createFreightItemAction,
  updateFreightItemAction,
} from "@/lib/freight/actions";
import type { ShipmentRateItem, FreightItemSummary } from "@/lib/rate/types";
import { toast } from "react-toastify";
import { FreightDeleteDialog } from "./freight-delete-dialog";

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


const fmt = (n: number, digits = 2) =>
  n.toLocaleString(undefined, { maximumFractionDigits: digits });
const toNum = (v: string) => parseFloat(v) || 0;

/** Total profit and margin for one line: profit = (sell - buy) x quantity */
function lineMath(net: number, gross: number, quantity: number) {
  const profit = (gross - net) * quantity;
  const sell = gross * quantity;
  return { profit, marginPercent: sell > 0 ? (profit / sell) * 100 : 0 };
}

/* ───────────── Small pieces ───────────── */

function SummaryTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "bad";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        tone === "default" && "border-border bg-muted/30",
        tone === "good" && "border-emerald-500/25 bg-emerald-500/10",
        tone === "bad" && "border-destructive/25 bg-destructive/10",
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-bold",
          tone === "good" && "text-emerald-700 dark:text-emerald-400",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

/* ───────────── Dialog ───────────── */

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

  // New item form
  const [freightName, setFreightName] = useState("");
  const [unit, setUnit] = useState("CONTAINER");
  const [quantity, setQuantity] = useState("1");
  const [net, setNet] = useState("");
  const [gross, setGross] = useState("");

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFreight, setEditFreight] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editQuantity, setEditQuantity] = useState("1");
  const [editNet, setEditNet] = useState("");
  const [editGross, setEditGross] = useState("");
  const [editCurrency, setEditCurrency] = useState("USD");

  // Delete item dialog + which row is saving
  const [deletingItem, setDeletingItem] =
    useState<FreightItemSummary | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nameRef = useRef<HTMLInputElement>(null);
  const netRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (rate) setItems(rate.freightItems);
    setEditingId(null);
    setDeletingItem(null);
    setFormError(null);
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
  const totalProfit = totals.gross - totals.net;
  const totalMargin = totals.gross > 0 ? (totalProfit / totals.gross) * 100 : 0;
  const costShare =
    totals.gross > 0 ? Math.min(100, (totals.net / totals.gross) * 100) : 0;

  // Preview for the new charge
  const preview = lineMath(toNum(net), toNum(gross), toNum(quantity) || 1);
  const previewBuy = toNum(net) * (toNum(quantity) || 1);
  const previewSell = toNum(gross) * (toNum(quantity) || 1);
  const sellingBelowCost = toNum(gross) > 0 && toNum(gross) < toNum(net);

  /* ───────────── Actions ───────────── */

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

      setFreightName("");
      setNet("");
      setGross("");
      setQuantity("1");
      toast.success("Charge added");
      onSuccess();
      nameRef.current?.focus(); // ready for the next charge
    });
  };

  const handleStartEdit = (item: FreightItemSummary) => {
    setDeletingItem(null);
    setEditingId(item.id);
    setEditFreight(item.freight);
    setEditUnit(item.unit || "CONTAINER");
    setEditQuantity(String(item.quantity));
    setEditNet(String(item.net));
    setEditGross(String(item.gross));
    setEditCurrency(item.currency || "USD");
  };

  const handleSaveEdit = (itemId: string) => {
    setBusyId(itemId);
    startTransition(async () => {
      const res = await updateFreightItemAction(itemId, {
        freight: editFreight.trim(),
        unit: editUnit.trim(),
        quantity: parseFloat(editQuantity) || 1,
        net: parseFloat(editNet) || 0,
        gross: parseFloat(editGross) || 0,
        currency: editCurrency.trim(),
      });
      setBusyId(null);

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
            : i,
        ),
      );

      setEditingId(null);
      toast.success("Charge updated");
      onSuccess();
    });
  };

  const editUnitOptions = COMMON_UNITS.includes(editUnit)
    ? COMMON_UNITS
    : [editUnit, ...COMMON_UNITS];

  /* ───────────── Render ───────────── */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClose={() => onOpenChange(false)}
        className="max-h-[92vh] w-[95vw] max-w-6xl overflow-y-auto sm:max-w-6xl"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
          {/* Summary */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <SummaryTile
                label="Buying cost (net)"
                value={`${fmt(totals.net)} ${baseCurrency}`}
              />
              <SummaryTile
                label="Selling quote (gross)"
                value={`${fmt(totals.gross)} ${baseCurrency}`}
              />
              <SummaryTile
                label="Profit"
                value={`${totalProfit >= 0 ? "+" : ""}${fmt(totalProfit)} ${baseCurrency}`}
                tone={totalProfit >= 0 ? "good" : "bad"}
              />
              <SummaryTile
                label="Margin"
                value={`${totalMargin.toFixed(1)}%`}
                tone={totalProfit >= 0 ? "good" : "bad"}
              />
            </div>

            {/* Where the selling price goes: cost vs profit */}
            {totals.gross > 0 && (
              <div>
                <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                  {totalProfit >= 0 ? (
                    <>
                      <div
                        className="h-full bg-muted-foreground/40 transition-all"
                        style={{ width: `${costShare}%` }}
                      />
                      <div className="h-full flex-1 bg-emerald-500 transition-all" />
                    </>
                  ) : (
                    <div className="h-full w-full bg-destructive" />
                  )}
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block size-2 rounded-full bg-muted-foreground/40" />
                    Cost {costShare.toFixed(0)}%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-block size-2 rounded-full",
                        totalProfit >= 0 ? "bg-emerald-500" : "bg-destructive",
                      )}
                    />
                    {totalProfit >= 0 ? "Profit" : "Loss"}{" "}
                    {Math.abs(totalMargin).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {formError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {formError}
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            {/* ───────────── Charges list ───────────── */}
            <section className="overflow-hidden rounded-xl border border-border">
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Charges ({items.length})
                </h3>
                <span className="text-xs text-muted-foreground">
                  Buy and sell are per unit
                </span>
              </div>

              {items.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <p className="text-sm font-medium text-foreground">
                    No charges yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add the first one with the form on the right. Pick a preset
                    to start faster.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border text-xs text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Charge</th>
                        <th className="px-3 py-2.5 text-right font-medium">
                          Buy
                        </th>
                        <th className="px-3 py-2.5 text-right font-medium">
                          Sell
                        </th>
                        <th className="px-3 py-2.5 text-right font-medium">
                          Profit
                        </th>
                        <th className="px-3 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((item) => {
                        const { profit, marginPercent } = lineMath(
                          item.net,
                          item.gross,
                          item.quantity,
                        );
                        const isEditing = editingId === item.id;
                        const isBusy = busyId === item.id;
                        const hasOriginal =
                          item.originalCurrency &&
                          item.originalCurrency !== baseCurrency;

                        /* Edit panel */
                        if (isEditing) {
                          const editMath = lineMath(
                            toNum(editNet),
                            toNum(editGross),
                            toNum(editQuantity) || 1,
                          );
                          return (
                            <tr key={item.id} className="bg-primary/5">
                              <td colSpan={5} className="p-4">
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSaveEdit(item.id);
                                  }}
                                  onKeyDown={(e) =>
                                    e.key === "Escape" && setEditingId(null)
                                  }
                                  className="space-y-4"
                                >
                                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                                    <Field
                                      label="Charge"
                                      htmlFor={`edit-name-${item.id}`}
                                      className="col-span-2 sm:col-span-3"
                                    >
                                      <Input
                                        id={`edit-name-${item.id}`}
                                        value={editFreight}
                                        onChange={(e) =>
                                          setEditFreight(e.target.value)
                                        }
                                        required
                                        autoFocus
                                        className="h-10"
                                      />
                                    </Field>
                                    <Field
                                      label="Unit"
                                      htmlFor={`edit-unit-${item.id}`}
                                      className="sm:col-span-2"
                                    >
                                      <Select
                                        value={editUnit}
                                        onValueChange={(val) => {
                                          if (val) setEditUnit(val);
                                        }}
                                      >
                                        <SelectTrigger
                                          id={`edit-unit-${item.id}`}
                                          className="h-10 w-full rounded-lg border-border bg-background text-sm"
                                        >
                                          <SelectValue placeholder="Select unit...">
                                            {(val: string | null) =>
                                              val || "Select unit..."
                                            }
                                          </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl max-h-60">
                                          {editUnitOptions.map((u) => (
                                            <SelectItem key={u} value={u}>
                                              {u}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </Field>
                                    <Field
                                      label="Quantity"
                                      htmlFor={`edit-qty-${item.id}`}
                                    >
                                      <Input
                                        id={`edit-qty-${item.id}`}
                                        type="number"
                                        step="any"
                                        min="0.01"
                                        value={editQuantity}
                                        onChange={(e) =>
                                          setEditQuantity(e.target.value)
                                        }
                                        className="h-10"
                                      />
                                    </Field>
                                    <Field
                                      label={`Buy per unit (${baseCurrency}, optional)`}
                                      htmlFor={`edit-net-${item.id}`}
                                      className="sm:col-span-3"
                                    >
                                      <Input
                                        id={`edit-net-${item.id}`}
                                        type="number"
                                        step="any"
                                        value={editNet}
                                        onChange={(e) =>
                                          setEditNet(e.target.value)
                                        }
                                        className="h-10"
                                      />
                                    </Field>
                                    <Field
                                      label={`Sell per unit (${baseCurrency}, optional)`}
                                      htmlFor={`edit-gross-${item.id}`}
                                      className="sm:col-span-3"
                                    >
                                      <Input
                                        id={`edit-gross-${item.id}`}
                                        type="number"
                                        step="any"
                                        value={editGross}
                                        onChange={(e) =>
                                          setEditGross(e.target.value)
                                        }
                                        className="h-10"
                                      />
                                    </Field>
                                  </div>

                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p
                                      className={cn(
                                        "text-sm font-semibold",
                                        editMath.profit >= 0
                                          ? "text-emerald-600 dark:text-emerald-400"
                                          : "text-destructive",
                                      )}
                                    >
                                      Profit {editMath.profit >= 0 ? "+" : ""}
                                      {fmt(editMath.profit)} {baseCurrency} (
                                      {editMath.marginPercent.toFixed(1)}%)
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setEditingId(null)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        type="submit"
                                        disabled={isBusy || !editFreight.trim()}
                                      >
                                        {isBusy ? (
                                          <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                          "Save changes"
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </form>
                              </td>
                            </tr>
                          );
                        }

                        /* Normal row */
                        return (
                          <tr
                            key={item.id}
                            className="align-top transition-colors hover:bg-muted/20"
                          >
                            <td className="px-4 py-3">
                              <p className="font-semibold text-foreground">
                                {item.freight}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {fmt(item.quantity, 3)} &times;{" "}
                                {item.unit || "UNIT"}
                              </p>
                              {hasOriginal && (
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                  Original: {fmt(item.originalNet)} buy /{" "}
                                  {fmt(item.originalGross)} sell (
                                  {item.originalCurrency})
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right text-foreground">
                              {fmt(item.net)}
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-foreground">
                              {fmt(item.gross)}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <p
                                className={cn(
                                  "font-bold",
                                  profit >= 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-destructive",
                                )}
                              >
                                {profit >= 0 ? "+" : ""}
                                {fmt(profit)}
                              </p>
                              <div className="ml-auto mt-1.5 h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    profit >= 0
                                      ? "bg-emerald-500"
                                      : "bg-destructive",
                                  )}
                                  style={{
                                    width: `${Math.min(100, Math.abs(marginPercent))}%`,
                                  }}
                                />
                              </div>
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                {marginPercent.toFixed(1)}%
                              </p>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(item)}
                                  aria-label={`Edit ${item.freight}`}
                                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                  <Pencil className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingItem(item)}
                                  aria-label={`Delete ${item.freight}`}
                                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="size-4" />
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
            </section>

            {/* ───────────── Add a charge ───────────── */}
            <form
              onSubmit={handleAddItem}
              className="space-y-4 self-start rounded-xl border border-border bg-card p-4 lg:sticky lg:top-0"
            >
              <h3 className="text-sm font-semibold text-foreground">
                Add a charge
              </h3>

              <div>
                <p className="mb-2 text-xs text-muted-foreground">Quick pick</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setFreightName(preset);
                        netRef.current?.focus();
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors",
                        freightName === preset
                          ? "border-primary bg-primary/10 font-medium text-primary"
                          : "border-border text-muted-foreground hover:border-primary hover:text-foreground",
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Charge name" htmlFor="new-name">
                <Input
                  id="new-name"
                  ref={nameRef}
                  value={freightName}
                  onChange={(e) => setFreightName(e.target.value)}
                  placeholder="e.g. Ocean Freight 40HC"
                  required
                  className="h-10"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Unit" htmlFor="new-unit">
                  <Select
                    value={unit}
                    onValueChange={(val) => {
                      if (val) setUnit(val);
                    }}
                  >
                    <SelectTrigger
                      id="new-unit"
                      className="h-10 w-full rounded-lg border-border bg-background text-sm"
                    >
                      <SelectValue placeholder="Select unit...">
                        {(val: string | null) => val || "Select unit..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-60">
                      {COMMON_UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Quantity" htmlFor="new-qty">
                  <Input
                    id="new-qty"
                    type="number"
                    step="any"
                    min="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    className="h-10"
                  />
                </Field>
                <Field
                  label={`Buy per unit (${baseCurrency}, optional)`}
                  htmlFor="new-net"
                >
                  <Input
                    id="new-net"
                    ref={netRef}
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={net}
                    onChange={(e) => setNet(e.target.value)}
                    className="h-10"
                  />
                </Field>
                <Field
                  label={`Sell per unit (${baseCurrency}, optional)`}
                  htmlFor="new-gross"
                >
                  <Input
                    id="new-gross"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={gross}
                    onChange={(e) => setGross(e.target.value)}
                    className="h-10"
                  />
                </Field>
              </div>

              {/* Live preview */}
              <div className="rounded-lg bg-muted/40 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total buy</span>
                  <span>{fmt(previewBuy)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-muted-foreground">Total sell</span>
                  <span>{fmt(previewSell)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                  <span className="font-medium text-foreground">Profit</span>
                  <span
                    className={cn(
                      "font-bold",
                      preview.profit >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive",
                    )}
                  >
                    {preview.profit >= 0 ? "+" : ""}
                    {fmt(preview.profit)} {baseCurrency} (
                    {preview.marginPercent.toFixed(1)}%)
                  </span>
                </div>
                {sellingBelowCost && (
                  <p className="mt-2 text-xs text-destructive">
                    The selling price is below the buying cost.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-11 w-full gap-1.5"
                disabled={isPending || !freightName.trim()}
              >
                {isPending && !busyId ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="size-4" />
                    Add charge
                  </>
                )}
              </Button>
            </form>
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

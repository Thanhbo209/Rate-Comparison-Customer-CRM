"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type Ref,
} from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Trash2,
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

/* -------------------------------------------------------------------------- */
/* Constants and helpers                                                      */
/* -------------------------------------------------------------------------- */

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

const COMMON_UNITS = [
  "CONTAINER",
  "CBM",
  "TON",
  "KG",
  "PALLET",
  "PACKAGE",
  "BL",
  "SHIPMENT",
  "TRUCK",
];

const moneyFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const qtyFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 });

const money = (n: number) => moneyFmt.format(n);
const signed = (n: number) => `${n >= 0 ? "+" : ""}${money(n)}`;
const toNum = (v: string) => parseFloat(v) || 0;

const PROFIT_TEXT = "text-emerald-600 dark:text-emerald-400";

/** Total profit and margin for one line: profit = (sell - buy) x quantity */
function lineMath(net: number, gross: number, quantity: number) {
  const profit = (gross - net) * quantity;
  const sell = gross * quantity;
  return { profit, marginPercent: sell > 0 ? (profit / sell) * 100 : 0 };
}

/** What the forms hold: raw strings, parsed only when saving. */
interface ChargeDraft {
  freight: string;
  unit: string;
  quantity: string;
  net: string;
  gross: string;
}

const toPayload = (d: ChargeDraft) => ({
  freight: d.freight.trim(),
  unit: d.unit.trim(),
  quantity: parseFloat(d.quantity) || 1,
  net: parseFloat(d.net) || 0,
  gross: parseFloat(d.gross) || 0,
});

/* -------------------------------------------------------------------------- */
/* Form primitives                                                            */
/* -------------------------------------------------------------------------- */

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
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

/** Number input with an optional unit suffix. The wheel and spinners are disabled so a scroll can't change a price. */
function NumberField({
  id,
  value,
  onChange,
  suffix,
  placeholder,
  min,
  required,
  autoFocus,
  inputRef,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  placeholder?: string;
  min?: string;
  required?: boolean;
  autoFocus?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        ref={inputRef}
        type="number"
        inputMode="decimal"
        step="any"
        min={min}
        value={value}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onWheel={(e) => e.currentTarget.blur()}
        className={cn(
          "h-10 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          suffix && "pr-14",
        )}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
}

function UnitSelect({
  id,
  value,
  onChange,
  options = COMMON_UNITS,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options?: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (opt) =>
      !value.trim() ||
      opt.toLowerCase().includes(value.trim().toLowerCase()) ||
      opt.toLowerCase() === value.trim().toLowerCase(),
  );
  const displayOptions = filteredOptions.length > 0 ? filteredOptions : options;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Input
          id={id}
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && isOpen) {
              e.stopPropagation();
              setIsOpen(false);
            }
          }}
          placeholder="e.g. CONTAINER"
          className="h-10 w-full pr-8 text-sm uppercase"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            inputRef.current?.focus();
          }}
          tabIndex={-1}
          className="absolute right-1 flex size-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
          title="Toggle unit list"
          aria-label="Toggle unit list"
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-150",
              isOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto border border-border bg-popover p-1 text-popover-foreground shadow-lg">
          <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Existing choices
          </div>
          {displayOptions.map((u) => {
            const isSelected = value.trim().toUpperCase() === u.toUpperCase();
            return (
              <button
                key={u}
                type="button"
                onClick={() => {
                  onChange(u);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground",
                  isSelected && "bg-accent/60 font-semibold text-primary",
                )}
              >
                <span>{u}</span>
                {isSelected && <Check className="size-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InlineError({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 border border-destructive/20 bg-destructive/10 p-2.5 text-sm text-destructive"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Profit readout: live feedback while typing in either form                  */
/* -------------------------------------------------------------------------- */

function ProfitReadout({
  net,
  gross,
  quantity,
  currency,
  variant,
}: {
  net: string;
  gross: string;
  quantity: string;
  currency: string;
  variant: "card" | "inline";
}) {
  const qty = toNum(quantity) || 1;
  const { profit, marginPercent } = lineMath(toNum(net), toNum(gross), qty);
  const empty = !net && !gross;
  const sellingBelowCost = toNum(gross) > 0 && toNum(gross) < toNum(net);

  const tone = empty
    ? "text-muted-foreground"
    : profit >= 0
      ? PROFIT_TEXT
      : "text-destructive";

  const warning = sellingBelowCost && (
    <p role="status" className="text-xs text-destructive">
      The selling price is below the buying cost.
    </p>
  );

  if (variant === "inline") {
    return (
      <div className="space-y-0.5">
        <p className={cn("text-sm font-semibold tabular-nums", tone)}>
          Profit {signed(profit)} {currency} ({marginPercent.toFixed(1)}%)
        </p>
        {warning}
      </div>
    );
  }

  return (
    <div className="bg-muted/40 p-3 text-sm tabular-nums">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Total buy</span>
        <span>{money(toNum(net) * qty)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-muted-foreground">Total sell</span>
        <span>{money(toNum(gross) * qty)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
        <span className="font-medium text-foreground">Profit</span>
        <span className={cn("font-bold", tone)}>
          {signed(profit)} {currency} ({marginPercent.toFixed(1)}%)
        </span>
      </div>
      {warning && <div className="mt-2">{warning}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary                                                                    */
/* -------------------------------------------------------------------------- */

function Metric({
  label,
  value,
  unit,
  tone = "default",
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "default" | "good" | "bad";
}) {
  return (
    <div className="bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-bold tabular-nums",
          tone === "good" && PROFIT_TEXT,
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
        {unit && (
          <span className="ml-1.5 text-xs font-medium text-muted-foreground">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

function SummaryBar({
  net,
  gross,
  currency,
}: {
  net: number;
  gross: number;
  currency: string;
}) {
  const profit = gross - net;
  const margin = gross > 0 ? (profit / gross) * 100 : 0;
  const costShare = gross > 0 ? Math.min(100, (net / gross) * 100) : 0;
  const tone = profit >= 0 ? "good" : "bad";

  return (
    <div className="grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-4">
      <Metric label="Buying cost (net)" value={money(net)} unit={currency} />
      <Metric
        label="Selling quote (gross)"
        value={money(gross)}
        unit={currency}
      />
      <Metric
        label="Profit"
        value={signed(profit)}
        unit={currency}
        tone={tone}
      />
      <Metric label="Margin" value={`${margin.toFixed(1)}%`} tone={tone} />

      {/* Where the selling price goes: cost vs profit */}
      {gross > 0 && (
        <div className="col-span-full bg-card px-4 py-3">
          <div
            role="img"
            aria-label={`Cost ${costShare.toFixed(0)} percent, ${
              profit >= 0 ? "profit" : "loss"
            } ${Math.abs(margin).toFixed(0)} percent of the selling price`}
            className="flex h-2.5 overflow-hidden bg-muted"
          >
            {profit >= 0 ? (
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
              <span className="inline-block size-2 bg-muted-foreground/40" />
              Cost {costShare.toFixed(0)}%
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-block size-2",
                  profit >= 0 ? "bg-emerald-500" : "bg-destructive",
                )}
              />
              {profit >= 0 ? "Profit" : "Loss"} {Math.abs(margin).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Charge rows                                                                */
/* -------------------------------------------------------------------------- */

function ChargeRow({
  item,
  baseCurrency,
  onEdit,
  onDelete,
}: {
  item: FreightItemSummary;
  baseCurrency: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { profit, marginPercent } = lineMath(
    item.net,
    item.gross,
    item.quantity,
  );
  const hasOriginal =
    item.originalCurrency && item.originalCurrency !== baseCurrency;

  return (
    <tr className="align-top transition-colors hover:bg-muted/20">
      <td className="px-4 py-3">
        <p className="font-semibold text-foreground">{item.freight}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {qtyFmt.format(item.quantity)} &times; {item.unit || "UNIT"}
        </p>
        {hasOriginal && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Original: {money(item.originalNet)} buy /{" "}
            {money(item.originalGross)} sell ({item.originalCurrency})
          </p>
        )}
      </td>
      <td className="px-3 py-3 text-right tabular-nums text-foreground">
        {money(item.net)}
      </td>
      <td className="px-3 py-3 text-right font-semibold tabular-nums text-foreground">
        {money(item.gross)}
      </td>
      <td className="px-3 py-3 text-right">
        <p
          className={cn(
            "font-bold tabular-nums",
            profit >= 0 ? PROFIT_TEXT : "text-destructive",
          )}
        >
          {signed(profit)}
        </p>
        <div className="ml-auto mt-1.5 h-1.5 w-20 overflow-hidden bg-muted">
          <div
            className={cn(
              "h-full",
              profit >= 0 ? "bg-emerald-500" : "bg-destructive",
            )}
            style={{ width: `${Math.min(100, Math.abs(marginPercent))}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
          {marginPercent.toFixed(1)}% margin
        </p>
      </td>
      <td className="px-3 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${item.freight}`}
            title="Edit charge"
            className="p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${item.freight}`}
            title="Delete charge"
            className="p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/** Inline editor. It owns its draft state, so the dialog doesn't carry six edit fields. */
function ChargeEditRow({
  item,
  baseCurrency,
  saving,
  error,
  onSave,
  onCancel,
}: {
  item: FreightItemSummary;
  baseCurrency: string;
  saving: boolean;
  error: string | null;
  onSave: (draft: ChargeDraft) => void;
  onCancel: () => void;
}) {
  const [freight, setFreight] = useState(item.freight);
  const [unit, setUnit] = useState(item.unit || "CONTAINER");
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [net, setNet] = useState(String(item.net));
  const [gross, setGross] = useState(String(item.gross));

  const currentUnit = item.unit || "CONTAINER";
  const unitOptions = COMMON_UNITS.includes(currentUnit)
    ? COMMON_UNITS
    : [currentUnit, ...COMMON_UNITS];

  return (
    <tr className="bg-primary/5">
      <td colSpan={5} className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ freight, unit, quantity, net, gross });
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              onCancel();
            }
          }}
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
                value={freight}
                onChange={(e) => setFreight(e.target.value)}
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
              <UnitSelect
                id={`edit-unit-${item.id}`}
                value={unit}
                onChange={setUnit}
                options={unitOptions}
              />
            </Field>
            <Field label="Quantity" htmlFor={`edit-qty-${item.id}`}>
              <NumberField
                id={`edit-qty-${item.id}`}
                value={quantity}
                onChange={setQuantity}
                min="0.01"
              />
            </Field>
            <Field
              label="Buy per unit"
              htmlFor={`edit-net-${item.id}`}
              className="sm:col-span-3"
            >
              <NumberField
                id={`edit-net-${item.id}`}
                value={net}
                onChange={setNet}
                suffix={baseCurrency}
              />
            </Field>
            <Field
              label="Sell per unit"
              htmlFor={`edit-gross-${item.id}`}
              className="sm:col-span-3"
            >
              <NumberField
                id={`edit-gross-${item.id}`}
                value={gross}
                onChange={setGross}
                suffix={baseCurrency}
              />
            </Field>
          </div>

          {error && <InlineError>{error}</InlineError>}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <ProfitReadout
              net={net}
              gross={gross}
              quantity={quantity}
              currency={baseCurrency}
              variant="inline"
            />
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Esc to cancel
              </span>
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !freight.trim()}>
                {saving ? (
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

/* -------------------------------------------------------------------------- */
/* Add form                                                                   */
/* -------------------------------------------------------------------------- */

function AddChargeForm({
  baseCurrency,
  isAdding,
  error,
  onSubmit,
}: {
  baseCurrency: string;
  isAdding: boolean;
  error: string | null;
  /** Resolves true when the charge was saved, so the form can reset. */
  onSubmit: (draft: ChargeDraft) => Promise<boolean>;
}) {
  const [freight, setFreight] = useState("");
  const [unit, setUnit] = useState("CONTAINER");
  const [quantity, setQuantity] = useState("1");
  const [net, setNet] = useState("");
  const [gross, setGross] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);
  const netRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await onSubmit({ freight, unit, quantity, net, gross });
    if (ok) {
      setFreight("");
      setNet("");
      setGross("");
      setQuantity("1");
      nameRef.current?.focus(); // ready for the next charge
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 self-start border border-border bg-card p-4 lg:sticky lg:top-0"
    >
      <h3 className="text-sm font-semibold text-foreground">Add a charge</h3>

      <div>
        <p className="mb-2 text-xs text-muted-foreground">Quick pick</p>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-pressed={freight === preset}
              onClick={() => {
                setFreight(preset);
                netRef.current?.focus();
              }}
              className={cn(
                "border px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                freight === preset
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
          value={freight}
          onChange={(e) => setFreight(e.target.value)}
          placeholder="e.g. Ocean Freight 40HC"
          required
          className="h-10"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Unit" htmlFor="new-unit">
          <UnitSelect
            id="new-unit"
            value={unit}
            onChange={setUnit}
            options={COMMON_UNITS}
          />
          <div className="mt-1.5 flex flex-wrap gap-1">
            {["CONTAINER", "CBM", "TON", "BL", "KG"].map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={cn(
                  "border px-1.5 py-0.5 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  unit.trim().toUpperCase() === u
                    ? "border-primary bg-primary/10 font-semibold text-primary"
                    : "border-border text-muted-foreground hover:border-primary hover:text-foreground",
                )}
              >
                {u}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Quantity" htmlFor="new-qty">
          <NumberField
            id="new-qty"
            value={quantity}
            onChange={setQuantity}
            min="0.01"
            required
          />
        </Field>
        <Field label="Buy per unit" htmlFor="new-net">
          <NumberField
            id="new-net"
            inputRef={netRef}
            value={net}
            onChange={setNet}
            placeholder="0.00"
            suffix={baseCurrency}
          />
        </Field>
        <Field label="Sell per unit" htmlFor="new-gross">
          <NumberField
            id="new-gross"
            value={gross}
            onChange={setGross}
            placeholder="0.00"
            suffix={baseCurrency}
          />
        </Field>
      </div>

      <ProfitReadout
        net={net}
        gross={gross}
        quantity={quantity}
        currency={baseCurrency}
        variant="card"
      />

      {error && <InlineError>{error}</InlineError>}

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full gap-1.5"
        disabled={isAdding || !freight.trim()}
      >
        {isAdding ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            <Plus className="size-4" />
            Add charge
          </>
        )}
      </Button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Dialog                                                                     */
/* -------------------------------------------------------------------------- */

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
        className="max-h-[90vh] w-screen max-w-7xl overflow-y-auto sm:max-w-7xl"
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
            <section className="overflow-hidden border border-border">
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Charges ({items.length})
                </h3>
                <span className="text-xs text-muted-foreground">
                  Buy and sell are per unit. Profit is the line total.
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
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border text-xs text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-4 py-2.5 font-medium">
                          Charge
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-2.5 text-right font-medium"
                        >
                          Buy / unit
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-2.5 text-right font-medium"
                        >
                          Sell / unit
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-2.5 text-right font-medium"
                        >
                          Profit
                        </th>
                        <th scope="col" className="px-3 py-2.5">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((item) =>
                        editingId === item.id ? (
                          <ChargeEditRow
                            key={item.id}
                            item={item}
                            baseCurrency={baseCurrency}
                            saving={busyId === item.id}
                            error={rowError}
                            onSave={(draft) => handleSaveEdit(item, draft)}
                            onCancel={handleCancelEdit}
                          />
                        ) : (
                          <ChargeRow
                            key={item.id}
                            item={item}
                            baseCurrency={baseCurrency}
                            onEdit={() => handleStartEdit(item)}
                            onDelete={() => setDeletingItem(item)}
                          />
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
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

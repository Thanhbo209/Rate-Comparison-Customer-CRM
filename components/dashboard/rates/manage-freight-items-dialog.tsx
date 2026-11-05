"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
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
import { FreightDeleteDialog } from "./dialogs/freight-delete-dialog";

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

/** Classification of a charge: the FreightItem.chargeType enum. */
type ChargeType = NonNullable<FreightItemSummary["chargeType"]>;

const DEFAULT_CHARGE_TYPE: ChargeType = "STANDARD";

const CHARGE_TYPE_OPTIONS: { value: ChargeType; label: string }[] = [
  { value: "STANDARD", label: "Standard" },
  { value: "EXPORT_CHARGE", label: "Export charge" },
  { value: "IMPORT_CHARGE", label: "Import charge" },
  { value: "FARE", label: "Fare" },
];

const CHARGE_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  CHARGE_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

/**
 * Sections of the quote sheet, in print order. Charges are grouped by the
 * classification the user chose. Edit the wording here.
 */
const CHARGE_SECTIONS: { type: ChargeType; title: string }[] = [
  {
    type: "EXPORT_CHARGE",
    title: "Export Charges",
  },
  { type: "FARE", title: "Ocean Freight" },
  {
    type: "IMPORT_CHARGE",
    title: "Import Charges",
  },
  { type: "STANDARD", title: "Other Charges" },
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
  chargeType: ChargeType;
  unit: string;
  quantity: string;
  net: string;
  gross: string;
}

const toPayload = (d: ChargeDraft) => ({
  freight: d.freight.trim(),
  chargeType: d.chargeType,
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

/**
 * Classification picker (FreightItem.chargeType).
 *
 * Uses the library Select, which portals its popup to the body and layers it
 * correctly above the dialog. `alignItemWithTrigger={false}` makes it open as a
 * normal dropdown under the trigger (flipping when there's no room) instead of
 * sliding the selected item over the trigger, which is what pushes a dialog
 * around when you pick an option.
 */
function ChargeTypeSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: ChargeType;
  onChange: (value: ChargeType) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(val) => {
        if (val) onChange(val as ChargeType);
      }}
    >
      <SelectTrigger
        id={id}
        className="h-10 w-full border-border bg-background text-sm"
      >
        <SelectValue placeholder="Select classification...">
          {(val: string | null) =>
            (val && CHARGE_TYPE_LABEL[val]) || "Select classification..."
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="max-h-60">
        {CHARGE_TYPE_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ───────────── Unit combobox (free text with suggestions) ───────────── */

interface ListPlacement {
  host: HTMLElement | null; // the dialog element the list is rendered into
  openUp: boolean;
  maxHeight: number;
  left: number;
  top: number;
  width: number;
}

const LIST_GAP = 4;
const LIST_MAX_HEIGHT = 224;
const LIST_MIN_HEIGHT = 96;
const VIEWPORT_MARGIN = 12;

/**
 * Decides where the list goes: below the field if it fits, otherwise above.
 *
 * The list is rendered inside the dialog (so the dialog's outside-click handling
 * treats it as part of the dialog). That means it can't be allowed to poke past
 * the dialog's own visible area when the dialog scrolls or clips, or it either
 * grows the scroll height or gets cut off. So the available space is bounded by
 * the viewport and, when the dialog clips, by the dialog's edges too.
 */
function measurePlacement(anchor: HTMLElement): ListPlacement {
  const a = anchor.getBoundingClientRect();
  const host = anchor.closest<HTMLElement>('[role="dialog"]');

  let boundsTop = VIEWPORT_MARGIN;
  let boundsBottom = window.innerHeight - VIEWPORT_MARGIN;
  let h: DOMRect | null = null;

  if (host) {
    h = host.getBoundingClientRect();
    const clips = /(auto|scroll|hidden|clip)/.test(
      getComputedStyle(host).overflowY,
    );
    if (clips) {
      boundsTop = Math.max(boundsTop, h.top + VIEWPORT_MARGIN);
      boundsBottom = Math.min(boundsBottom, h.bottom - VIEWPORT_MARGIN);
    }
  }

  const below = boundsBottom - a.bottom;
  const above = a.top - boundsTop;
  const openUp = below < LIST_MIN_HEIGHT && above > below;
  const maxHeight = Math.max(
    LIST_MIN_HEIGHT,
    Math.min(LIST_MAX_HEIGHT, (openUp ? above : below) - LIST_GAP),
  );

  if (!host || !h) {
    return { host: null, openUp, maxHeight, left: 0, top: 0, width: a.width };
  }

  return {
    host,
    openUp,
    maxHeight,
    width: a.width,
    left: a.left - h.left - host.clientLeft + host.scrollLeft,
    top:
      (openUp ? a.top - LIST_GAP : a.bottom + LIST_GAP) -
      h.top -
      host.clientTop +
      host.scrollTop,
  };
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
  const [placement, setPlacement] = useState<ListPlacement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const openList = () => {
    if (containerRef.current) {
      setPlacement(measurePlacement(containerRef.current));
    }
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;

    // The list lives outside containerRef (it's portaled), so check both.
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !listRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    let frame = 0;
    const reposition = (event?: Event) => {
      // Scrolling the list itself shouldn't move it.
      if (
        event?.target instanceof Node &&
        listRef.current?.contains(event.target)
      ) {
        return;
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (containerRef.current) {
          setPlacement(measurePlacement(containerRef.current));
        }
      });
    };

    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      cancelAnimationFrame(frame);
    };
  }, [isOpen]);

  const filteredOptions = options.filter(
    (opt) =>
      !value.trim() || opt.toLowerCase().includes(value.trim().toLowerCase()),
  );
  const displayOptions = filteredOptions.length > 0 ? filteredOptions : options;

  const list = isOpen && placement && (
    <div
      ref={listRef}
      id={`${id}-list`}
      role="listbox"
      style={
        placement.host
          ? {
              left: placement.left,
              top: placement.top,
              width: placement.width,
              maxHeight: placement.maxHeight,
              transform: placement.openUp ? "translateY(-100%)" : undefined,
            }
          : { maxHeight: placement.maxHeight }
      }
      className={cn(
        "z-100 overflow-y-auto overscroll-contain border border-border bg-popover p-1 text-popover-foreground shadow-lg",
        placement.host
          ? "absolute"
          : cn(
              "absolute left-0 w-full",
              placement.openUp ? "bottom-full mb-1" : "top-full mt-1",
            ),
      )}
    >
      <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        Existing choices
      </div>
      {displayOptions.map((u) => {
        const isSelected = value.trim().toUpperCase() === u.toUpperCase();
        return (
          <button
            key={u}
            type="button"
            role="option"
            aria-selected={isSelected}
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
  );

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
            openList();
          }}
          onFocus={openList}
          onKeyDown={(e) => {
            if (e.key === "Escape" && isOpen) {
              e.stopPropagation();
              setIsOpen(false);
            }
          }}
          placeholder="e.g. CONTAINER"
          className="h-10 w-full pr-8 text-sm uppercase"
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`${id}-list`}
        />
        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              return;
            }
            openList();
            // Don't let focusing the input scroll the dialog.
            inputRef.current?.focus({ preventScroll: true });
          }}
          tabIndex={-1}
          className="absolute right-1 flex size-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
          title="Toggle list"
          aria-label="Toggle list"
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-150",
              isOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      {list && placement?.host ? createPortal(list, placement.host) : list}
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

/** Number of columns in the sheet: Charge, Unit, Quantity, Price, Total, Profit, Actions. */
const SHEET_COLUMNS = 7;

interface ChargeGroup {
  section: (typeof CHARGE_SECTIONS)[number];
  items: FreightItemSummary[];
  sell: number;
  profit: number;
}

/** Splits charges into non-empty sections. Anything with an unknown type lands in Standard. */
function groupCharges(items: FreightItemSummary[]): ChargeGroup[] {
  const known = new Set<string>(CHARGE_SECTIONS.map((s) => s.type));
  const typeOf = (i: FreightItemSummary): string => {
    const t = i.chargeType ?? DEFAULT_CHARGE_TYPE;
    return known.has(t) ? t : DEFAULT_CHARGE_TYPE;
  };

  return CHARGE_SECTIONS.map((section) => {
    const groupItems = items.filter((i) => typeOf(i) === section.type);
    let sell = 0;
    let profit = 0;
    for (const i of groupItems) {
      sell += i.gross * i.quantity;
      profit += lineMath(i.net, i.gross, i.quantity).profit;
    }
    return { section, items: groupItems, sell, profit };
  }).filter((g) => g.items.length > 0);
}

function HeaderCell({
  en,
  align = "left",
  className,
}: {
  en: string;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-3 py-2.5 align-bottom",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      <span className="block text-xs font-semibold text-foreground">{en}</span>
    </th>
  );
}

/** Gray band that opens a section, with its subtotals aligned under the Total and Profit columns. */
function SectionBand({ group }: { group: ChargeGroup }) {
  const { section, items, sell, profit } = group;
  return (
    <tr className="bg-primary/10">
      <th scope="rowgroup" colSpan={4} className="px-4 py-2.5 text-left">
        <span className="block text-sm font-bold text-foreground">
          {section.title}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            ({items.length})
          </span>
        </span>
      </th>
      <td className="px-3 py-2.5 text-right text-sm font-semibold text-foreground tabular-nums">
        {money(sell)}
      </td>
      <td
        className={cn(
          "px-3 py-2.5 text-right text-sm font-semibold tabular-nums",
          profit >= 0 ? PROFIT_TEXT : "text-destructive",
        )}
      >
        {signed(profit)}
      </td>
      <td />
    </tr>
  );
}

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
    <tr className="transition-colors hover:bg-muted/20">
      <td className="px-4 py-3.5">
        <p className="font-medium text-foreground">{item.freight}</p>
        {hasOriginal && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Original: {money(item.originalNet)} buy /{" "}
            {money(item.originalGross)} sell ({item.originalCurrency})
          </p>
        )}
      </td>
      <td className="px-3 py-3.5 text-xs text-muted-foreground italic">
        <span className="block truncate" title={item.unit || "UNIT"}>
          {item.unit || "UNIT"}
        </span>
      </td>
      <td className="px-3 py-3.5 text-right text-foreground tabular-nums">
        {qtyFmt.format(item.quantity)}
      </td>
      <td className="px-3 py-3.5 text-right tabular-nums">
        <p className="font-medium text-foreground">{money(item.gross)}</p>
        <p
          className="mt-0.5 text-[11px] text-muted-foreground"
          title="Buying price per unit"
        >
          Buy {money(item.net)}
        </p>
      </td>
      <td className="px-3 py-3.5 text-right font-semibold text-foreground tabular-nums">
        {money(item.gross * item.quantity)}
      </td>
      <td className="px-3 py-3.5 text-right tabular-nums">
        <p
          className={cn(
            "font-semibold",
            profit >= 0 ? PROFIT_TEXT : "text-destructive",
          )}
        >
          {signed(profit)}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {marginPercent.toFixed(1)}%
        </p>
      </td>
      <td className="px-2 py-3.5 text-right">
        <div className="flex items-center justify-end gap-0.5">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${item.freight}`}
            title="Edit charge"
            className="p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${item.freight}`}
            title="Delete charge"
            className="p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/** The charges as a quotation sheet: one band per classification, a grand total at the bottom. */
function ChargeSheet({
  items,
  baseCurrency,
  editingId,
  busyId,
  rowError,
  onEdit,
  onDelete,
  onSave,
  onCancel,
}: {
  items: FreightItemSummary[];
  baseCurrency: string;
  editingId: string | null;
  busyId: string | null;
  rowError: string | null;
  onEdit: (item: FreightItemSummary) => void;
  onDelete: (item: FreightItemSummary) => void;
  onSave: (item: FreightItemSummary, draft: ChargeDraft) => void;
  onCancel: () => void;
}) {
  const groups = groupCharges(items);
  const grandSell = groups.reduce((sum, g) => sum + g.sell, 0);
  const grandProfit = groups.reduce((sum, g) => sum + g.profit, 0);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-80 table-fixed text-left text-sm">
        {/* Fixed widths keep every section's columns lined up; Charge takes the rest. */}
        <colgroup>
          <col />
          <col className="w-24" />
          <col className="w-16" />
          <col className="w-24" />
          <col className="w-28" />
          <col className="w-28" />
          <col className="w-20" />
        </colgroup>

        <thead className="border-b border-border">
          <tr>
            <HeaderCell en="Charge" className="px-4" />
            <HeaderCell en="Unit" />
            <HeaderCell en="Quantity" align="right" />
            <HeaderCell en="Price/unit" align="right" />
            <HeaderCell en="Total" align="right" />
            <HeaderCell en="Profit" align="right" />
            <th scope="col" className="px-2 py-2.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>

        {groups.map((group) => (
          <tbody
            key={group.section.type}
            className="divide-y divide-border/60 border-b border-border"
          >
            <SectionBand group={group} />
            {group.items.map((item) =>
              editingId === item.id ? (
                <ChargeEditRow
                  key={item.id}
                  item={item}
                  baseCurrency={baseCurrency}
                  saving={busyId === item.id}
                  error={rowError}
                  onSave={(draft) => onSave(item, draft)}
                  onCancel={onCancel}
                />
              ) : (
                <ChargeRow
                  key={item.id}
                  item={item}
                  baseCurrency={baseCurrency}
                  onEdit={() => onEdit(item)}
                  onDelete={() => onDelete(item)}
                />
              ),
            )}
          </tbody>
        ))}

        <tfoot>
          <tr className="bg-muted-foreground/20">
            <th scope="row" colSpan={4} className="px-4 py-3.5 text-left">
              <span className="text-sm font-bold text-foreground">
                Grand total:
              </span>
            </th>
            <td className="px-3 py-3.5 text-destructive text-right font-bold tabular-nums">
              {money(grandSell)}
            </td>

            <td className=" px-3 py-3.5 text-right tabular-nums">
              <p
                className={cn(
                  "text-sm font-bold ",
                  grandProfit >= 0 ? PROFIT_TEXT : "text-destructive",
                )}
              >
                {signed(grandProfit)}
              </p>
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** Inline editor. It owns its draft state, so the dialog doesn't carry the edit fields. */
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
  const [chargeType, setChargeType] = useState<ChargeType>(
    item.chargeType ?? DEFAULT_CHARGE_TYPE,
  );
  const [unit, setUnit] = useState(item.unit || "CONTAINER");
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [net, setNet] = useState(String(item.net));
  const [gross, setGross] = useState(String(item.gross));

  const currentUnit = item.unit || "CONTAINER";
  const unitOptions = COMMON_UNITS.includes(currentUnit)
    ? COMMON_UNITS
    : [currentUnit, ...COMMON_UNITS];

  return (
    <tr className="bg-white">
      <td colSpan={SHEET_COLUMNS} className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ freight, chargeType, unit, quantity, net, gross });
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              onCancel();
            }
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-12">
            <Field
              label="Charge"
              htmlFor={`edit-name-${item.id}`}
              className="col-span-2 sm:col-span-4"
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
              label="Classification"
              htmlFor={`edit-type-${item.id}`}
              className="col-span-2 sm:col-span-3"
            >
              <ChargeTypeSelect
                id={`edit-type-${item.id}`}
                value={chargeType}
                onChange={setChargeType}
              />
            </Field>
            <Field
              label="Unit"
              htmlFor={`edit-unit-${item.id}`}
              className="col-span-1 sm:col-span-3"
            >
              <UnitSelect
                id={`edit-unit-${item.id}`}
                value={unit}
                onChange={setUnit}
                options={unitOptions}
              />
            </Field>
            <Field
              label="Quantity"
              htmlFor={`edit-qty-${item.id}`}
              className="col-span-1 sm:col-span-2"
            >
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
              className="col-span-1 sm:col-span-6"
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
              className="col-span-1 sm:col-span-6"
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
  const [chargeType, setChargeType] = useState<ChargeType>(DEFAULT_CHARGE_TYPE);
  const [unit, setUnit] = useState("CONTAINER");
  const [quantity, setQuantity] = useState("1");
  const [net, setNet] = useState("");
  const [gross, setGross] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);
  const netRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await onSubmit({
      freight,
      chargeType,
      unit,
      quantity,
      net,
      gross,
    });
    if (ok) {
      setFreight("");
      setChargeType(DEFAULT_CHARGE_TYPE);
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
                netRef.current?.focus({ preventScroll: true });
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

      {/* Freight, then Classification, on one row (Unit follows below) */}
      <div className="grid grid-cols-5 gap-3">
        <Field label="Charge name" htmlFor="new-name" className="col-span-3">
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
        <Field label="Classification" htmlFor="new-type" className="col-span-2">
          <ChargeTypeSelect
            id="new-type"
            value={chargeType}
            onChange={setChargeType}
          />
        </Field>
      </div>

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

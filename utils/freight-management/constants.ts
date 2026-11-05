import { FreightItemSummary } from "@/lib/rate/types";

export const COMMON_PRESETS = [
  "Ocean Freight",
  "Origin THC",
  "Destination THC",
  "Customs Clearance",
  "Inland Haulage / Trucking",
  "Documentation Fee",
  "Bunker Adjustment (BAF)",
  "Port Security Fee",
];

export const COMMON_UNITS = [
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
export type ChargeType = NonNullable<FreightItemSummary["chargeType"]>;

export const DEFAULT_CHARGE_TYPE: ChargeType = "STANDARD";

export const CHARGE_TYPE_OPTIONS: { value: ChargeType; label: string }[] = [
  { value: "STANDARD", label: "Standard" },
  { value: "EXPORT_CHARGE", label: "Export charge" },
  { value: "IMPORT_CHARGE", label: "Import charge" },
  { value: "FARE", label: "Fare" },
];

export const CHARGE_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  CHARGE_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

/**
 * Sections of the quote sheet, in print order. Charges are grouped by the
 * classification the user chose. Edit the wording here.
 */
export const CHARGE_SECTIONS: { type: ChargeType; title: string }[] = [
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

export const PROFIT_TEXT = "text-emerald-600 dark:text-emerald-400";

/** What the forms hold: raw strings, parsed only when saving. */
export interface ChargeDraft {
  freight: string;
  chargeType: ChargeType;
  unit: string;
  quantity: string;
  net: string;
  gross: string;
}

export const toPayload = (d: ChargeDraft) => ({
  freight: d.freight.trim(),
  chargeType: d.chargeType,
  unit: d.unit.trim(),
  quantity: parseFloat(d.quantity) || 1,
  net: parseFloat(d.net) || 0,
  gross: parseFloat(d.gross) || 0,
});

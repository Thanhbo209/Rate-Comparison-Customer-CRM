import { FreightItemSummary } from "@/lib/rate/types";
import { CHARGE_SECTIONS, DEFAULT_CHARGE_TYPE } from "./constants";

export interface ListPlacement {
  host: HTMLElement | null; // the dialog element the list is rendered into
  openUp: boolean;
  maxHeight: number;
  left: number;
  top: number;
  width: number;
}

/** Total profit and margin for one line: profit = (sell - buy) x quantity */
export function lineMath(net: number, gross: number, quantity: number) {
  const profit = (gross - net) * quantity;
  const sell = gross * quantity;
  return { profit, marginPercent: sell > 0 ? (profit / sell) * 100 : 0 };
}

/**
 * Decides where the list goes: below the field if it fits, otherwise above.
 *
 * The list is rendered inside the dialog (so the dialog's outside-click handling
 * treats it as part of the dialog). That means it can't be allowed to poke past
 * the dialog's own visible area when the dialog scrolls or clips, or it either
 * grows the scroll height or gets cut off. So the available space is bounded by
 * the viewport and, when the dialog clips, by the dialog's edges too.
 */

export function measurePlacement(anchor: HTMLElement): ListPlacement {
  const VIEWPORT_MARGIN = 12;
  const LIST_GAP = 4;
  const LIST_MAX_HEIGHT = 224;
  const LIST_MIN_HEIGHT = 96;

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

export const moneyFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
export const qtyFmt = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3,
});

export const money = (n: number) => moneyFmt.format(n);
export const signed = (n: number) => `${n >= 0 ? "+" : ""}${money(n)}`;
export const toNum = (v: string) => parseFloat(v) || 0;

export interface ChargeGroup {
  section: (typeof CHARGE_SECTIONS)[number];
  items: FreightItemSummary[];
  sell: number;
  profit: number;
}
/** Splits charges into non-empty sections. Anything with an unknown type lands in Standard. */
export function groupCharges(items: FreightItemSummary[]): ChargeGroup[] {
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

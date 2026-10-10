/**
 * shipment-profit.tsx
 *
 * Three presentational components for displaying shipment-level profit totals
 * and rankings in the Rate Comparison view.
 *
 *   ShipmentProfitCell  – replaces the "Best for Customer" directory-table cell
 *   RatesTotalRow       – <tr> footer row for the per-shipment TABLE view
 *   RatesTotalStrip     – summary strip for the per-shipment CARD view
 */

import React from "react";
import { TrendingUp, TrendingDown, Trophy, Minus } from "lucide-react";
import type { ShipmentRankResult } from "@/lib/rate/shipment-ranking";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

function sign(n: number): string {
  return n >= 0 ? "+" : "";
}

// ─── ShipmentProfitCell ───────────────────────────────────────────────────────

interface ShipmentProfitCellProps {
  result: ShipmentRankResult | undefined;
  baseCurrency: string;
}

/**
 * Renders the "Total Profit" column cell in the shipment directory table.
 *
 *  – null rank (no rates):  shows "No rates" in muted italic
 *  – isBest:                shows emerald "Best choice" trophy badge
 *  – not best, has rank:    shows profit + "X behind best" note
 *  – only 1 shipment (comparedWith < 2): shows profit only, no badge
 */
export function ShipmentProfitCell({
  result,
  baseCurrency,
}: ShipmentProfitCellProps) {
  if (!result || result.rank === null) {
    return (
      <span className="text-muted-foreground/60 text-xs italic">No rates</span>
    );
  }

  const profitStr = `${sign(result.profit)}${fmt(result.profit)} ${baseCurrency}`;
  const marginStr = `${result.marginPercent.toFixed(1)}%`;

  return (
    <div className="flex flex-col gap-0.5">
      {/* Profit + margin */}
      <div className="inline-flex items-center gap-1.5">
        {result.profit >= 0 ? (
          <TrendingUp className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        ) : (
          <TrendingDown className="size-3.5 text-destructive shrink-0" />
        )}
        <span
          className={`font-bold text-xs ${
            result.profit >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-destructive"
          }`}
        >
          {profitStr}
        </span>
        <span className="text-[10px] text-muted-foreground font-medium">
          {marginStr}
        </span>
      </div>

      {/* Ranking badge — only when comparing ≥ 2 shipments for same customer */}
      {result.comparedWith >= 2 && result.isBest && (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 dark:text-emerald-300 w-fit">
          <Trophy className="size-2.5" />
          Best choice
        </span>
      )}

      {result.comparedWith >= 2 &&
        !result.isBest &&
        result.profitBehindBest !== null &&
        result.profitBehindBest > 0 && (
          <span className="text-[10px] text-muted-foreground pl-0.5">
            <Minus className="size-2.5 inline mr-0.5" />
            {fmt(result.profitBehindBest)} {baseCurrency} behind best
          </span>
        )}
    </div>
  );
}

// ─── RatesTotalRow ────────────────────────────────────────────────────────────

interface RatesTotalRowProps {
  result: ShipmentRankResult | undefined;
  baseCurrency: string;
  /** Total number of <td> columns in the table — used for colSpan on label cell */
  colCount?: number;
}

/**
 * A <tfoot><tr> that shows the aggregate Net / Gross / Profit totals
 * for a single shipment in the TABLE expanded view.
 *
 * The columns mirror the table view layout:
 *   Provider | Option | Net | Gross | Profit | Margin | Actions
 * Caller wraps this in <tfoot>.
 */
export function RatesTotalRow({ result, baseCurrency }: RatesTotalRowProps) {
  if (!result || result.rateCount === 0) return null;

  return (
    <tr className="border-2 border-primary bg-primary/20 text-[15px] font-semibold">
      <td colSpan={2} className="px-4 py-3 text-foreground font-semibold">
        Shipment Total ({result.rateCount}{" "}
        {result.rateCount === 1 ? "rate" : "rates"})
      </td>
      <td className="px-4 py-3 font-semibold text-destructive">
        {fmt(result.net)} {baseCurrency}
      </td>
      <td className="px-4 py-3 font-bold text-primary">
        {fmt(result.gross)} {baseCurrency}
      </td>
      <td
        className={`px-4 py-3 font-bold ${
          result.profit >= 0
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-destructive"
        }`}
      >
        {sign(result.profit)}
        {fmt(result.profit)} {baseCurrency}
      </td>
      <td className="px-4 py-3  text-foreground font-semibold">
        {result.marginPercent.toFixed(1)}%
      </td>
      <td className="px-4 py-3 text-right" />
    </tr>
  );
}

// ─── RatesTotalStrip ──────────────────────────────────────────────────────────

interface RatesTotalStripProps {
  result: ShipmentRankResult | undefined;
  baseCurrency: string;
}

/**
 * A compact horizontal summary strip shown above the card grid in the
 * CARD expanded view. Displays Net / Gross / Profit / Margin in one line,
 * plus a "Best choice" badge when applicable.
 */
export function RatesTotalStrip({
  result,
  baseCurrency,
}: RatesTotalStripProps) {
  if (!result || result.rateCount === 0) return null;

  return (
    <div className="mx-4 sm:mx-6 mt-4 rounded-xl border border-border/80 bg-primary/30 px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
      {/* Label */}
      <span className="font-semibold text-foreground shrink-0">
        Shipment Total
      </span>

      <span className="text-muted-foreground shrink-0">
        Net:{" "}
        <span className="font-semibold text-destructive">
          {fmt(result.net)} {baseCurrency}
        </span>
      </span>

      <span className="text-muted-foreground shrink-0">
        Gross:{" "}
        <span className="font-bold text-primary">
          {fmt(result.gross)} {baseCurrency}
        </span>
      </span>

      <span className="text-muted-foreground shrink-0">
        Profit:{" "}
        <span
          className={`font-bold ${
            result.profit >= 0
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-destructive"
          }`}
        >
          {sign(result.profit)}
          {fmt(result.profit)} {baseCurrency}
        </span>
      </span>

      <span className="text-muted-foreground shrink-0">
        Margin:{" "}
        <span className=" font-medium text-foreground">
          {result.marginPercent.toFixed(1)}%
        </span>
      </span>

      {result.comparedWith >= 2 && result.isBest && (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-800 dark:text-emerald-300 shrink-0">
          <Trophy className="size-2.5" />
          Best choice
        </span>
      )}

      {result.comparedWith >= 2 &&
        !result.isBest &&
        result.profitBehindBest !== null &&
        result.profitBehindBest > 0 && (
          <span className="text-[10px] text-muted-foreground italic shrink-0">
            {fmt(result.profitBehindBest)} {baseCurrency} behind best
          </span>
        )}
    </div>
  );
}

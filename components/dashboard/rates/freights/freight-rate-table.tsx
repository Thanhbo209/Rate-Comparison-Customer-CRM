import type { ReactNode } from "react";
import {
  Award,
  AlertTriangle,
  Layers,
  Pencil,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RatesTotalRow } from "@/components/dashboard/rates/components/shipment-profit";
import { rankShipments } from "@/lib/rate/shipment-ranking";
import type { ShipmentRateItem } from "@/lib/rate/types";
// Adjust to wherever RatesTotalRow lives in your project.

/* -------------------------------------------------------------------------- */
/* Types: only the fields this table reads. Replace with your real types.     */
/* -------------------------------------------------------------------------- */
type FreightItem = ShipmentRateItem["freightItems"][number];

interface Shipment {
  id: string;
  name: string;
  rates: ShipmentRateItem[];
  bestCustomerRateId?: string | null; // "Most Profit"
  bestRateId?: string | null; // "Lowest Cost"
  highestMarginRateId?: string | null; // "Top Margin"
  tieBreakUsed?: boolean;
}

export interface FreightRatesTableProps {
  shipment: Shipment;
  rankings: ReturnType<typeof rankShipments>;
  baseCurrency: string;
  onEditRate: (payload: {
    rate: ShipmentRateItem;
    shipmentName: string;
  }) => void;
  onManageItems: (rate: ShipmentRateItem, shipmentName: string) => void;
  onDeleteRate: (payload: {
    id: string;
    providerName: string;
    optionName?: string | null;
  }) => void;
}

/* -------------------------------------------------------------------------- */
/* Formatting and thresholds                                                  */
/* -------------------------------------------------------------------------- */

const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const LOW_MARGIN = 15; // below this, margin is flagged amber
const MAX_VISIBLE_CHARGES = 2;

/* -------------------------------------------------------------------------- */
/* Column layout: one source of truth for widths, alignment and grouping.     */
/* -------------------------------------------------------------------------- */

const COL = {
  // Every cell in a column shares these, so header, rows and total row line up.
  num: "px-4 py-3.5 text-right tabular-nums whitespace-nowrap",
  groupStart: "border-l border-border/70", // visual break between column groups
} as const;

/* -------------------------------------------------------------------------- */
/* Small building blocks                                                      */
/* -------------------------------------------------------------------------- */

type BadgeTone = "winner" | "cost" | "margin" | "warning";

const BADGE_TONES: Record<BadgeTone, string> = {
  winner:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30",
  cost: "bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/25",
  margin: "bg-primary/10 text-primary ring-primary/25",
  warning:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/30",
};

function RateBadge({
  tone,
  icon,
  title,
  children,
}: {
  tone: BadgeTone;
  icon: ReactNode;
  title?: string;
  children: ReactNode;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium leading-none ring-1 ring-inset",
        BADGE_TONES[tone],
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Column cells                                                               */
/* -------------------------------------------------------------------------- */

function FreightCell({
  rate,
  isWinner,
  isBestCost,
  isBestMargin,
  tieBreakUsed,
  onEdit,
}: {
  rate: ShipmentRateItem;
  isWinner: boolean;
  isBestCost: boolean;
  isBestMargin: boolean;
  tieBreakUsed?: boolean;
  onEdit: () => void;
}) {
  const hasBadges =
    isWinner ||
    (isBestCost && !isWinner) ||
    isBestMargin ||
    rate.hasMissingExchangeRate;

  return (
    <td
      className={cn(
        "px-4 py-3.5 align-top border-l-2",
        isWinner ? "border-l-emerald-500" : "border-l-transparent",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="font-heading text-base font-semibold leading-tight text-foreground">
          {rate.provider.name}
        </span>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Change provider or freight for ${rate.provider.name}`}
          title="Change provider / freight"
          className="inline-flex p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>

      {rate.optionName && (
        <p className="mt-0.5 text-[12px] font-medium text-primary">
          {rate.optionName}
        </p>
      )}

      {hasBadges && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {isWinner && (
            <RateBadge
              tone="winner"
              icon={<Award className="size-3" />}
              title="Highest total profit for this shipment"
            >
              Most profit
              {tieBreakUsed && (
                <span className="font-normal opacity-80">(tie-break)</span>
              )}
            </RateBadge>
          )}
          {isBestCost && !isWinner && (
            <RateBadge
              tone="cost"
              icon={<Wallet className="size-3" />}
              title="Lowest consolidated net cost"
            >
              Lowest cost
            </RateBadge>
          )}
          {isBestMargin && (
            <RateBadge
              tone="margin"
              icon={<TrendingUp className="size-3" />}
              title="Highest margin (profit / gross)"
            >
              Top margin
            </RateBadge>
          )}
          {rate.hasMissingExchangeRate && (
            <RateBadge
              tone="warning"
              icon={<AlertTriangle className="size-3" />}
              title={`Missing exchange rates: ${
                rate.missingCurrencies?.join(", ") || "foreign currency"
              }. Excluded from ranking.`}
            >
              Missing FX
            </RateBadge>
          )}
        </div>
      )}
    </td>
  );
}

function ChargesCell({ items }: { items: FreightItem[] }) {
  if (items.length === 0) {
    return (
      <td className={cn("px-4 py-3.5 align-top", COL.groupStart)}>
        <span className="text-xs italic text-muted-foreground">
          No charges added
        </span>
      </td>
    );
  }

  const visible = items.slice(0, MAX_VISIBLE_CHARGES);
  const hidden = items.slice(MAX_VISIBLE_CHARGES);

  return (
    <td className={cn("px-4 py-3.5 align-top", COL.groupStart)}>
      <div className="flex max-w-65 flex-wrap gap-1.5">
        {visible.map((fi) => (
          <span
            key={fi.id}
            className="inline-flex items-center bg-muted px-2 py-0.5 text-xs text-foreground"
          >
            {fi.freight}
          </span>
        ))}
        {hidden.length > 0 && (
          <span
            title={hidden.map((fi) => fi.freight).join(", ")}
            className="inline-flex items-center border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground"
          >
            +{hidden.length} more
          </span>
        )}
      </div>
    </td>
  );
}

function MoneyCell({
  value,
  tone = "neutral",
  signed = false,
  groupStart = false,
  emphasis = false,
}: {
  value: number;
  tone?: "neutral" | "profit";
  signed?: boolean;
  groupStart?: boolean;
  emphasis?: boolean;
}) {
  const isNegative = value < 0;
  const color =
    tone === "profit"
      ? isNegative
        ? "text-destructive"
        : "text-emerald-600 dark:text-emerald-400"
      : "text-foreground";

  return (
    <td
      className={cn(
        COL.num,
        "text-center text-[13px]",
        groupStart && COL.groupStart,
        emphasis ? "font-semibold" : "font-medium",
        color,
      )}
    >
      {signed && !isNegative ? "+" : ""}
      {money.format(value)}
    </td>
  );
}

function MarginCell({ percent }: { percent: number }) {
  const isNegative = percent < 0;
  const isLow = !isNegative && percent < LOW_MARGIN;
  const barWidth = Math.max(0, Math.min(100, percent));

  const text = isNegative
    ? "text-destructive"
    : isLow
      ? "text-amber-700 dark:text-amber-400"
      : "text-foreground";
  const bar = isNegative
    ? "bg-destructive"
    : isLow
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <td className={cn("px-4 py-3.5 align-top", COL.groupStart)}>
      <div className="flex flex-col items-end gap-1.5">
        <span
          className={cn("text-[13px] font-semibold tabular-nums", text)}
          title={isLow ? `Below ${LOW_MARGIN}% margin threshold` : undefined}
        >
          {percent.toFixed(1)}%
        </span>
        <div className="h-1 w-16 overflow-hidden bg-muted" role="presentation">
          <div
            className={cn("h-full ", bar)}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </td>
  );
}

function ActionsCell({
  providerName,
  onManage,
  onDelete,
}: {
  providerName: string;
  onManage: () => void;
  onDelete: () => void;
}) {
  return (
    <td className={cn("px-4 py-4 align-top", COL.groupStart)}>
      <div className="flex items-center justify-end gap-1.5">
        <Button
          size="sm"
          variant="outline"
          onClick={onManage}
          className="h-7 gap-1 px-2.5 text-xs"
        >
          <Layers className="size-3" />
          Manage items
        </Button>
        <Button
          type="button"
          variant={"ghost"}
          onClick={onDelete}
          aria-label={`Delete quote option for ${providerName}`}
          title="Delete quote option"
          className={cn(
            "p-1.5 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            // Hidden until the row is hovered or focused; always visible on touch devices.
          )}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </td>
  );
}

/* -------------------------------------------------------------------------- */
/* Row                                                                        */
/* -------------------------------------------------------------------------- */

function RateRow({
  rate,
  shipment,
  onEditRate,
  onManageItems,
  onDeleteRate,
}: { rate: ShipmentRateItem; shipment: Shipment } & Pick<
  FreightRatesTableProps,
  "onEditRate" | "onManageItems" | "onDeleteRate"
>) {
  const isWinner = rate.id === shipment.bestCustomerRateId;
  const isBestCost = rate.id === shipment.bestRateId;
  const isBestMargin = rate.id === shipment.highestMarginRateId;

  return (
    <tr
      className={cn(
        "group/row transition-colors hover:bg-muted/30",
        isWinner && "bg-emerald-500/4",
      )}
    >
      <FreightCell
        rate={rate}
        isWinner={isWinner}
        isBestCost={isBestCost}
        isBestMargin={isBestMargin}
        tieBreakUsed={shipment.tieBreakUsed}
        onEdit={() => onEditRate({ rate, shipmentName: shipment.name })}
      />
      <ChargesCell items={rate.freightItems} />

      {/* Financials group: Net / Gross / Profit / Margin */}
      <MoneyCell value={rate.consolidatedNet} groupStart />
      <MoneyCell value={rate.consolidatedGross} />
      <MoneyCell
        value={rate.consolidatedProfit}
        tone="profit"
        signed
        emphasis
      />
      <MarginCell percent={rate.consolidatedMarginPercent} />

      <ActionsCell
        providerName={rate.provider.name}
        onManage={() => onManageItems(rate, shipment.name)}
        onDelete={() =>
          onDeleteRate({
            id: rate.id,
            providerName: rate.provider.name,
            optionName: rate.optionName,
          })
        }
      />
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Table                                                                      */
/* -------------------------------------------------------------------------- */

export function FreightRatesTable({
  shipment,
  rankings,
  baseCurrency,
  onEditRate,
  onManageItems,
  onDeleteRate,
}: FreightRatesTableProps) {
  const th = "px-4 py-2.5 text-xs font-medium text-muted-foreground";

  return (
    <div className="overflow-x-auto border border-border bg-card">
      <table className="w-full min-w-230 border-collapse text-left text-xs">
        {/* Fixed widths keep numeric columns identical across every expanded shipment. */}
        <colgroup>
          <col />
          <col className="w-60" />
          <col className="w-27.5" />
          <col className="w-27.5" />
          <col className="w-30" />
          <col className="w-27.5" />
          <col className="w-47.5" />
        </colgroup>

        <thead className="border-b border-border bg-muted/40">
          {/* Column labels */}
          <tr>
            <th
              scope="col"
              className={cn(th, "bg-amber-500/20 text-foreground")}
            >
              Freight
            </th>
            <th
              scope="col"
              className={cn(
                th,
                COL.groupStart,
                "bg-amber-500/20 text-foreground",
              )}
            >
              Charges
            </th>
            <th
              scope="col"
              className={cn(
                th,
                COL.groupStart,
                "text-center bg-primary/20 text-foreground",
              )}
            >
              Net
            </th>
            <th
              scope="col"
              className={cn(th, "text-center bg-primary/20 text-foreground")}
            >
              Gross
            </th>
            <th
              scope="col"
              className={cn(th, "text-center bg-primary/20 text-foreground")}
            >
              Profit
            </th>
            <th
              scope="col"
              className={cn(
                th,
                COL.groupStart,
                "bg-primary/20 text-foreground",
              )}
              title="Margin = profit / gross"
            >
              Margin
            </th>
            <th
              scope="col"
              className={cn(
                th,
                COL.groupStart,
                "bg-destructive/20 text-foreground",
              )}
            >
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border/70">
          {shipment.rates.map((rate) => (
            <RateRow
              key={rate.id}
              rate={rate}
              shipment={shipment}
              onEditRate={onEditRate}
              onManageItems={onManageItems}
              onDeleteRate={onDeleteRate}
            />
          ))}
        </tbody>

        <tfoot className="bg-muted/40">
          <RatesTotalRow
            result={rankings.get(shipment.id)}
            baseCurrency={baseCurrency}
            colCount={7}
          />
        </tfoot>
      </table>
    </div>
  );
}

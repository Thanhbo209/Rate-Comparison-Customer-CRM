/* -------------------------------------------------------------------------- */
/* Column cells                                                               */
/* -------------------------------------------------------------------------- */

import { ShipmentRateItem } from "@/lib/rate/types";
import { cn } from "cn";
import { AlertTriangle, Award, Pencil, TrendingUp, Wallet } from "lucide-react";
import { RateBadge } from "./rate-badge";

export function FreightCell({
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

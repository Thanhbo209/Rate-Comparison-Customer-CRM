import { PROFIT_TEXT } from "@/utils/freight-management/constants";
import {
  lineMath,
  money,
  signed,
  toNum,
} from "@/utils/freight-management/helper";
import { cn } from "cn";

export function ProfitReadout({
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

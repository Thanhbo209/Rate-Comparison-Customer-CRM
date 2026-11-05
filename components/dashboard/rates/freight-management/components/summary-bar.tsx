import { money, signed } from "@/utils/freight-management/helper";
import { Metric } from "./metric";
import { cn } from "cn";

export function SummaryBar({
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

import { cn } from "cn";
import { COL } from "./charge-cell";
const LOW_MARGIN = 15;

export function MarginCell({ percent }: { percent: number }) {
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

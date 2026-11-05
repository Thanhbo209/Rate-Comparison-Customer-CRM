import { cn } from "cn";
import { COL } from "./charge-cell";

const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function MoneyCell({
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

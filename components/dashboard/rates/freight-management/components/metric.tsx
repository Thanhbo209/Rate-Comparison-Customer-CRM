import { PROFIT_TEXT } from "@/utils/freight-management/constants";
import { cn } from "cn";

export function Metric({
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

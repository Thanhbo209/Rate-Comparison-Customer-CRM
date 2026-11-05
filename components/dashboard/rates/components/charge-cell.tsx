import { ShipmentRateItem } from "@/lib/rate/types";
import { cn } from "cn";

type FreightItem = ShipmentRateItem["freightItems"][number];

export const COL = {
  // Every cell in a column shares these, so header, rows and total row line up.
  num: "px-4 py-3.5 text-right tabular-nums whitespace-nowrap",
  groupStart: "border-l border-border/70", // visual break between column groups
} as const;

export function ChargesCell({ items }: { items: FreightItem[] }) {
  if (items.length === 0) {
    return (
      <td className={cn("px-4 py-3.5 align-top", COL.groupStart)}>
        <span className="text-xs italic text-muted-foreground">
          No charges added
        </span>
      </td>
    );
  }
  const MAX_VISIBLE_CHARGES = 2;

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

import { FreightItemSummary } from "@/lib/rate/types";
import { PROFIT_TEXT } from "@/utils/freight-management/constants";
import {
  lineMath,
  money,
  qtyFmt,
  signed,
} from "@/utils/freight-management/helper";
import { cn } from "cn";
import { Pencil, Trash2 } from "lucide-react";

export function ChargeRow({
  item,
  baseCurrency,
  onEdit,
  onDelete,
}: {
  item: FreightItemSummary;
  baseCurrency: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { profit, marginPercent } = lineMath(
    item.net,
    item.gross,
    item.quantity,
  );
  const hasOriginal =
    item.originalCurrency && item.originalCurrency !== baseCurrency;

  return (
    <tr className="transition-colors hover:bg-muted/20">
      <td className="px-4 py-3.5">
        <p className="font-medium text-foreground">{item.freight}</p>
        {hasOriginal && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Original: {money(item.originalNet)} buy /{" "}
            {money(item.originalGross)} sell ({item.originalCurrency})
          </p>
        )}
      </td>
      <td className="px-3 py-3.5 text-xs text-muted-foreground italic">
        <span className="block truncate" title={item.unit || "UNIT"}>
          {item.unit || "UNIT"}
        </span>
      </td>
      <td className="px-3 py-3.5 text-right text-foreground tabular-nums">
        {qtyFmt.format(item.quantity)}
      </td>
      <td className="px-3 py-3.5 text-right tabular-nums">
        <p className="font-medium text-foreground">{money(item.gross)}</p>
        <p
          className="mt-0.5 text-[11px] text-muted-foreground"
          title="Buying price per unit"
        >
          Buy {money(item.net)}
        </p>
      </td>
      <td className="px-3 py-3.5 text-right font-semibold text-foreground tabular-nums">
        {money(item.gross * item.quantity)}
      </td>
      <td className="px-3 py-3.5 text-right tabular-nums">
        <p
          className={cn(
            "font-semibold",
            profit >= 0 ? PROFIT_TEXT : "text-destructive",
          )}
        >
          {signed(profit)}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {marginPercent.toFixed(1)}%
        </p>
      </td>
      <td className="px-2 py-3.5 text-right">
        <div className="flex items-center justify-end gap-0.5">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${item.freight}`}
            title="Edit charge"
            className="p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${item.freight}`}
            title="Delete charge"
            className="p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

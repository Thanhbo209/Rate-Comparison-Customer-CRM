import { PROFIT_TEXT } from "@/utils/freight-management/constants";
import { ChargeGroup, money, signed } from "@/utils/freight-management/helper";
import { cn } from "cn";

/** Gray band that opens a section, with its subtotals aligned under the Total and Profit columns. */
export function SectionBand({ group }: { group: ChargeGroup }) {
  const { section, items, sell, profit } = group;
  return (
    <tr className="bg-primary/10">
      <th scope="rowgroup" colSpan={4} className="px-4 py-2.5 text-left">
        <span className="block text-sm font-bold text-foreground">
          {section.title}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            ({items.length})
          </span>
        </span>
      </th>
      <td className="px-3 py-2.5 text-right text-sm font-semibold text-foreground tabular-nums">
        {money(sell)}
      </td>
      <td
        className={cn(
          "px-3 py-2.5 text-right text-sm font-semibold tabular-nums",
          profit >= 0 ? PROFIT_TEXT : "text-destructive",
        )}
      >
        {signed(profit)}
      </td>
      <td />
    </tr>
  );
}

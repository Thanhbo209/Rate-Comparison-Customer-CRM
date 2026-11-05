import { ShipmentRankResult } from "@/lib/rate/shipment-ranking";
import { fmt, sign } from "@/utils/shipments/helper";

interface RatesTotalRowProps {
  result: ShipmentRankResult | undefined;
  baseCurrency: string;
  /** Total number of <td> columns in the table — used for colSpan on label cell */
  colCount?: number;
}

/**
 * A <tfoot><tr> that shows the aggregate Net / Gross / Profit totals
 * for a single shipment in the TABLE expanded view.
 *
 * The columns mirror the table view layout:
 *   Provider | Option | Net | Gross | Profit | Margin | Actions
 * Caller wraps this in <tfoot>.
 */
export function RatesTotalRow({ result, baseCurrency }: RatesTotalRowProps) {
  if (!result || result.rateCount === 0) return null;

  return (
    <tr className="bg-sky-100/80 text-[12px] font-semibold ">
      <td colSpan={2} className="px-4 py-3 text-foreground font-semibold ">
        Shipment Total ({result.rateCount}{" "}
        {result.rateCount === 1 ? "rate" : "rates"})
      </td>
      <td className="px-4 py-3 font-semibold text-destructive text-center">
        {fmt(result.net)} {baseCurrency}
      </td>
      <td className="px-4 py-3 font-bold text-primary text-center">
        {fmt(result.gross)} {baseCurrency}
      </td>
      <td
        className={`px-4 py-3 font-bold text-center ${
          result.profit >= 0
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-destructive"
        }`}
      >
        {sign(result.profit)}
        {fmt(result.profit)} {baseCurrency}
      </td>
      <td className="px-4 py-3  text-foreground font-semibold text-center">
        {result.marginPercent.toFixed(1)}%
      </td>
      <td className="px-4 py-3 text-right" />
    </tr>
  );
}

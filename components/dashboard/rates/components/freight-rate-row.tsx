/* -------------------------------------------------------------------------- */
/* Row                                                                        */
/* -------------------------------------------------------------------------- */

import { FreightRatesTableProps } from "../freight-rate-table";
import { cn } from "cn";
import { ShipmentRateItem } from "@/lib/rate/types";
import { FreightCell } from "./freight-cell";
import { ChargesCell } from "./charge-cell";
import { MoneyCell } from "./money-cell";
import { ActionsCell } from "./action-cell";
import { MarginCell } from "./margin-celll";

interface Shipment {
  id: string;
  name: string;
  rates: ShipmentRateItem[];
  bestCustomerRateId?: string | null; // "Most Profit"
  bestRateId?: string | null; // "Lowest Cost"
  highestMarginRateId?: string | null; // "Top Margin"
  tieBreakUsed?: boolean;
}

export function RateRow({
  rate,
  shipment,
  onEditRate,
  onManageItems,
  onDeleteRate,
}: { rate: ShipmentRateItem; shipment: Shipment } & Pick<
  FreightRatesTableProps,
  "onEditRate" | "onManageItems" | "onDeleteRate"
>) {
  const isWinner = rate.id === shipment.bestCustomerRateId;
  const isBestCost = rate.id === shipment.bestRateId;
  const isBestMargin = rate.id === shipment.highestMarginRateId;

  return (
    <tr
      className={cn(
        "group/row transition-colors hover:bg-muted/30",
        isWinner && "bg-emerald-500/4",
      )}
    >
      <FreightCell
        rate={rate}
        isWinner={isWinner}
        isBestCost={isBestCost}
        isBestMargin={isBestMargin}
        tieBreakUsed={shipment.tieBreakUsed}
        onEdit={() => onEditRate({ rate, shipmentName: shipment.name })}
      />
      <ChargesCell items={rate.freightItems} />

      {/* Financials group: Net / Gross / Profit / Margin */}
      <MoneyCell value={rate.consolidatedNet} groupStart />
      <MoneyCell value={rate.consolidatedGross} />
      <MoneyCell
        value={rate.consolidatedProfit}
        tone="profit"
        signed
        emphasis
      />
      <MarginCell percent={rate.consolidatedMarginPercent} />

      <ActionsCell
        providerName={rate.provider.name}
        onManage={() => onManageItems(rate, shipment.name)}
        onDelete={() =>
          onDeleteRate({
            id: rate.id,
            providerName: rate.provider.name,
            optionName: rate.optionName,
          })
        }
      />
    </tr>
  );
}

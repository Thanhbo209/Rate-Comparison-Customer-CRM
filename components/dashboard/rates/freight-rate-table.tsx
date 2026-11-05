import { cn } from "@/lib/utils";
import { rankShipments } from "@/lib/rate/shipment-ranking";
import type { ShipmentRateItem } from "@/lib/rate/types";
import { RatesTotalRow } from "./components/rate-total-row";
import { COL } from "./components/charge-cell";
import { RateRow } from "./components/freight-rate-row";

interface Shipment {
  id: string;
  name: string;
  rates: ShipmentRateItem[];
  bestCustomerRateId?: string | null; // "Most Profit"
  bestRateId?: string | null; // "Lowest Cost"
  highestMarginRateId?: string | null; // "Top Margin"
  tieBreakUsed?: boolean;
}

export interface FreightRatesTableProps {
  shipment: Shipment;
  rankings: ReturnType<typeof rankShipments>;
  baseCurrency: string;
  onEditRate: (payload: {
    rate: ShipmentRateItem;
    shipmentName: string;
  }) => void;
  onManageItems: (rate: ShipmentRateItem, shipmentName: string) => void;
  onDeleteRate: (payload: {
    id: string;
    providerName: string;
    optionName?: string | null;
  }) => void;
}

export function FreightRatesTable({
  shipment,
  rankings,
  baseCurrency,
  onEditRate,
  onManageItems,
  onDeleteRate,
}: FreightRatesTableProps) {
  const th = "px-4 py-2.5 text-xs font-medium text-muted-foreground";

  return (
    <div className="overflow-x-auto border border-border bg-card">
      <table className="w-full min-w-230 border-collapse text-left text-xs">
        {/* Fixed widths keep numeric columns identical across every expanded shipment. */}
        <colgroup>
          <col />
          <col className="w-60" />
          <col className="w-27.5" />
          <col className="w-27.5" />
          <col className="w-30" />
          <col className="w-27.5" />
          <col className="w-47.5" />
        </colgroup>

        <thead className="border-b border-border bg-muted/40">
          {/* Column labels */}
          <tr>
            <th
              scope="col"
              className={cn(th, "bg-amber-500/20 text-foreground")}
            >
              Freight
            </th>
            <th
              scope="col"
              className={cn(
                th,
                COL.groupStart,
                "bg-amber-500/20 text-foreground",
              )}
            >
              Charges
            </th>
            <th
              scope="col"
              className={cn(
                th,
                COL.groupStart,
                "text-center bg-primary/20 text-foreground",
              )}
            >
              Net
            </th>
            <th
              scope="col"
              className={cn(th, "text-center bg-primary/20 text-foreground")}
            >
              Gross
            </th>
            <th
              scope="col"
              className={cn(th, "text-center bg-primary/20 text-foreground")}
            >
              Profit
            </th>
            <th
              scope="col"
              className={cn(
                th,
                COL.groupStart,
                "bg-primary/20 text-foreground",
              )}
              title="Margin = profit / gross"
            >
              Margin
            </th>
            <th
              scope="col"
              className={cn(
                th,
                COL.groupStart,
                "bg-destructive/20 text-foreground",
              )}
            >
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border/70">
          {shipment.rates.map((rate) => (
            <RateRow
              key={rate.id}
              rate={rate}
              shipment={shipment}
              onEditRate={onEditRate}
              onManageItems={onManageItems}
              onDeleteRate={onDeleteRate}
            />
          ))}
        </tbody>

        <tfoot className="bg-muted/40">
          <RatesTotalRow
            result={rankings.get(shipment.id)}
            baseCurrency={baseCurrency}
            colCount={7}
          />
        </tfoot>
      </table>
    </div>
  );
}

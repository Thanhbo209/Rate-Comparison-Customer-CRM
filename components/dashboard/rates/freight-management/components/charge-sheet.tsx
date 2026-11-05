import { FreightItemSummary } from "@/lib/rate/types";
import { ChargeDraft, PROFIT_TEXT } from "@/utils/freight-management/constants";
import { groupCharges, money, signed } from "@/utils/freight-management/helper";
import { HeaderCell } from "./header-cell";
import { SectionBand } from "./section-band";
import { cn } from "cn";
import { ChargeEditRow } from "./charge-edit-row";
import { ChargeRow } from "./charge-row";

/** The charges as a quotation sheet: one band per classification, a grand total at the bottom. */
export function ChargeSheet({
  items,
  baseCurrency,
  editingId,
  busyId,
  rowError,
  onEdit,
  onDelete,
  onSave,
  onCancel,
}: {
  items: FreightItemSummary[];
  baseCurrency: string;
  editingId: string | null;
  busyId: string | null;
  rowError: string | null;
  onEdit: (item: FreightItemSummary) => void;
  onDelete: (item: FreightItemSummary) => void;
  onSave: (item: FreightItemSummary, draft: ChargeDraft) => void;
  onCancel: () => void;
}) {
  const groups = groupCharges(items);
  const grandSell = groups.reduce((sum, g) => sum + g.sell, 0);
  const grandProfit = groups.reduce((sum, g) => sum + g.profit, 0);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-80 table-fixed text-left text-sm">
        {/* Fixed widths keep every section's columns lined up; Charge takes the rest. */}
        <colgroup>
          <col />
          <col className="w-24" />
          <col className="w-16" />
          <col className="w-24" />
          <col className="w-28" />
          <col className="w-28" />
          <col className="w-20" />
        </colgroup>

        <thead className="border-b border-border">
          <tr>
            <HeaderCell en="Charge" className="px-4" />
            <HeaderCell en="Unit" />
            <HeaderCell en="Quantity" align="right" />
            <HeaderCell en="Price/unit" align="right" />
            <HeaderCell en="Total" align="right" />
            <HeaderCell en="Profit" align="right" />
            <th scope="col" className="px-2 py-2.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>

        {groups.map((group) => (
          <tbody
            key={group.section.type}
            className="divide-y divide-border/60 border-b border-border"
          >
            <SectionBand group={group} />
            {group.items.map((item) =>
              editingId === item.id ? (
                <ChargeEditRow
                  key={item.id}
                  item={item}
                  baseCurrency={baseCurrency}
                  saving={busyId === item.id}
                  error={rowError}
                  onSave={(draft) => onSave(item, draft)}
                  onCancel={onCancel}
                />
              ) : (
                <ChargeRow
                  key={item.id}
                  item={item}
                  baseCurrency={baseCurrency}
                  onEdit={() => onEdit(item)}
                  onDelete={() => onDelete(item)}
                />
              ),
            )}
          </tbody>
        ))}

        <tfoot>
          <tr className="bg-muted-foreground/20">
            <th scope="row" colSpan={4} className="px-4 py-3.5 text-left">
              <span className="text-sm font-bold text-foreground">
                Grand total:
              </span>
            </th>
            <td className="px-3 py-3.5 text-destructive text-right font-bold tabular-nums">
              {money(grandSell)}
            </td>

            <td className=" px-3 py-3.5 text-right tabular-nums">
              <p
                className={cn(
                  "text-sm font-bold ",
                  grandProfit >= 0 ? PROFIT_TEXT : "text-destructive",
                )}
              >
                {signed(grandProfit)}
              </p>
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

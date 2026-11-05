"use client";

import { Field } from "@/components/ui/field";
import { FreightItemSummary } from "@/lib/rate/types";
import {
  ChargeDraft,
  ChargeType,
  COMMON_UNITS,
  DEFAULT_CHARGE_TYPE,
} from "@/utils/freight-management/constants";
import { useState } from "react";
import { ChargeTypeSelect } from "./charge-select";
import { UnitSelect } from "./unit-select";
import { NumberField } from "@/components/ui/number-input";
import { InlineError } from "./inline-error";
import { ProfitReadout } from "./profit-readout";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

/** Inline editor. It owns its draft state, so the dialog doesn't carry the edit fields. */
export function ChargeEditRow({
  item,
  baseCurrency,
  saving,
  error,
  onSave,
  onCancel,
}: {
  item: FreightItemSummary;
  baseCurrency: string;
  saving: boolean;
  error: string | null;
  onSave: (draft: ChargeDraft) => void;
  onCancel: () => void;
}) {
  const [freight, setFreight] = useState(item.freight);
  const [chargeType, setChargeType] = useState<ChargeType>(
    item.chargeType ?? DEFAULT_CHARGE_TYPE,
  );
  const [unit, setUnit] = useState(item.unit || "CONTAINER");
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [net, setNet] = useState(String(item.net));
  const [gross, setGross] = useState(String(item.gross));

  const SHEET_COLUMNS = 7;
  const currentUnit = item.unit || "CONTAINER";
  const unitOptions = COMMON_UNITS.includes(currentUnit)
    ? COMMON_UNITS
    : [currentUnit, ...COMMON_UNITS];

  return (
    <tr className="bg-white">
      <td colSpan={SHEET_COLUMNS} className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ freight, chargeType, unit, quantity, net, gross });
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              onCancel();
            }
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-12">
            <Field
              label="Charge"
              htmlFor={`edit-name-${item.id}`}
              className="col-span-2 sm:col-span-4"
            >
              <Input
                id={`edit-name-${item.id}`}
                value={freight}
                onChange={(e) => setFreight(e.target.value)}
                required
                autoFocus
                className="h-10"
              />
            </Field>
            <Field
              label="Classification"
              htmlFor={`edit-type-${item.id}`}
              className="col-span-2 sm:col-span-3"
            >
              <ChargeTypeSelect
                id={`edit-type-${item.id}`}
                value={chargeType}
                onChange={setChargeType}
              />
            </Field>
            <Field
              label="Unit"
              htmlFor={`edit-unit-${item.id}`}
              className="col-span-1 sm:col-span-3"
            >
              <UnitSelect
                id={`edit-unit-${item.id}`}
                value={unit}
                onChange={setUnit}
                options={unitOptions}
              />
            </Field>
            <Field
              label="Quantity"
              htmlFor={`edit-qty-${item.id}`}
              className="col-span-1 sm:col-span-2"
            >
              <NumberField
                id={`edit-qty-${item.id}`}
                value={quantity}
                onChange={setQuantity}
                min="0.01"
              />
            </Field>
            <Field
              label="Buy per unit"
              htmlFor={`edit-net-${item.id}`}
              className="col-span-1 sm:col-span-6"
            >
              <NumberField
                id={`edit-net-${item.id}`}
                value={net}
                onChange={setNet}
                suffix={baseCurrency}
              />
            </Field>
            <Field
              label="Sell per unit"
              htmlFor={`edit-gross-${item.id}`}
              className="col-span-1 sm:col-span-6"
            >
              <NumberField
                id={`edit-gross-${item.id}`}
                value={gross}
                onChange={setGross}
                suffix={baseCurrency}
              />
            </Field>
          </div>

          {error && <InlineError>{error}</InlineError>}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <ProfitReadout
              net={net}
              gross={gross}
              quantity={quantity}
              currency={baseCurrency}
              variant="inline"
            />
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Esc to cancel
              </span>
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !freight.trim()}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </div>
        </form>
      </td>
    </tr>
  );
}

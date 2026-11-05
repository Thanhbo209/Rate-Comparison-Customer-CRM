"use client";

import {
  ChargeDraft,
  ChargeType,
  COMMON_PRESETS,
  COMMON_UNITS,
  DEFAULT_CHARGE_TYPE,
} from "@/utils/freight-management/constants";
import { cn } from "cn";
import { FormEvent, useRef, useState } from "react";
import { Field } from "../ui/field";
import { Input } from "../ui/input";
import { ChargeTypeSelect } from "../dashboard/rates/freight-management/components/charge-select";
import { UnitSelect } from "../dashboard/rates/freight-management/components/unit-select";
import { NumberField } from "../ui/number-input";
import { ProfitReadout } from "../dashboard/rates/freight-management/components/profit-readout";
import { InlineError } from "../dashboard/rates/freight-management/components/inline-error";
import { Button } from "../ui/button";
import { Loader2, Plus } from "lucide-react";

export function AddChargeForm({
  baseCurrency,
  isAdding,
  error,
  onSubmit,
}: {
  baseCurrency: string;
  isAdding: boolean;
  error: string | null;
  /** Resolves true when the charge was saved, so the form can reset. */
  onSubmit: (draft: ChargeDraft) => Promise<boolean>;
}) {
  const [freight, setFreight] = useState("");
  const [chargeType, setChargeType] = useState<ChargeType>(DEFAULT_CHARGE_TYPE);
  const [unit, setUnit] = useState("CONTAINER");
  const [quantity, setQuantity] = useState("1");
  const [net, setNet] = useState("");
  const [gross, setGross] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);
  const netRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await onSubmit({
      freight,
      chargeType,
      unit,
      quantity,
      net,
      gross,
    });
    if (ok) {
      setFreight("");
      setChargeType(DEFAULT_CHARGE_TYPE);
      setNet("");
      setGross("");
      setQuantity("1");
      nameRef.current?.focus(); // ready for the next charge
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 self-start border border-border bg-card p-4 lg:sticky lg:top-0"
    >
      <h3 className="text-sm font-semibold text-foreground">Add a charge</h3>

      <div>
        <p className="mb-2 text-xs text-muted-foreground">Quick pick</p>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-pressed={freight === preset}
              onClick={() => {
                setFreight(preset);
                netRef.current?.focus({ preventScroll: true });
              }}
              className={cn(
                "border px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                freight === preset
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-foreground",
              )}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Freight, then Classification, on one row (Unit follows below) */}
      <div className="grid grid-cols-5 gap-3">
        <Field label="Charge name" htmlFor="new-name" className="col-span-3">
          <Input
            id="new-name"
            ref={nameRef}
            value={freight}
            onChange={(e) => setFreight(e.target.value)}
            placeholder="e.g. Ocean Freight 40HC"
            required
            className="h-10"
          />
        </Field>
        <Field label="Classification" htmlFor="new-type" className="col-span-2">
          <ChargeTypeSelect
            id="new-type"
            value={chargeType}
            onChange={setChargeType}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Unit" htmlFor="new-unit">
          <UnitSelect
            id="new-unit"
            value={unit}
            onChange={setUnit}
            options={COMMON_UNITS}
          />
          <div className="mt-1.5 flex flex-wrap gap-1">
            {["CONTAINER", "CBM", "TON", "BL", "KG"].map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={cn(
                  "border px-1.5 py-0.5 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  unit.trim().toUpperCase() === u
                    ? "border-primary bg-primary/10 font-semibold text-primary"
                    : "border-border text-muted-foreground hover:border-primary hover:text-foreground",
                )}
              >
                {u}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Quantity" htmlFor="new-qty">
          <NumberField
            id="new-qty"
            value={quantity}
            onChange={setQuantity}
            min="0.01"
            required
          />
        </Field>
        <Field label="Buy per unit" htmlFor="new-net">
          <NumberField
            id="new-net"
            inputRef={netRef}
            value={net}
            onChange={setNet}
            placeholder="0.00"
            suffix={baseCurrency}
          />
        </Field>
        <Field label="Sell per unit" htmlFor="new-gross">
          <NumberField
            id="new-gross"
            value={gross}
            onChange={setGross}
            placeholder="0.00"
            suffix={baseCurrency}
          />
        </Field>
      </div>

      <ProfitReadout
        net={net}
        gross={gross}
        quantity={quantity}
        currency={baseCurrency}
        variant="card"
      />

      {error && <InlineError>{error}</InlineError>}

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full gap-1.5"
        disabled={isAdding || !freight.trim()}
      >
        {isAdding ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            <Plus className="size-4" />
            Add charge
          </>
        )}
      </Button>
    </form>
  );
}

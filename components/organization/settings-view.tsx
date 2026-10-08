"use client";

import React, { useState, useTransition } from "react";
import {
  Coins,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Building2,
  Globe,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  updateOrganizationCurrencyAction,
  upsertExchangeRateAction,
  deleteExchangeRateAction,
} from "@/lib/organization/settings-actions";
import type { OrganizationSettingsData } from "@/lib/organization/settings-queries";

const COMMON_CURRENCIES = ["USD", "VND", "EUR", "CNY", "JPY", "SGD", "GBP", "THB"];

interface OrganizationSettingsViewProps {
  initialData: OrganizationSettingsData;
}

export function OrganizationSettingsView({ initialData }: OrganizationSettingsViewProps) {
  const [baseCurrency, setBaseCurrency] = useState(
    initialData.organization.baseCurrency || "USD"
  );
  const [exchangeRates, setExchangeRates] = useState(initialData.exchangeRates);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // New exchange rate form
  const [fromCurr, setFromCurr] = useState("VND");
  const [toCurr, setToCurr] = useState(initialData.organization.baseCurrency || "USD");
  const [rateValue, setRateValue] = useState("");

  const handleSaveBaseCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    startTransition(async () => {
      const res = await updateOrganizationCurrencyAction({ baseCurrency });
      if (!res.success) {
        setErrorMessage(res.error || "Failed to update base currency.");
      } else {
        setSuccessMessage("Base currency updated successfully! All rate comparisons will automatically recalculate into this currency.");
      }
    });
  };

  const handleAddExchangeRate = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const numeric = parseFloat(rateValue);
    if (!numeric || numeric <= 0) {
      setErrorMessage("Please enter a valid exchange rate greater than 0.");
      return;
    }

    startTransition(async () => {
      const res = await upsertExchangeRateAction({
        fromCurrency: fromCurr,
        toCurrency: toCurr,
        rate: numeric,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to add exchange rate.");
      } else {
        setSuccessMessage(`Exchange rate for ${fromCurr} → ${toCurr} saved.`);
        setExchangeRates((prev) => {
          const filtered = prev.filter(
            (r) => !(r.fromCurrency === fromCurr && r.toCurrency === toCurr)
          );
          return [
            ...filtered,
            {
              id: res.data?.id || String(Date.now()),
              fromCurrency: fromCurr,
              toCurrency: toCurr,
              rate: numeric,
              updatedAt: new Date(),
            },
          ];
        });
        setRateValue("");
      }
    });
  };

  const handleDeleteExchangeRate = (id: string, from: string, to: string) => {
    if (!confirm(`Delete exchange rate for ${from} → ${to}?`)) return;
    setSuccessMessage(null);
    setErrorMessage(null);

    startTransition(async () => {
      const res = await deleteExchangeRateAction({ id });
      if (!res.success) {
        setErrorMessage(res.error || "Failed to delete exchange rate.");
      } else {
        setExchangeRates((prev) => prev.filter((r) => r.id !== id));
        setSuccessMessage(`Exchange rate for ${from} → ${to} removed.`);
      }
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Organization Settings
          </h1>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            Financial & Currency
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Configure default base currency and exchange rates. Freight rate comparisons will automatically convert mixed carrier charges into your base currency.
        </p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-medium text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Section 1: Base Currency */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Coins className="size-4 text-primary" />
              <h2 className="font-heading text-base font-semibold text-foreground">
                Organization Base Currency
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              The primary currency in which total buying costs, selling quotations, and profit margins are consolidated and compared.
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-mono font-bold text-foreground">
            Current: {initialData.organization.baseCurrency}
          </div>
        </div>

        <form onSubmit={handleSaveBaseCurrency} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Select Base Currency
              </label>
              <select
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                disabled={!initialData.canEdit || isPending}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden disabled:opacity-50"
              >
                {COMMON_CURRENCIES.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr} — {curr === "USD" ? "US Dollar" : curr === "VND" ? "Vietnamese Dong" : curr === "EUR" ? "Euro" : curr === "CNY" ? "Chinese Yuan" : curr}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              {initialData.canEdit && (
                <button
                  type="submit"
                  disabled={isPending || baseCurrency === initialData.organization.baseCurrency}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-xs"
                >
                  {isPending && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Save Base Currency</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Section 2: Exchange Rates & Automatic Calculation */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="size-4 text-primary" />
            <h2 className="font-heading text-base font-semibold text-foreground">
              Exchange Rates & Automatic Conversion
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Define conversion multipliers for charges quoted in foreign currencies (e.g., local trucking in VND or ocean freight in USD). Total rates are automatically calculated into your base currency.
          </p>
        </div>

        {/* Existing Rates Table */}
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Conversion Pair</th>
                <th className="px-4 py-3">Multiplier / Rate</th>
                <th className="px-4 py-3">Formula Example</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {exchangeRates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No custom exchange rates configured yet. Rates in non-base currencies will use a 1:1 fallback until defined.
                  </td>
                </tr>
              ) : (
                exchangeRates.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2">
                      <span className="rounded-md bg-muted px-2 py-0.5 font-mono">
                        {r.fromCurrency}
                      </span>
                      <ArrowRightLeft className="size-3 text-muted-foreground" />
                      <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5 font-mono">
                        {r.toCurrency}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-foreground">
                      {r.rate.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                      1 {r.fromCurrency} = {r.rate.toLocaleString()} {r.toCurrency}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {initialData.canEdit && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteExchangeRate(r.id, r.fromCurrency, r.toCurrency)
                          }
                          disabled={isPending}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          title="Remove rate"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add/Update Exchange Rate Form */}
        {initialData.canEdit && (
          <form onSubmit={handleAddExchangeRate} className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-4">
            <h3 className="font-heading text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Plus className="size-3.5 text-primary" />
              Add or Update Currency Exchange Rate
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  From Currency
                </label>
                <select
                  value={fromCurr}
                  onChange={(e) => setFromCurr(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-hidden"
                >
                  {COMMON_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  To Currency
                </label>
                <select
                  value={toCurr}
                  onChange={(e) => setToCurr(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-hidden"
                >
                  {COMMON_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Rate / Multiplier
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 0.000039 or 25400"
                  value={rateValue}
                  onChange={(e) => setRateValue(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isPending || !rateValue}
                  className="w-full inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-xs"
                >
                  {isPending && <Loader2 className="size-3 animate-spin" />}
                  <span>Save Rate</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground italic">
              Example: If base currency is USD and local charges are in VND, set From: <strong>VND</strong>, To: <strong>USD</strong> with rate: <strong>0.000039</strong> (or 1 / 25,400).
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

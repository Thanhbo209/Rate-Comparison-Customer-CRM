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
  User,
  ShieldCheck,
  Mail,
  Calendar,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import {
  updateOrganizationCurrencyAction,
  updateOrganizationNameAction,
  upsertExchangeRateAction,
  deleteExchangeRateAction,
} from "@/lib/organization/settings-actions";
import { updateUserProfileAction } from "@/lib/user/actions";
import type {
  OrganizationSettingsData,
  ExchangeRateItem,
} from "@/lib/organization/settings-queries";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";

const COMMON_CURRENCIES = [
  "USD",
  "VND",
  "EUR",
  "CNY",
  "JPY",
  "SGD",
  "GBP",
  "THB",
];

const CURRENCY_DETAILS: Record<string, { label: string; symbol: string }> = {
  USD: { label: "US Dollar", symbol: "$" },
  VND: { label: "Vietnamese Dong", symbol: "₫" },
  EUR: { label: "Euro", symbol: "€" },
  CNY: { label: "Chinese Yuan", symbol: "¥" },
  JPY: { label: "Japanese Yen", symbol: "¥" },
  SGD: { label: "Singapore Dollar", symbol: "S$" },
  GBP: { label: "British Pound", symbol: "£" },
  THB: { label: "Thai Baht", symbol: "฿" },
};

interface OrganizationSettingsViewProps {
  initialData: OrganizationSettingsData;
}

export function OrganizationSettingsView({
  initialData,
}: OrganizationSettingsViewProps) {
  // ── Profile State ──────────────────────────────────────────────────────────
  const [userName, setUserName] = useState(initialData.user.name);
  const [savedUserName, setSavedUserName] = useState(initialData.user.name);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isPendingProfile, startProfileTransition] = useTransition();

  // ── Organization State ─────────────────────────────────────────────────────
  const [orgName, setOrgName] = useState(initialData.organization.name);
  const [savedOrgName, setSavedOrgName] = useState(
    initialData.organization.name,
  );
  const [orgSuccess, setOrgSuccess] = useState<string | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [isPendingOrg, startOrgTransition] = useTransition();
  const [copiedOrgId, setCopiedOrgId] = useState(false);

  // ── Base Currency State ────────────────────────────────────────────────────
  const [baseCurrency, setBaseCurrency] = useState(
    initialData.organization.baseCurrency || "USD",
  );
  const [savedCurrency, setSavedCurrency] = useState(
    initialData.organization.baseCurrency || "USD",
  );
  const [currencySuccess, setCurrencySuccess] = useState<string | null>(null);
  const [currencyError, setCurrencyError] = useState<string | null>(null);
  const [isPendingCurrency, startCurrencyTransition] = useTransition();

  // ── Exchange Rates State ───────────────────────────────────────────────────
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateItem[]>(
    initialData.exchangeRates,
  );
  const [ratesSuccess, setRatesSuccess] = useState<string | null>(null);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [isPendingRates, startRatesTransition] = useTransition();

  // New exchange rate form
  const [fromCurr, setFromCurr] = useState("VND");
  const [toCurr, setToCurr] = useState(
    initialData.organization.baseCurrency || "USD",
  );
  const [rateValue, setRateValue] = useState("");
  const [deletingRate, setDeletingRate] = useState<ExchangeRateItem | null>(null);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    const trimmed = userName.trim();
    if (trimmed.length < 2) {
      setProfileError("Full name must be at least 2 characters long.");
      return;
    }

    startProfileTransition(async () => {
      const res = await updateUserProfileAction({ name: trimmed });
      if (!res.success) {
        setProfileError(res.error || "Failed to update profile name.");
      } else {
        setSavedUserName(trimmed);
        setProfileSuccess("Personal profile updated successfully.");
        toast.success("Profile updated");
      }
    });
  };

  const handleSaveOrgName = (e: React.FormEvent) => {
    e.preventDefault();
    setOrgSuccess(null);
    setOrgError(null);

    const trimmed = orgName.trim();
    if (trimmed.length < 2) {
      setOrgError("Organization name must be at least 2 characters long.");
      return;
    }

    startOrgTransition(async () => {
      const res = await updateOrganizationNameAction({ name: trimmed });
      if (!res.success) {
        setOrgError(res.error || "Failed to update organization name.");
      } else {
        setSavedOrgName(trimmed);
        setOrgSuccess("Organization name updated successfully.");
        toast.success("Organization name updated");
      }
    });
  };

  const handleSaveBaseCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrencySuccess(null);
    setCurrencyError(null);

    startCurrencyTransition(async () => {
      const res = await updateOrganizationCurrencyAction({ baseCurrency });
      if (!res.success) {
        setCurrencyError(res.error || "Failed to update base currency.");
      } else {
        setSavedCurrency(baseCurrency);
        setToCurr(baseCurrency);
        setCurrencySuccess(
          "Base currency updated successfully! Carrier comparisons and exchange calculations will now use this currency.",
        );
        toast.success("Base currency updated");
      }
    });
  };

  const handleAddExchangeRate = (e: React.FormEvent) => {
    e.preventDefault();
    setRatesSuccess(null);
    setRatesError(null);

    const numeric = parseFloat(rateValue);
    if (!numeric || numeric <= 0) {
      setRatesError("Please enter a valid exchange rate greater than 0.");
      return;
    }

    startRatesTransition(async () => {
      const res = await upsertExchangeRateAction({
        fromCurrency: fromCurr,
        toCurrency: toCurr,
        rate: numeric,
      });

      if (!res.success) {
        setRatesError(res.error || "Failed to add exchange rate.");
      } else {
        setRatesSuccess(`Exchange rate for ${fromCurr} → ${toCurr} saved.`);
        toast.success(`Exchange rate ${fromCurr} → ${toCurr} saved`);
        setExchangeRates((prev) => {
          const filtered = prev.filter(
            (r) => !(r.fromCurrency === fromCurr && r.toCurrency === toCurr),
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

  const handleConfirmDeleteRate = async () => {
    if (!deletingRate) return;
    const res = await deleteExchangeRateAction({ id: deletingRate.id });
    if (!res.success) {
      return { success: false, error: res.error || "Failed to delete rate" };
    }
    setExchangeRates((prev) => prev.filter((r) => r.id !== deletingRate.id));
    setRatesSuccess(
      `Exchange rate for ${deletingRate.fromCurrency} → ${deletingRate.toCurrency} deleted.`,
    );
    setDeletingRate(null);
    return { success: true };
  };

  const handleCopyOrgId = () => {
    navigator.clipboard.writeText(initialData.organization.id);
    setCopiedOrgId(true);
    setTimeout(() => setCopiedOrgId(false), 2000);
  };

  const roleBadgeColor =
    initialData.user.role === "ADMIN"
      ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
      : initialData.user.role === "SALES_MANAGER"
        ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-12">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Settings & Preferences
          </h1>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            Account & Workspace
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Manage your personal profile, organization details, and multi-currency
          financial conversions.
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          SECTION 1: USER PROFILE
      ─────────────────────────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-xs transition-shadow hover:shadow-sm">
        {/* Section Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <User className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Personal Profile
              </h2>
              <p className="text-xs text-muted-foreground">
                Manage your personal identity, full name, and view your assigned role.
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
            Account Info
          </span>
        </div>

        {/* Section Feedback */}
        {profileSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}
        {profileError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        {/* Profile Form & Information */}
        <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="user-full-name"
                className="text-xs font-medium text-foreground"
              >
                Full Name
              </label>
              <input
                id="user-full-name"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                disabled={isPendingProfile}
                placeholder="Your full name"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors focus:border-primary focus:outline-hidden disabled:opacity-50"
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">
                  Email Address
                </label>
                <span className="text-[10px] text-muted-foreground">
                  Primary Login
                </span>
              </div>
              <div className="relative">
                <input
                  type="email"
                  value={initialData.user.email}
                  disabled
                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground select-none"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Mail className="size-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Account Meta Badges */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-muted/20 p-3.5 sm:grid-cols-2">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 text-muted-foreground" />
              <div>
                <p className="text-[11px] text-muted-foreground">Assigned Role</p>
                <span
                  className={`mt-0.5 inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold ${roleBadgeColor}`}
                >
                  {initialData.user.role === "ADMIN"
                    ? "Administrator"
                    : initialData.user.role === "SALES_MANAGER"
                      ? "Sales Manager"
                      : "Sales Representative"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar className="size-4 text-muted-foreground" />
              <div>
                <p className="text-[11px] text-muted-foreground">Member Since</p>
                <p className="mt-0.5 text-xs font-semibold text-foreground">
                  {new Date(initialData.user.createdAt).toLocaleDateString(
                    undefined,
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    },
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPendingProfile || userName.trim() === savedUserName}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {isPendingProfile && (
                <Loader2 className="size-3.5 animate-spin" />
              )}
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          SECTION 2: ORGANIZATION NAME & WORKSPACE
      ─────────────────────────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-xs transition-shadow hover:shadow-sm">
        {/* Section Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Organization Details
              </h2>
              <p className="text-xs text-muted-foreground">
                Configure your agency name, company workspace, and tenant
                identifier.
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-600 dark:text-purple-400">
            Workspace
          </span>
        </div>

        {/* Section Feedback */}
        {orgSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{orgSuccess}</span>
          </div>
        )}
        {orgError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{orgError}</span>
          </div>
        )}

        {/* Organization Form */}
        <form onSubmit={handleSaveOrgName} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Organization Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="organization-name-input"
                className="text-xs font-medium text-foreground"
              >
                Organization / Company Name
              </label>
              <input
                id="organization-name-input"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                disabled={!initialData.canEdit || isPendingOrg}
                placeholder="e.g. Acme Forwarding LLC"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors focus:border-primary focus:outline-hidden disabled:opacity-50"
              />
              {!initialData.canEdit && (
                <p className="text-[11px] text-muted-foreground">
                  Only Administrators and Sales Managers can change the company
                  name.
                </p>
              )}
            </div>

            {/* Workspace ID / Reference */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Organization Key
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={initialData.organization.id}
                  disabled
                  className="w-full font-mono rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyOrgId}
                  title="Copy Organization ID"
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  {copiedOrgId ? (
                    <>
                      <Check className="size-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">
                        Copied
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          {initialData.canEdit && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isPendingOrg || orgName.trim() === savedOrgName}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {isPendingOrg && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                <span>Save Organization Name</span>
              </button>
            </div>
          )}
        </form>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          SECTION 3: BASE CURRENCY SETTINGS
      ─────────────────────────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-xs transition-shadow hover:shadow-sm">
        {/* Section Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Coins className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Base Currency
              </h2>
              <p className="text-xs text-muted-foreground">
                Select your primary reporting currency for carrier quote
                consolidation and margin analysis.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
            Active: {savedCurrency}
          </div>
        </div>

        {/* Section Feedback */}
        {currencySuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{currencySuccess}</span>
          </div>
        )}
        {currencyError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{currencyError}</span>
          </div>
        )}

        {/* Currency Selector Form */}
        <form onSubmit={handleSaveBaseCurrency} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Select Base Currency
              </label>
              <Select
                value={baseCurrency}
                onValueChange={(val) => {
                  if (val) setBaseCurrency(val);
                }}
                disabled={!initialData.canEdit || isPendingCurrency}
              >
                <SelectTrigger className="w-full h-10 rounded-xl border border-border bg-background text-xs font-medium">
                  <SelectValue>
                    {(val: string | null) => {
                      const curr = val || baseCurrency;
                      const detail = CURRENCY_DETAILS[curr];
                      return detail
                        ? `${curr} — ${detail.label} (${detail.symbol})`
                        : curr;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-72">
                  {COMMON_CURRENCIES.map((curr) => {
                    const detail = CURRENCY_DETAILS[curr];
                    return (
                      <SelectItem key={curr} value={curr}>
                        {curr} —{" "}
                        {detail
                          ? `${detail.label} (${detail.symbol})`
                          : curr}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              {initialData.canEdit && (
                <button
                  type="submit"
                  disabled={
                    isPendingCurrency || baseCurrency === savedCurrency
                  }
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPendingCurrency && (
                    <Loader2 className="size-3.5 animate-spin" />
                  )}
                  <span>Save Base Currency</span>
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs text-amber-800 dark:text-amber-300">
            <p>
              Carrier quotes submitted in non-base currencies will automatically
              convert into <strong>{savedCurrency}</strong> using the live
              exchange rate multipliers defined below.
            </p>
          </div>
        </form>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          SECTION 4: MULTI-CURRENCY EXCHANGE RATES
      ─────────────────────────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6 transition-shadow hover:shadow-sm">
        {/* Section Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowRightLeft className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Exchange Rates & Multipliers
              </h2>
              <p className="text-xs text-muted-foreground">
                Define foreign exchange multipliers to convert foreign carrier
                charges (e.g. VND trucking into USD).
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {exchangeRates.length} Configured
          </span>
        </div>

        {/* Section Feedback */}
        {ratesSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{ratesSuccess}</span>
          </div>
        )}
        {ratesError && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{ratesError}</span>
          </div>
        )}

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
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No custom exchange rates configured yet. Foreign carrier
                    charges without a defined rate multiplier will prompt a
                    missing FX warning.
                  </td>
                </tr>
              ) : (
                exchangeRates.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2">
                      <span className="rounded-md bg-muted px-2 py-0.5">
                        {r.fromCurrency}
                      </span>
                      <ArrowRightLeft className="size-3 text-muted-foreground" />
                      <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5">
                        {r.toCurrency}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {r.rate.toLocaleString(undefined, {
                        maximumFractionDigits: 6,
                      })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-[11px]">
                      1 {r.fromCurrency} = {r.rate.toLocaleString()}{" "}
                      {r.toCurrency}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {initialData.canEdit && (
                        <button
                          type="button"
                          onClick={() => setDeletingRate(r)}
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
          <form
            onSubmit={handleAddExchangeRate}
            className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-4"
          >
            <h3 className="font-heading text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Plus className="size-3.5 text-primary" />
              Add or Update Currency Exchange Rate
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  From Currency
                </label>
                <Select
                  value={fromCurr}
                  onValueChange={(val) => {
                    if (val) setFromCurr(val);
                  }}
                >
                  <SelectTrigger className="w-full h-8.5 rounded-lg border border-border bg-background text-xs font-medium">
                    <SelectValue>
                      {(val: string | null) => val || fromCurr}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-lg max-h-60">
                    {COMMON_CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c} — {CURRENCY_DETAILS[c]?.label || c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  To Currency
                </label>
                <Select
                  value={toCurr}
                  onValueChange={(val) => {
                    if (val) setToCurr(val);
                  }}
                >
                  <SelectTrigger className="w-full h-8.5 rounded-lg border border-border bg-background text-xs font-medium">
                    <SelectValue>
                      {(val: string | null) => val || toCurr}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-lg max-h-60">
                    {COMMON_CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c} — {CURRENCY_DETAILS[c]?.label || c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isPendingRates || !rateValue}
                  className="w-full inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-xs"
                >
                  {isPendingRates && (
                    <Loader2 className="size-3 animate-spin" />
                  )}
                  <span>Save Rate</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground italic">
              Example: If base currency is USD and local charges are in VND, set
              From: <strong>VND</strong>, To: <strong>USD</strong> with rate:{" "}
              <strong>0.000039</strong> (or 1 / 25,400).
            </p>
          </form>
        )}
      </section>

      {/* Delete Confirmation Dialog */}
      {deletingRate && (
        <ConfirmDialog
          open={!!deletingRate}
          onOpenChange={(open) => {
            if (!open) setDeletingRate(null);
          }}
          title="Delete Exchange Rate"
          description={`Are you sure you want to remove the exchange rate for ${deletingRate.fromCurrency} → ${deletingRate.toCurrency}?`}
          confirmText="Delete Rate"
          variant="destructive"
          onConfirm={handleConfirmDeleteRate}
          successMessage={`Exchange rate for ${deletingRate.fromCurrency} → ${deletingRate.toCurrency} deleted.`}
        />
      )}
    </div>
  );
}

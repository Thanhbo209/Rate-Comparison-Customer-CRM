import { requireRole } from "@/lib/auth/session";
import {
  Users,
  FileSpreadsheet,
  FileCheck,
  TrendingUp,
  ArrowUpRight,
  PlusCircle,
  Clock,
  Target,
} from "lucide-react";
import { RateCalculator } from "@/components/dashboard/sales/rate-calculator";

export const dynamic = "force-dynamic";

const RECENT_QUOTES = [
  {
    id: "QT-9041",
    customer: "Nexus Import Logistics",
    lane: "Shanghai (CNSHA) → Los Angeles (USLAX)",
    mode: "Ocean FCL 40'HC",
    amount: "$2,280",
    validUntil: "May 15, 2026",
    status: "Accepted",
    statusTone: "accepted",
  },
  {
    id: "QT-9038",
    customer: "Pacific Retail Group",
    lane: "Ningbo (CNNGB) → Long Beach (USLGB)",
    mode: "Ocean FCL 2x40'HC",
    amount: "$4,160",
    validUntil: "May 18, 2026",
    status: "Sent",
    statusTone: "sent",
  },
  {
    id: "QT-9029",
    customer: "Global Solar Tech",
    lane: "Ho Chi Minh (VNSGN) → Rotterdam (NLRTM)",
    mode: "Ocean FCL 20'GP",
    amount: "$1,620",
    validUntil: "May 12, 2026",
    status: "In Review",
    statusTone: "review",
  },
  {
    id: "QT-9014",
    customer: "Summit Fasteners",
    lane: "Singapore (SGSIN) → Hamburg (DEHAM)",
    mode: "Ocean FCL 40'GP",
    amount: "$2,080",
    validUntil: "May 20, 2026",
    status: "Draft",
    statusTone: "draft",
  },
];

const STATUS_BADGE: Record<string, string> = {
  accepted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  sent: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  review: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  draft: "bg-muted text-muted-foreground",
};

export default async function SalesDashboardPage() {
  const profile = await requireRole(["SALES", "SALES_MANAGER"]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-linear-to-r from-primary/30 via-accent to-background p-6 sm:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:text-sky-400">
                Sales Representative Workspace
              </span>
              <span className="text-xs text-muted-foreground">
                • {profile.organization?.name}
              </span>
            </div>
            <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome back, {profile.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Compare freight rates, generate client proposals, and track your
              active RFQs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
            >
              <PlusCircle className="size-3.5" />
              New Customer RFQ
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Assigned Accounts */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              My Accounts
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              18
            </div>
            <p className="mt-1 flex items-center text-xs text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="size-3.5" />
              <span>+3 accounts this quarter</span>
            </p>
          </div>
        </div>

        {/* Card 2: Open RFQs */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Pending RFQs
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <FileSpreadsheet className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              7
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              4 requiring rate comparison
            </p>
          </div>
        </div>

        {/* Card 3: Quotations Won */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Quote Win Rate
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <FileCheck className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              68.4%
            </div>
            <p className="mt-1 flex items-center text-xs text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="size-3.5" />
              <span>+5.2% vs team avg</span>
            </p>
          </div>
        </div>

        {/* Card 4: Target Progress */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Monthly Closed GMV
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              $54,800
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              73% of $75k monthly target
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Freight Rate Comparison Tool */}
      <RateCalculator />

      {/* Quotation Pipeline & Target Tracking */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Quotes Table (2 cols) */}
        <div className="rounded-xl border border-border bg-card shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">
                My Recent Quotations
              </h2>
              <p className="text-xs text-muted-foreground">
                Active freight proposals submitted to clients
              </p>
            </div>
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all quotes &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Quote / Customer</th>
                  <th className="px-5 py-3 font-medium">Lane & Mode</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Validity</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {RECENT_QUOTES.map((q) => (
                  <tr
                    key={q.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-foreground">
                        {q.customer}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {q.id}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-foreground">{q.lane}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {q.mode}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-foreground">
                        {q.amount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {q.validUntil}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          STATUS_BADGE[q.statusTone]
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Target Progress & Follow-ups (1 col) */}
        <div className="space-y-6">
          {/* Target Progress Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Monthly Quota Target
              </h3>
              <Target className="size-4 text-primary" />
            </div>

            <div className="mt-4">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium text-foreground">
                  $54,800 achieved
                </span>
                <span className="text-muted-foreground">$75,000 quota</span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: "73%" }}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                You are on track to achieve 110% of target by month-end!
              </p>
            </div>
          </div>

          {/* Follow-up Tasks */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Immediate Follow-ups
            </h3>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-start gap-2.5 rounded-lg border border-border/60 p-2.5">
                <Clock className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    Pacific Retail Group
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Quote QT-9038 expiring in 48 hours. Follow up on booking.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-border/60 p-2.5">
                <Clock className="mt-0.5 size-3.5 shrink-0 text-sky-500" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    Global Solar Tech
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Requested re-quote with CMA CGM direct service.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

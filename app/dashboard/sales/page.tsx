import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import {
  Users,
  FileCheck,
  TrendingUp,
  PlusCircle,
  Truck,
  Package,
  ArrowRight,
  ArrowLeftRight,
  Building2,
  Layers,
} from "lucide-react";
import { RecentShipmentsRates } from "@/components/dashboard/overview/recent-shipments-rates";
import { SalesAnalyticsCharts } from "@/components/dashboard/overview/charts/sales-analytics-charts";
import { StatCard } from "@/components/dashboard/overview/stat-card";
import { SectionCard } from "@/components/dashboard/overview/section-card";
import { DashboardBanner } from "@/components/dashboard/overview/dashboard-banner";
import { getCustomerStats, getCustomers } from "@/lib/customer/queries";
import { getShipmentStats } from "@/lib/shipment/queries";
import { getAllShipmentsRateOverview } from "@/lib/rate/queries";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SalesDashboardPage() {
  const profile = await requireRole(["SALES", "SALES_MANAGER"]);

  const [customerStats, shipmentStats, rateOverview, customers] =
    await Promise.all([
      getCustomerStats(profile.organizationId),
      getShipmentStats(profile.organizationId),
      getAllShipmentsRateOverview(profile.organizationId),
      getCustomers(profile.organizationId),
    ]);

  const totalCustomers = customerStats.totalCustomers;
  const totalShipments = shipmentStats.totalShipments;
  const totalRates = rateOverview?.overall.totalRates ?? 0;
  const totalProfit = rateOverview?.overall.totalProfit ?? 0;
  const baseCurrency = rateOverview?.baseCurrency || "USD";
  const avgMargin = rateOverview?.overall.averageMarginPercent ?? 0;

  const formattedProfit = `${totalProfit > 0 ? "+" : ""}${totalProfit.toLocaleString(
    undefined,
    {
      maximumFractionDigits: 0,
    },
  )} ${baseCurrency}`;

  const agentRankings = rateOverview?.overall.agentRankings ?? [];
  const topCarriers = agentRankings.slice(0, 5);
  const topCustomers = customers.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Slogan Banner with Logistics Image */}
      <DashboardBanner
        organizationName={profile.organization?.name}
        tag={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
            <Truck className="size-3.5" />
            Sales Workspace
          </span>
        }
        slogan="Compare Rates & Close Freight Deals Faster"
        description={`Welcome back, ${profile.name}. Benchmark ocean & air tariffs in real-time, generate client proposals, and track your active RFQs.`}
        actions={
          <Link href="/dashboard/sales/customers">
            <Button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
            >
              <PlusCircle className="size-3.5" />
              New Customer
            </Button>
          </Link>
        }
      />

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Customers"
          value={totalCustomers}
          icon={Users}
          variant="sky"
          description={
            totalCustomers > 0
              ? `${customerStats.totalCommodities} sectors • ${customerStats.totalZones} zones`
              : "Active CRM accounts"
          }
        />

        <StatCard
          title="Total Shipments"
          value={totalShipments}
          icon={Truck}
          variant="amber"
          description={
            totalShipments > 0
              ? `${shipmentStats.importCount} Import • ${shipmentStats.exportCount} Export`
              : "Active cargo shipments"
          }
        />

        <StatCard
          title="Rate Comparisons"
          value={totalRates}
          icon={FileCheck}
          variant="emerald"
          description={
            rateOverview && rateOverview.overall.totalFreightItems > 0
              ? `${rateOverview.overall.totalFreightItems} freight line items`
              : "Across active shipments"
          }
        />

        <StatCard
          title="Total Profit"
          value={formattedProfit}
          icon={TrendingUp}
          variant="primary"
          description={
            totalRates > 0
              ? `${avgMargin.toFixed(1)}% avg profit margin`
              : "Across current rates"
          }
        />
      </div>

      {/* Interactive Sales Analytics Charts (Flexbox Row: Chart 1 & Chart 3) */}
      <SalesAnalyticsCharts
        shipments={rateOverview?.shipments ?? []}
        customers={customers.map((c) => ({
          id: c.id,
          companyName: c.companyName,
        }))}
        baseCurrency={baseCurrency}
      />

      {/* Recent Shipments & Rate Comparison Snapshot */}
      <RecentShipmentsRates
        shipments={rateOverview?.shipments ?? []}
        baseCurrency={baseCurrency}
      />

      {/* Carrier Performance & Customer Portfolio (Option A) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top Carriers & Freight Agents by Profit (2 cols) */}
        <SectionCard
          title="Top Carriers & Freight Agents by Profit"
          subtitle="Real-time margin performance and quote spread across freight providers"
          action={
            <Link
              href="/dashboard/sales/rates"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <span>Rate comparison</span>
              <ArrowRight className="size-3" />
            </Link>
          }
          contentPadding={false}
          className="lg:col-span-2"
        >
          {topCarriers.length === 0 ? (
            <div className="p-10 text-center text-xs text-muted-foreground italic">
              No carrier quote options recorded yet. Add quotes to your
              shipments to view carrier rankings.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Carrier / Agent</th>
                    <th className="px-5 py-3 font-medium">Quotes</th>
                    <th className="px-5 py-3 font-medium">Shipments</th>
                    <th className="px-5 py-3 font-medium">Total Profit</th>
                    <th className="px-5 py-3 text-right font-medium">
                      Avg. Margin
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topCarriers.map((carrier, idx) => (
                    <tr
                      key={carrier.providerId || idx}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-foreground">
                              {carrier.providerName}
                            </p>
                            {carrier.bestCostCount > 0 && (
                              <p className="text-[10px] text-muted-foreground">
                                Lowest cost in {carrier.bestCostCount} quotes
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Layers className="size-3 text-muted-foreground" />
                          {carrier.optionsCount}{" "}
                          {carrier.optionsCount === 1 ? "quote" : "quotes"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {carrier.shipmentCount}{" "}
                        {carrier.shipmentCount === 1 ? "shipment" : "shipments"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className=" text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          +
                          {carrier.totalProfit.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}{" "}
                          {baseCurrency}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right  font-semibold text-foreground">
                        {carrier.averageMarginPercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Right Column: Key Customer Accounts & Quick Operations (1 col) */}
        <div className="space-y-6">
          {/* Key Customer Accounts Card */}
          <SectionCard
            title="Key Customer Accounts"
            subtitle="Active accounts and shipment counts"
            action={
              <Link
                href="/dashboard/sales/customers"
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="size-3" />
              </Link>
            }
          >
            {topCustomers.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground italic">
                No customer accounts found.
              </div>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground text-xs truncate">
                        {cust.companyName}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 truncate">
                        <Building2 className="size-3 shrink-0" />
                        <span className="truncate">
                          {cust.commodity ||
                            cust.industrialZone ||
                            "Commercial Account"}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                      {cust._count?.shipments ?? 0}{" "}
                      {(cust._count?.shipments ?? 0) === 1
                        ? "shipment"
                        : "shipments"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Quick Operations Launchpad */}
          <SectionCard
            title="Quick Operations"
            subtitle="Fast links to create & manage freight records"
          >
            <div className="grid grid-cols-1 gap-2">
              <Link
                href="/dashboard/sales/shipments"
                className="flex items-center justify-between rounded-lg border border-border/80 bg-background p-2.5 text-xs font-medium text-foreground shadow-2xs transition-all hover:bg-muted/50 hover:border-primary/40"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    <Package className="size-3.5" />
                  </div>
                  <div>
                    <span className="block font-semibold">New Shipment</span>
                    <span className="block text-[10px] text-muted-foreground">
                      Log incoming import or export job
                    </span>
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Link>

              <Link
                href="/dashboard/sales/customers"
                className="flex items-center justify-between rounded-lg border border-border/80 bg-background p-2.5 text-xs font-medium text-foreground shadow-2xs transition-all hover:bg-muted/50 hover:border-primary/40"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Users className="size-3.5" />
                  </div>
                  <div>
                    <span className="block font-semibold">Add Customer</span>
                    <span className="block text-[10px] text-muted-foreground">
                      Register new client or enterprise
                    </span>
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Link>

              <Link
                href="/dashboard/sales/rates"
                className="flex items-center justify-between rounded-lg border border-border/80 bg-background p-2.5 text-xs font-medium text-foreground shadow-2xs transition-all hover:bg-muted/50 hover:border-primary/40"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <ArrowLeftRight className="size-3.5" />
                  </div>
                  <div>
                    <span className="block font-semibold">Compare Rates</span>
                    <span className="block text-[10px] text-muted-foreground">
                      Evaluate carrier quotes and margins
                    </span>
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

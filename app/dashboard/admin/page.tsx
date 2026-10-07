import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  Users,
  Building2,
  FileSpreadsheet,
  TrendingUp,
  ShieldCheck,
  UserPlus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Settings,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const profile = await requireRole(["ADMIN"]);

  // Fetch real team members in this organization
  const members = await prisma.user.findMany({
    where: { organizationId: profile.organizationId },
    orderBy: { createdAt: "desc" },
  });

  const memberCount = members.length;
  const adminCount = members.filter((m) => m.role === "ADMIN").length;
  const salesCount = members.filter((m) => m.role === "SALES" || m.role === "SALES_MANAGER").length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-emerald-950/20 via-background to-background p-6 sm:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-3.5" />
                System Administrator
              </span>
              <span className="text-xs text-muted-foreground">
                • {profile.organization?.name}
              </span>
            </div>
            <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome back, {profile.name} 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here is your organization&apos;s live freight rate engine & CRM performance overview.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
            >
              <UserPlus className="size-3.5" />
              Invite Team Member
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-4 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-muted"
            >
              <Settings className="size-3.5" />
              Org Settings
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Team Members */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Team Members
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {memberCount}
            </div>
            <p className="mt-1 flex items-center text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{salesCount}</span>
              <span className="ml-1">Sales •</span>
              <span className="ml-1 font-medium text-foreground">{adminCount}</span>
              <span className="ml-1">Admin</span>
            </p>
          </div>
        </div>

        {/* Card 2: Active RFQs */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Active RFQs
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
              <FileSpreadsheet className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              24
            </div>
            <p className="mt-1 flex items-center text-xs text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="size-3.5" />
              <span>+18% from last week</span>
            </p>
          </div>
        </div>

        {/* Card 3: Quotations Generated */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Quotations Sent
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              86
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Avg. response time: 2.4 hrs
            </p>
          </div>
        </div>

        {/* Card 4: Freight Gross Revenue */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Managed Freight Volume
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              $412,850
            </div>
            <p className="mt-1 flex items-center text-xs text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="size-3.5" />
              <span>+14.2% vs target</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Split: Team Members Table & Recent System Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Organization Team Members (2 cols) */}
        <div className="rounded-xl border border-border bg-card shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Organization Team Members
              </h2>
              <p className="text-xs text-muted-foreground">
                Active staff accounts in {profile.organization?.name}
              </p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {memberCount} total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((member) => {
                  const isAdminRole = member.role === "ADMIN";
                  const isManagerRole = member.role === "SALES_MANAGER";

                  return (
                    <tr
                      key={member.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {member.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              ID: {member.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            isAdminRole
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : isManagerRole
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                              : "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300"
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {new Date(member.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          <span>Active</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Activity & CRM Status (1 col) */}
        <div className="space-y-6">
          {/* Organization Details Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Organization Info
            </h3>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Company Name</span>
                <span className="font-medium text-foreground">
                  {profile.organization?.name}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Organization ID</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {profile.organizationId.slice(0, 10)}...
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Account Created</span>
                <span className="text-muted-foreground">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-muted-foreground">Plan</span>
                <span className="rounded bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                  Enterprise FWD
                </span>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Recent Activity
            </h3>
            <div className="mt-4 space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Rate Comparison Engine synced
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Updated ocean freight matrix with 5 carrier tariffs.
                  </p>
                  <span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="size-3" /> 10m ago
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-600">
                  <Users className="size-3.5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    New staff member added
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {profile.name} provisioned as organization Admin.
                  </p>
                  <span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="size-3" /> Just now
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Building2 className="size-3.5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Default markup policy applied
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    8.5% standard margin on Spot FCL rates enabled.
                  </p>
                  <span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="size-3" /> 1 hour ago
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { requireRole } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function SalesDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["SALES", "SALES_MANAGER"]);

  return (
    <DashboardShell
      role={profile.role === "ADMIN" ? "ADMIN" : "SALES"}
      userName={profile.name}
      userEmail={profile.email}
      organizationName={profile.organization?.name ?? "My Organization"}
      headerTitle="Sales Workspace"
      headerSubtitle="Quotations, customer accounts & real-time rate comparison"
    >
      {children}
    </DashboardShell>
  );
}

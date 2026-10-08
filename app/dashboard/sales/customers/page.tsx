import { requireRole } from "@/lib/auth/session";
import { getCustomers, getCustomerStats } from "@/lib/customer/queries";
import { CustomersView } from "@/components/dashboard/sales/customers/customers-view";

export const dynamic = "force-dynamic";

export default async function SalesCustomersPage() {
  const profile = await requireRole(["SALES", "SALES_MANAGER"]);

  const [customers, stats] = await Promise.all([
    getCustomers(profile.organizationId),
    getCustomerStats(profile.organizationId),
  ]);

  return (
    <CustomersView
      initialCustomers={customers}
      stats={stats}
      role={profile.role === "ADMIN" ? "ADMIN" : "SALES"}
      organizationName={profile.organization?.name ?? "My Organization"}
    />
  );
}

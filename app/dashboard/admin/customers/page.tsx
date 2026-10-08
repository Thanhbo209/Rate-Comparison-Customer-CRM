import { requireRole } from "@/lib/auth/session";
import { getCustomers, getCustomerStats } from "@/lib/customer/queries";
import { CustomersView } from "@/components/dashboard/sales/customers/customers-view";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const profile = await requireRole(["ADMIN"]);

  const [customers, stats] = await Promise.all([
    getCustomers(profile.organizationId, undefined, true),
    getCustomerStats(profile.organizationId, true),
  ]);

  return (
    <CustomersView
      initialCustomers={customers}
      stats={stats}
      role="ADMIN"
      organizationName={profile.organization?.name ?? "Platform Directory"}
    />
  );
}

import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getShipments, getShipmentStats } from "@/lib/shipment/queries";
import { getCustomers } from "@/lib/customer/queries";
import { ShipmentsView } from "@/components/dashboard/sales/shipments/shipments-view";

export const metadata: Metadata = {
  title: "Shipments & Freight Flows | Dropwell",
  description: "Manage import/export shipments, account assignments, and rates.",
};

export const dynamic = "force-dynamic";

export default async function SalesShipmentsPage() {
  const profile = await requireRole(["SALES", "SALES_MANAGER"]);

  const [shipments, stats, customers] = await Promise.all([
    getShipments(profile.organizationId),
    getShipmentStats(profile.organizationId),
    getCustomers(profile.organizationId),
  ]);

  const customerOptions = customers.map((c) => ({
    id: c.id,
    companyName: c.companyName,
  }));

  return (
    <ShipmentsView
      initialShipments={shipments}
      customers={customerOptions}
      stats={stats}
      role={profile.role}
      organizationName={profile.organization?.name ?? "My Organization"}
    />
  );
}

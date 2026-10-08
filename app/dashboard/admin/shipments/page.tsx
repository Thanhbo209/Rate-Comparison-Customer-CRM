import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { getShipments, getShipmentStats } from "@/lib/shipment/queries";
import { getCustomers } from "@/lib/customer/queries";
import { ShipmentsView } from "@/components/dashboard/sales/shipments/shipments-view";

export const metadata: Metadata = {
  title: "Shipments Console | Dropwell Admin",
  description: "Platform-wide shipment directory and freight flows.",
};

export const dynamic = "force-dynamic";

export default async function AdminShipmentsPage() {
  const profile = await requireRole(["ADMIN"]);
  const isPlatformAdmin = !profile.organizationId || profile.role === "ADMIN";

  const [shipments, stats, customers] = await Promise.all([
    getShipments(profile.organizationId, { isPlatformAdmin }),
    getShipmentStats(profile.organizationId, isPlatformAdmin),
    getCustomers(profile.organizationId, undefined, isPlatformAdmin),
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
      role="ADMIN"
      organizationName={profile.organization?.name ?? "Platform Directory"}
    />
  );
}

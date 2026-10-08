import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import {
  getAvailableShipmentsForRates,
  getShipmentRateComparison,
  getProviders,
  getAllShipmentsRateOverview,
} from "@/lib/rate/queries";
import { RateComparisonView } from "@/components/dashboard/sales/rates/rate-comparison-view";

export const metadata: Metadata = {
  title: "Rate Comparison | Dropwell",
  description: "Compare carrier freight rates, margins, and buying costs.",
};

export const dynamic = "force-dynamic";

export default async function SalesRatesPage({
  searchParams,
}: {
  searchParams?: Promise<{ shipmentId?: string }>;
}) {
  const profile = await requireRole(["SALES", "SALES_MANAGER"]);
  const params = searchParams ? await searchParams : undefined;

  const [availableShipments, providers, overview] = await Promise.all([
    getAvailableShipmentsForRates(profile.organizationId),
    getProviders(profile.organizationId),
    getAllShipmentsRateOverview(profile.organizationId),
  ]);

  const targetShipmentId =
    params?.shipmentId || availableShipments[0]?.id || "";

  const comparison = targetShipmentId
    ? await getShipmentRateComparison(targetShipmentId, profile.organizationId)
    : null;

  return (
    <RateComparisonView
      shipment={comparison}
      availableShipments={availableShipments}
      providers={providers}
      overview={overview}
      role={profile.role}
      organizationName={profile.organization?.name ?? "My Organization"}
    />
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import {
  getAvailableShipmentsForRates,
  getShipmentRateComparison,
  getProviders,
  getAllShipmentsRateOverview,
} from "@/lib/rate/queries";
import { getCustomers } from "@/lib/customer/queries";
import { RateComparisonView } from "@/components/dashboard/sales/rates/rate-comparison-view";
import { RateComparisonSkeleton } from "@/components/dashboard/skeletons";

export const metadata: Metadata = {
  title: "Rate Comparison | Dropwell",
  description: "Compare carrier freight rates, margins, and buying costs.",
};

export const dynamic = "force-dynamic";

type UserProfile = Awaited<ReturnType<typeof requireRole>>;

async function SalesRatesContent({
  profile,
  params,
}: {
  profile: UserProfile;
  params?: { shipmentId?: string; customerId?: string };
}) {
  const [availableShipments, providers, overview, customers] =
    await Promise.all([
      getAvailableShipmentsForRates(profile.organizationId),
      getProviders(profile.organizationId),
      getAllShipmentsRateOverview(profile.organizationId),
      getCustomers(profile.organizationId!),
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
      customers={customers}
      initialCustomerId={params?.customerId}
      role={profile.role}
      organizationName={profile.organization?.name ?? "My Organization"}
    />
  );
}

export default async function SalesRatesPage({
  searchParams,
}: {
  searchParams?: Promise<{ shipmentId?: string; customerId?: string }>;
}) {
  const profile = await requireRole(["SALES", "SALES_MANAGER"]);
  const params = searchParams ? await searchParams : undefined;

  return (
    <Suspense fallback={<RateComparisonSkeleton />}>
      <SalesRatesContent profile={profile} params={params} />
    </Suspense>
  );
}

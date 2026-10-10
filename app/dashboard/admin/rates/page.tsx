import { Suspense } from "react";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import {
  getAvailableShipmentsForRates,
  getShipmentRateComparison,
  getProviders,
  getAllShipmentsRateOverview,
} from "@/lib/rate/queries";
import { RateComparisonView } from "@/components/dashboard/sales/rates/rate-comparison-view";
import { RateComparisonSkeleton } from "@/components/dashboard/skeletons";

export const metadata: Metadata = {
  title: "Rate Comparison Console | Dropwell Admin",
  description: "Platform freight rate comparison and carrier margin analysis.",
};

export const dynamic = "force-dynamic";

type UserProfile = Awaited<ReturnType<typeof requireRole>>;

async function AdminRatesContent({
  profile,
  params,
}: {
  profile: UserProfile;
  params?: { shipmentId?: string };
}) {
  const isPlatformAdmin = !profile.organizationId || profile.role === "ADMIN";

  const [availableShipments, providers, overview] = await Promise.all([
    getAvailableShipmentsForRates(profile.organizationId, isPlatformAdmin),
    getProviders(profile.organizationId, isPlatformAdmin),
    getAllShipmentsRateOverview(profile.organizationId, isPlatformAdmin),
  ]);

  const targetShipmentId =
    params?.shipmentId || availableShipments[0]?.id || "";

  const comparison = targetShipmentId
    ? await getShipmentRateComparison(
        targetShipmentId,
        profile.organizationId,
        isPlatformAdmin
      )
    : null;

  return (
    <RateComparisonView
      shipment={comparison}
      availableShipments={availableShipments}
      providers={providers}
      overview={overview}
      role="ADMIN"
      organizationName={profile.organization?.name ?? "Platform Directory"}
    />
  );
}

export default async function AdminRatesPage({
  searchParams,
}: {
  searchParams?: Promise<{ shipmentId?: string }>;
}) {
  const profile = await requireRole(["ADMIN"]);
  const params = searchParams ? await searchParams : undefined;

  return (
    <Suspense fallback={<RateComparisonSkeleton />}>
      <AdminRatesContent profile={profile} params={params} />
    </Suspense>
  );
}

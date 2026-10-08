import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getOrganizationSettingsData } from "@/lib/organization/settings-queries";
import { OrganizationSettingsView } from "@/components/organization/settings-view";

export const metadata: Metadata = {
  title: "Organization Settings | Dropwell",
  description: "Configure organization base currency and exchange rates.",
};

export const dynamic = "force-dynamic";

export default async function SalesSettingsPage() {
  await requireRole(["SALES", "SALES_MANAGER"]);

  const settingsData = await getOrganizationSettingsData();
  if (!settingsData) {
    redirect("/dashboard/sales");
  }

  return <OrganizationSettingsView initialData={settingsData} />;
}

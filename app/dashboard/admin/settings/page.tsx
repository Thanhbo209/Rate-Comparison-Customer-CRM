import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getOrganizationSettingsData } from "@/lib/organization/settings-queries";
import { OrganizationSettingsView } from "@/components/organization/settings-view";

export const metadata: Metadata = {
  title: "Admin Organization Settings | Dropwell",
  description: "Configure organization base currency and exchange rates.",
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireRole(["ADMIN", "SALES_MANAGER"]);

  const settingsData = await getOrganizationSettingsData();
  if (!settingsData) {
    redirect("/dashboard/admin");
  }

  return <OrganizationSettingsView initialData={settingsData} />;
}

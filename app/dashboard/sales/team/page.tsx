import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getOrganizationTeamData } from "@/lib/organization/queries";
import { MemberManagementView } from "@/components/organization/member-management-view";

export const metadata: Metadata = {
  title: "Team & Members | Dropwell",
  description: "Manage organization members, invitation codes, and roles.",
};

export const dynamic = "force-dynamic";

export default async function SalesTeamPage() {
  await requireRole(["SALES", "SALES_MANAGER"]);

  const teamData = await getOrganizationTeamData();
  if (!teamData) {
    redirect("/dashboard/sales");
  }

  return <MemberManagementView initialData={teamData} />;
}

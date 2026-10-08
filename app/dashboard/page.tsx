import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { ROLE_HOME, type AppRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.organizationId && profile.role !== "ADMIN") {
    redirect("/onboarding");
  }

  const targetPath = ROLE_HOME[profile.role as AppRole] ?? "/dashboard/sales";
  redirect(targetPath);
}

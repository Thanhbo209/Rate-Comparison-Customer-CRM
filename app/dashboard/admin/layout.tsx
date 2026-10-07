import { requireRole } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["ADMIN"]);

  return (
    <DashboardShell
      role="ADMIN"
      userName={profile.name}
      userEmail={profile.email}
      organizationName={profile.organization?.name ?? "My Organization"}
      headerTitle="Admin Console"
      headerSubtitle="System administration, member access & platform performance"
    >
      {children}
    </DashboardShell>
  );
}

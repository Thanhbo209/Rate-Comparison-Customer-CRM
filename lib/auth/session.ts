import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import type { AppRole } from "@/lib/auth/roles";
import { provisionUser } from "@/lib/user/provision";

/**
 * The signed-in user's profile (including role and organization), or null if logged out.
 * Cached per request, so calling it across layouts and pages only executes one DB query.
 */
export const getCurrentProfile = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  // 1. Look up existing application user by Supabase authUserId
  const existing = await prisma.user.findUnique({
    where: { authUserId: claims.sub },
    include: { organization: true },
  });
  const email = (claims.email as string | undefined) ?? "";

  if (existing) {
    return {
      ...existing,
      email,
    };
  }

  // 2. If user doesn't exist yet in the DB, provision user + organization
  const meta = (claims.user_metadata ?? {}) as {
    full_name?: string;
    organization_name?: string;
  };

  const user = await provisionUser({
    authUserId: claims.sub,
    email,
    name: meta.full_name ?? (claims.email as string)?.split("@")[0] ?? "User",
    organizationName: meta.organization_name ?? "My Organization",
  });

  // Re-fetch with organization included
  const created = await prisma.user.findUnique({
    where: { id: user.id },
    include: { organization: true },
  });

  return created ? { ...created, email } : null;
});

/** Use at the top of a protected layout or page. Wrong role goes back to /dashboard, which routes by role. */
export async function requireRole(allowed: AppRole[]) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.organizationId && profile.role !== "ADMIN") {
    redirect("/onboarding");
  }
  if (!allowed.includes(profile.role as AppRole)) redirect("/dashboard");
  return profile;
}

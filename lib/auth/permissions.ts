import type { AppRole } from "@/lib/auth/roles";
import { getCurrentProfile } from "@/lib/auth/session";

/**
 * Supported authenticated actions mapped to permitted roles.
 *
 * Rules:
 * - Customer & Shipment: add and edit for SALES, SALES_MANAGER, ADMIN.
 *   Delete for SALES_MANAGER and ADMIN only.
 * - Provider: add for all three roles. Edit and delete for SALES_MANAGER and ADMIN only.
 */
export const ACTION_ROLE_PERMISSIONS = {
  // Customer actions
  "customer:create": ["SALES", "SALES_MANAGER", "ADMIN"],
  "customer:update": ["SALES", "SALES_MANAGER", "ADMIN"],
  "customer:delete": ["SALES_MANAGER", "ADMIN"],

  // Shipment actions
  "shipment:create": ["SALES", "SALES_MANAGER", "ADMIN"],
  "shipment:update": ["SALES", "SALES_MANAGER", "ADMIN"],
  "shipment:delete": ["SALES_MANAGER", "ADMIN"],

  // Provider actions
  "provider:create": ["SALES", "SALES_MANAGER", "ADMIN"],
  "provider:update": ["SALES_MANAGER", "ADMIN"],
  "provider:delete": ["SALES_MANAGER", "ADMIN"],
} as const satisfies Record<string, readonly AppRole[]>;

export type ActionPermissionName = keyof typeof ACTION_ROLE_PERMISSIONS;

export interface VerifiedActionContext {
  profile: NonNullable<Awaited<ReturnType<typeof getCurrentProfile>>>;
  organizationId: string;
}

/**
 * Verifies that the caller is authenticated, belongs to an organization (strict tenancy),
 * and holds a role permitted to perform the specified action.
 *
 * Throws an Error with a safe message if unauthorized.
 */
export async function verifyActionPermission(
  action: ActionPermissionName
): Promise<VerifiedActionContext> {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("Authentication required.");
  }

  // Strict tenancy: reject any user without an organizationId
  if (!profile.organizationId) {
    throw new Error("You must belong to an organization to perform this action.");
  }

  const allowedRoles = ACTION_ROLE_PERMISSIONS[action] as readonly AppRole[];
  if (!allowedRoles.includes(profile.role as AppRole)) {
    throw new Error("You do not have permission to perform this action.");
  }

  return {
    profile,
    organizationId: profile.organizationId,
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentProfile } from "@/lib/auth/session";
import { validateInvitationCode } from "./invitations";

export type OrganizationActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Create a new organization.
 * The creating user becomes its SALES_MANAGER.
 */
export async function createOrganizationAction({
  name,
}: {
  name: string;
}): Promise<OrganizationActionResponse<{ organizationId: string; name: string }>> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return { success: false, error: "Authentication required." };
    }

    if (profile.organizationId) {
      return {
        success: false,
        error: "You already belong to an organization.",
      };
    }

    const trimmedName = name?.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return {
        success: false,
        error: "Organization name must be at least 2 characters long.",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: trimmedName,
        },
      });

      await tx.user.update({
        where: { id: profile.id },
        data: {
          organizationId: organization.id,
          role: "SALES_MANAGER",
        },
      });

      return organization;
    });

    revalidatePath("/", "layout");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: { organizationId: result.id, name: result.name },
    };
  } catch (error) {
    console.error("Failed to create organization:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create organization.",
    };
  }
}

/**
 * Preview/verify an invitation code before joining.
 */
export async function verifyInvitationCodeAction(
  code: string
): Promise<OrganizationActionResponse<{ organizationName: string; role: string }>> {
  try {
    const validation = await validateInvitationCode(code);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    return {
      success: true,
      data: {
        organizationName: validation.invitation.organizationName,
        role: validation.invitation.role,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to verify invitation code.",
    };
  }
}

/**
 * Join an existing organization using a valid invitation code.
 * The joining user becomes a SALES member (or the role configured on the invitation).
 * The invitation code is marked as single-use (usedAt and usedById set).
 */
export async function joinOrganizationAction({
  code,
}: {
  code: string;
}): Promise<OrganizationActionResponse<{ organizationName: string }>> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return { success: false, error: "Authentication required." };
    }

    if (profile.organizationId) {
      return {
        success: false,
        error: "You already belong to an organization.",
      };
    }

    const trimmedCode = code?.trim().toUpperCase();
    if (!trimmedCode) {
      return { success: false, error: "Invitation code is required." };
    }

    const validation = await validateInvitationCode(trimmedCode);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const invitation = validation.invitation;

    await prisma.$transaction(async (tx) => {
      // Re-verify invitation within transaction to prevent race conditions
      const currentInvite = await tx.organizationInvitation.findUnique({
        where: { id: invitation.id },
      });

      if (!currentInvite || currentInvite.usedAt || currentInvite.usedById) {
        throw new Error("This invitation code has already been redeemed.");
      }

      if (new Date() > currentInvite.expiresAt) {
        throw new Error("This invitation code has expired.");
      }

      // Mark invitation as used
      await tx.organizationInvitation.update({
        where: { id: invitation.id },
        data: {
          usedAt: new Date(),
          usedById: profile.id,
        },
      });

      // Assign user to organization
      await tx.user.update({
        where: { id: profile.id },
        data: {
          organizationId: currentInvite.organizationId,
          role: currentInvite.role,
        },
      });
    });

    revalidatePath("/", "layout");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: { organizationName: invitation.organizationName },
    };
  } catch (error) {
    console.error("Failed to join organization:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to join organization.",
    };
  }
}

/**
 * Generate a new single-use, expiring invitation code for the current organization.
 * Only SALES_MANAGER or ADMIN of that organization can generate invitations.
 */
export async function generateInvitationAction({
  role = "SALES",
  expiresInDays = 7,
}: {
  role?: "SALES" | "SALES_MANAGER";
  expiresInDays?: number;
}): Promise<OrganizationActionResponse<{ code: string; expiresAt: Date }>> {
  try {
    const profile = await getCurrentProfile();
    if (!profile || !profile.organizationId) {
      return { success: false, error: "Authentication required." };
    }

    if (profile.role !== "SALES_MANAGER" && profile.role !== "ADMIN") {
      return {
        success: false,
        error: "Only organization managers can generate invitation codes.",
      };
    }

    const invitation = await prisma.$transaction(async (tx) => {
      const crypto = await import("crypto");
      const code = `INV-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

      return tx.organizationInvitation.create({
        data: {
          organizationId: profile.organizationId!,
          code,
          role,
          createdById: profile.id,
          expiresAt,
        },
      });
    });

    revalidatePath("/dashboard/sales/team");

    return {
      success: true,
      data: { code: invitation.code, expiresAt: invitation.expiresAt },
    };
  } catch (error) {
    console.error("Failed to generate invitation:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate invitation.",
    };
  }
}

/**
 * Revoke an unredeemed invitation.
 */
export async function revokeInvitationAction({
  invitationId,
}: {
  invitationId: string;
}): Promise<OrganizationActionResponse> {
  try {
    const profile = await getCurrentProfile();
    if (!profile || !profile.organizationId) {
      return { success: false, error: "Authentication required." };
    }

    if (profile.role !== "SALES_MANAGER" && profile.role !== "ADMIN") {
      return {
        success: false,
        error: "Only organization managers can revoke invitations.",
      };
    }

    const invitation = await prisma.organizationInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.organizationId !== profile.organizationId) {
      return { success: false, error: "Invitation not found." };
    }

    if (invitation.usedAt || invitation.usedById) {
      return {
        success: false,
        error: "Cannot revoke an invitation that has already been redeemed.",
      };
    }

    await prisma.organizationInvitation.delete({
      where: { id: invitationId },
    });

    revalidatePath("/dashboard/sales/team");

    return { success: true };
  } catch (error) {
    console.error("Failed to revoke invitation:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to revoke invitation.",
    };
  }
}

/**
 * Update an organization member's role (SALES <-> SALES_MANAGER).
 */
export async function updateMemberRoleAction({
  targetUserId,
  newRole,
}: {
  targetUserId: string;
  newRole: "SALES" | "SALES_MANAGER";
}): Promise<OrganizationActionResponse> {
  try {
    const profile = await getCurrentProfile();
    if (!profile || !profile.organizationId) {
      return { success: false, error: "Authentication required." };
    }

    if (profile.role !== "SALES_MANAGER" && profile.role !== "ADMIN") {
      return {
        success: false,
        error: "Only organization managers can update member roles.",
      };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser || targetUser.organizationId !== profile.organizationId) {
      return { success: false, error: "User is not a member of your organization." };
    }

    // If demoting oneself, verify there is at least one other manager
    if (targetUser.id === profile.id && newRole !== "SALES_MANAGER") {
      const otherManagers = await prisma.user.count({
        where: {
          organizationId: profile.organizationId,
          role: "SALES_MANAGER",
          id: { not: profile.id },
        },
      });

      if (otherManagers === 0) {
        return {
          success: false,
          error: "You cannot demote yourself because you are the only Sales Manager.",
        };
      }
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
    });

    revalidatePath("/dashboard/sales/team");

    return { success: true };
  } catch (error) {
    console.error("Failed to update member role:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update member role.",
    };
  }
}

/**
 * Remove a member from the organization.
 */
export async function removeMemberAction({
  targetUserId,
}: {
  targetUserId: string;
}): Promise<OrganizationActionResponse> {
  try {
    const profile = await getCurrentProfile();
    if (!profile || !profile.organizationId) {
      return { success: false, error: "Authentication required." };
    }

    if (profile.role !== "SALES_MANAGER" && profile.role !== "ADMIN") {
      return {
        success: false,
        error: "Only organization managers can remove members.",
      };
    }

    if (targetUserId === profile.id) {
      return {
        success: false,
        error: "You cannot remove yourself from your organization.",
      };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser || targetUser.organizationId !== profile.organizationId) {
      return { success: false, error: "User is not a member of your organization." };
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        organizationId: null,
        role: "SALES",
      },
    });

    revalidatePath("/dashboard/sales/team");

    return { success: true };
  } catch (error) {
    console.error("Failed to remove member:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to remove member.",
    };
  }
}

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

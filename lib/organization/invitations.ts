import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import type { Role } from "@/lib/generated/prisma/enums";

export type InvitationValidationResult =
  | {
      valid: true;
      invitation: {
        id: string;
        code: string;
        role: Role;
        organizationId: string;
        organizationName: string;
        expiresAt: Date;
      };
    }
  | {
      valid: false;
      error: string;
    };

/**
 * Generate a cryptographically secure, non-guessable invitation code.
 * Example format: INV-A1B2C3D4E5F67890 (64-bit entropy hex string).
 */
export function generateInvitationCode(): string {
  const token = crypto.randomBytes(8).toString("hex").toUpperCase();
  return `INV-${token}`;
}

/**
 * Create an invitation for the authenticated user's organization.
 * Only SALES_MANAGER or ADMIN of that organization can generate invitations.
 * Derives organizationId strictly from the user's record on the server.
 */
export async function createOrganizationInvitation({
  authUserId,
  role = "SALES",
  expiresInDays = 7,
}: {
  authUserId: string;
  role?: Role;
  expiresInDays?: number;
}) {
  const user = await prisma.user.findUnique({
    where: { authUserId },
    include: { organization: true },
  });

  if (!user || !user.organizationId) {
    throw new Error("You must belong to an organization to create invitations.");
  }

  if (user.role !== "SALES_MANAGER" && user.role !== "ADMIN") {
    throw new Error("Only organization managers or admins can generate invitations.");
  }

  const code = generateInvitationCode();
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  return prisma.organizationInvitation.create({
    data: {
      organizationId: user.organizationId,
      code,
      role,
      createdById: user.id,
      expiresAt,
    },
    include: {
      organization: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

/**
 * Validate an invitation code.
 * Verifies existence, single-use status (not already used), and expiration.
 */
export async function validateInvitationCode(
  code: string
): Promise<InvitationValidationResult> {
  const trimmed = code.trim().toUpperCase();

  if (!trimmed) {
    return { valid: false, error: "Invitation code is required." };
  }

  const invitation = await prisma.organizationInvitation.findUnique({
    where: { code: trimmed },
    include: {
      organization: { select: { id: true, name: true } },
    },
  });

  if (!invitation) {
    return { valid: false, error: "Invitation code is invalid or does not exist." };
  }

  if (invitation.usedAt || invitation.usedById) {
    return {
      valid: false,
      error: "This invitation code has already been used.",
    };
  }

  if (new Date() > invitation.expiresAt) {
    return {
      valid: false,
      error: "This invitation code has expired.",
    };
  }

  return {
    valid: true,
    invitation: {
      id: invitation.id,
      code: invitation.code,
      role: invitation.role,
      organizationId: invitation.organizationId,
      organizationName: invitation.organization.name,
      expiresAt: invitation.expiresAt,
    },
  };
}

/**
 * Fetch all invitations for the authenticated user's organization.
 */
export async function getOrganizationInvitations(authUserId: string) {
  const user = await prisma.user.findUnique({
    where: { authUserId },
  });

  if (!user || !user.organizationId) {
    return [];
  }

  return prisma.organizationInvitation.findMany({
    where: { organizationId: user.organizationId },
    include: {
      createdBy: { select: { id: true, name: true } },
      usedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Revoke an unused invitation.
 */
export async function revokeOrganizationInvitation({
  authUserId,
  invitationId,
}: {
  authUserId: string;
  invitationId: string;
}) {
  const user = await prisma.user.findUnique({
    where: { authUserId },
  });

  if (!user || !user.organizationId) {
    throw new Error("Unauthorized.");
  }

  const invitation = await prisma.organizationInvitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation || invitation.organizationId !== user.organizationId) {
    throw new Error("Invitation not found or belongs to another organization.");
  }

  if (user.role !== "SALES_MANAGER" && user.role !== "ADMIN") {
    throw new Error("Only organization managers can revoke invitations.");
  }

  return prisma.organizationInvitation.delete({
    where: { id: invitationId },
  });
}

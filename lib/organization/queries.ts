import { prisma } from "@/lib/db/prisma";
import { getCurrentProfile } from "@/lib/auth/session";
import type { Role } from "@/lib/generated/prisma/enums";

export interface OrganizationMemberItem {
  id: string;
  name: string;
  role: Role;
  createdAt: Date;
  authUserId: string;
  isCurrentUser: boolean;
}

export interface OrganizationInvitationItem {
  id: string;
  code: string;
  role: Role;
  expiresAt: Date;
  createdAt: Date;
  usedAt: Date | null;
  createdBy: { id: string; name: string };
  usedBy: { id: string; name: string } | null;
  isExpired: boolean;
  isUsed: boolean;
}

export interface OrganizationTeamData {
  organization: {
    id: string;
    name: string;
    createdAt: Date;
  } | null;
  members: OrganizationMemberItem[];
  invitations: OrganizationInvitationItem[];
  isManager: boolean;
  userRole: Role;
}

/**
 * Fetch organization team members and invitations for the current user's organization.
 * Derives organizationId strictly from the session.
 */
export async function getOrganizationTeamData(): Promise<OrganizationTeamData | null> {
  const profile = await getCurrentProfile();
  if (!profile || !profile.organizationId) {
    return null;
  }

  const isManager = profile.role === "SALES_MANAGER" || profile.role === "ADMIN";

  const [org, rawInvitations] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: profile.organizationId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            role: true,
            createdAt: true,
            authUserId: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    isManager
      ? prisma.organizationInvitation.findMany({
          where: { organizationId: profile.organizationId },
          include: {
            createdBy: { select: { id: true, name: true } },
            usedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  if (!org) return null;

  const now = new Date();

  const members: OrganizationMemberItem[] = org.users.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt,
    authUserId: u.authUserId,
    isCurrentUser: u.id === profile.id,
  }));

  const invitations: OrganizationInvitationItem[] = rawInvitations.map((inv) => ({
    id: inv.id,
    code: inv.code,
    role: inv.role,
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt,
    usedAt: inv.usedAt,
    createdBy: inv.createdBy,
    usedBy: inv.usedBy,
    isExpired: now > inv.expiresAt,
    isUsed: Boolean(inv.usedAt || inv.usedById),
  }));

  return {
    organization: {
      id: org.id,
      name: org.name,
      createdAt: org.createdAt,
    },
    members,
    invitations,
    isManager,
    userRole: profile.role,
  };
}

import { prisma } from "@/lib/db/prisma";

type ProvisionUserInput = {
  authUserId: string;
  email: string;
  name: string;
  organizationName?: string;
};

export async function provisionUser({
  authUserId,
  name,
}: ProvisionUserInput) {
  // Prevent duplicate application users.
  const existingUser = await prisma.user.findUnique({
    where: {
      authUserId,
    },
  });

  if (existingUser) {
    return existingUser;
  }

  // Provision user without an organization.
  // The user will create or join an organization during onboarding.
  return prisma.user.create({
    data: {
      authUserId,
      name,
      organizationId: null,
      role: "SALES",
    },
  });
}

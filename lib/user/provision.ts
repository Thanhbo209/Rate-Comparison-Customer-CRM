import { prisma } from "@/lib/db/prisma";

type ProvisionUserInput = {
  authUserId: string;
  email: string;
  name: string;
  organizationName: string;
};

export async function provisionUser({
  authUserId,
  name,
  organizationName,
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

  // First user of an organization becomes ADMIN.
  const user = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: organizationName,
      },
    });

    return tx.user.create({
      data: {
        authUserId,
        name,
        organizationId: organization.id,
        role: "ADMIN",
      },
    });
  });

  return user;
}

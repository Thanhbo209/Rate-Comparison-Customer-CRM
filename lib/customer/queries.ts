import { prisma } from "@/lib/db/prisma";

export async function getCustomers(organizationId: string) {
  return prisma.customer.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

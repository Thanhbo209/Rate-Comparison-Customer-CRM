import { prisma } from "@/lib/db/prisma";
import type { CustomerItem, CustomerStats } from "./types";

export async function getCustomers(
  organizationId: string,
  search?: string
): Promise<CustomerItem[]> {
  return prisma.customer.findMany({
    where: {
      organizationId,
      ...(search
        ? {
            OR: [
              { companyName: { contains: search, mode: "insensitive" } },
              { contactPerson: { contains: search, mode: "insensitive" } },
              { commodity: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { industrialZone: { contains: search, mode: "insensitive" } },
              { location: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      _count: {
        select: { shipments: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCustomerById(id: string, organizationId: string) {
  return prisma.customer.findFirst({
    where: {
      id,
      organizationId,
    },
    include: {
      shipments: {
        include: {
          rates: {
            include: {
              provider: true,
              freightItems: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getCustomerStats(
  organizationId: string
): Promise<CustomerStats> {
  const [totalCustomers, totalShipments, allCustomers] = await Promise.all([
    prisma.customer.count({
      where: { organizationId },
    }),
    prisma.shipment.count({
      where: { customer: { organizationId } },
    }),
    prisma.customer.findMany({
      where: { organizationId },
      select: {
        commodity: true,
        industrialZone: true,
      },
    }),
  ]);

  const uniqueCommodities = new Set(
    allCustomers.map((c) => c.commodity).filter(Boolean)
  ).size;
  const uniqueZones = new Set(
    allCustomers.map((c) => c.industrialZone).filter(Boolean)
  ).size;

  return {
    totalCustomers,
    totalShipments,
    totalCommodities: uniqueCommodities,
    totalZones: uniqueZones,
  };
}

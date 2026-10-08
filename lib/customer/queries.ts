import { prisma } from "@/lib/db/prisma";
import type { CustomerItem, CustomerStats } from "./types";

export async function getCustomers(
  organizationId?: string | null,
  search?: string,
  isPlatformAdmin = false
): Promise<CustomerItem[]> {
  if (!organizationId && !isPlatformAdmin) return [];

  const orgFilter =
    isPlatformAdmin && !organizationId ? {} : { organizationId: organizationId! };

  return prisma.customer.findMany({
    where: {
      ...orgFilter,
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
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: { shipments: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCustomerById(
  id: string,
  organizationId?: string | null,
  isPlatformAdmin = false
) {
  if (!organizationId && !isPlatformAdmin) return null;

  const orgFilter =
    isPlatformAdmin && !organizationId ? {} : { organizationId: organizationId! };

  return prisma.customer.findFirst({
    where: {
      id,
      ...orgFilter,
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
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
  organizationId?: string | null,
  isPlatformAdmin = false
): Promise<CustomerStats> {
  if (!organizationId && !isPlatformAdmin) {
    return {
      totalCustomers: 0,
      totalShipments: 0,
      totalCommodities: 0,
      totalZones: 0,
    };
  }

  const orgFilter =
    isPlatformAdmin && !organizationId ? {} : { organizationId: organizationId! };
  const shipmentFilter =
    isPlatformAdmin && !organizationId
      ? {}
      : { customer: { organizationId: organizationId! } };

  const [totalCustomers, totalShipments, allCustomers] = await Promise.all([
    prisma.customer.count({
      where: orgFilter,
    }),
    prisma.shipment.count({
      where: shipmentFilter,
    }),
    prisma.customer.findMany({
      where: orgFilter,
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

import { prisma } from "@/lib/db/prisma";
import type { ShipmentItem, ShipmentStats, ShipmentDirection } from "./types";

export interface GetShipmentsOptions {
  customerId?: string;
  search?: string;
  direction?: ShipmentDirection;
  isPlatformAdmin?: boolean;
}

export async function getShipments(
  organizationId?: string | null,
  options: GetShipmentsOptions = {}
): Promise<ShipmentItem[]> {
  const { customerId, search, direction, isPlatformAdmin = false } = options;

  if (!organizationId && !isPlatformAdmin) return [];

  const orgFilter =
    isPlatformAdmin && !organizationId
      ? {}
      : { customer: { organizationId: organizationId! } };

  return prisma.shipment.findMany({
    where: {
      ...orgFilter,
      ...(customerId ? { customerId } : {}),
      ...(direction ? { direction } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { commodity: { contains: search, mode: "insensitive" } },
              {
                customer: {
                  companyName: { contains: search, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      customer: {
        select: {
          id: true,
          companyName: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          rates: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getShipmentById(
  id: string,
  organizationId?: string | null,
  isPlatformAdmin = false
): Promise<ShipmentItem | null> {
  if (!organizationId && !isPlatformAdmin) return null;

  const orgFilter =
    isPlatformAdmin && !organizationId
      ? {}
      : { customer: { organizationId: organizationId! } };

  return prisma.shipment.findFirst({
    where: {
      id,
      ...orgFilter,
    },
    include: {
      customer: {
        select: {
          id: true,
          companyName: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          rates: true,
        },
      },
    },
  });
}

export async function getShipmentStats(
  organizationId?: string | null,
  isPlatformAdmin = false
): Promise<ShipmentStats> {
  if (!organizationId && !isPlatformAdmin) {
    return {
      totalShipments: 0,
      importCount: 0,
      exportCount: 0,
      totalCustomers: 0,
    };
  }

  const orgFilter =
    isPlatformAdmin && !organizationId
      ? {}
      : { customer: { organizationId: organizationId! } };

  const [totalShipments, importCount, exportCount, allShipments] =
    await Promise.all([
      prisma.shipment.count({
        where: orgFilter,
      }),
      prisma.shipment.count({
        where: {
          ...orgFilter,
          direction: "IMPORT",
        },
      }),
      prisma.shipment.count({
        where: {
          ...orgFilter,
          direction: "EXPORT",
        },
      }),
      prisma.shipment.findMany({
        where: orgFilter,
        select: {
          customerId: true,
        },
      }),
    ]);

  const uniqueCustomers = new Set(allShipments.map((s) => s.customerId)).size;

  return {
    totalShipments,
    importCount,
    exportCount,
    totalCustomers: uniqueCustomers,
  };
}

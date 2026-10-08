import { prisma } from "@/lib/db/prisma";
import type {
  ProviderItem,
  ShipmentRateItem,
  ShipmentComparisonDetail,
  FreightItemSummary,
} from "./types";

export async function getProviders(
  organizationId?: string | null,
  isPlatformAdmin = false
): Promise<ProviderItem[]> {
  if (!organizationId && !isPlatformAdmin) return [];

  const filter =
    isPlatformAdmin && !organizationId ? {} : { organizationId: organizationId! };

  return prisma.provider.findMany({
    where: filter,
    include: {
      _count: {
        select: {
          shipmentRates: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getAvailableShipmentsForRates(
  organizationId?: string | null,
  isPlatformAdmin = false
) {
  if (!organizationId && !isPlatformAdmin) return [];

  const orgFilter =
    isPlatformAdmin && !organizationId
      ? {}
      : { customer: { organizationId: organizationId! } };

  return prisma.shipment.findMany({
    where: orgFilter,
    select: {
      id: true,
      name: true,
      direction: true,
      customer: {
        select: {
          id: true,
          companyName: true,
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

export async function getShipmentRateComparison(
  shipmentId: string,
  organizationId?: string | null,
  isPlatformAdmin = false
): Promise<ShipmentComparisonDetail | null> {
  if (!organizationId && !isPlatformAdmin) return null;

  const orgFilter =
    isPlatformAdmin && !organizationId
      ? {}
      : { customer: { organizationId: organizationId! } };

  const shipment = await prisma.shipment.findFirst({
    where: {
      id: shipmentId,
      ...orgFilter,
    },
    include: {
      customer: {
        select: {
          id: true,
          companyName: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      rates: {
        include: {
          provider: true,
          freightItems: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!shipment) return null;

  const rates: ShipmentRateItem[] = shipment.rates.map((rate) => {
    let totalNet = 0;
    let totalGross = 0;
    let totalProfit = 0;
    let primaryCurrency = "USD";

    const freightItems: FreightItemSummary[] = rate.freightItems.map((fi) => {
      const net = Number(fi.net) || 0;
      const quantity = Number(fi.quantity) || 0;
      const gross = Number(fi.gross) || 0;
      const profit = Number(fi.profit) || 0;

      totalNet += net * quantity;
      totalGross += gross * quantity;
      totalProfit += profit * quantity;
      if (fi.currency) primaryCurrency = fi.currency;

      return {
        id: fi.id,
        freight: fi.freight,
        unit: fi.unit,
        net,
        quantity,
        gross,
        profit,
        currency: fi.currency,
      };
    });

    const marginPercent =
      totalGross > 0 ? (totalProfit / totalGross) * 100 : 0;

    return {
      id: rate.id,
      shipmentId: rate.shipmentId,
      providerId: rate.providerId,
      provider: {
        id: rate.provider.id,
        name: rate.provider.name,
        organizationId: rate.provider.organizationId,
      },
      freightItems,
      totalNet,
      totalGross,
      totalProfit,
      marginPercent,
      primaryCurrency,
      createdAt: rate.createdAt,
    };
  });

  // Calculate best rate (lowest total net) and highest margin
  let bestRateId: string | undefined;
  let highestMarginRateId: string | undefined;
  let lowestNet = Infinity;
  let highestProfit = -Infinity;

  rates.forEach((r) => {
    if (r.freightItems.length > 0) {
      if (r.totalNet < lowestNet) {
        lowestNet = r.totalNet;
        bestRateId = r.id;
      }
      if (r.totalProfit > highestProfit) {
        highestProfit = r.totalProfit;
        highestMarginRateId = r.id;
      }
    }
  });

  return {
    id: shipment.id,
    name: shipment.name,
    direction: shipment.direction,
    commodity: shipment.commodity,
    customerId: shipment.customerId,
    customer: shipment.customer,
    rates,
    bestRateId,
    highestMarginRateId,
  };
}

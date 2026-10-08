import { prisma } from "@/lib/db/prisma";
import type {
  ProviderItem,
  ShipmentRateItem,
  ShipmentComparisonDetail,
  FreightItemSummary,
  CurrencyFinancialBucket,
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
              baseCurrency: true,
              exchangeRates: true,
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

  const orgBaseCurrency = shipment.customer.organization?.baseCurrency || "USD";
  const orgExchangeRates = shipment.customer.organization?.exchangeRates || [];

  // Helper map for currency conversion to baseCurrency
  const getFxRateToBase = (fromCurrency: string): number => {
    if (fromCurrency === orgBaseCurrency) return 1;
    // Check direct rate: fromCurrency -> orgBaseCurrency
    const direct = orgExchangeRates.find(
      (r) => r.fromCurrency === fromCurrency && r.toCurrency === orgBaseCurrency
    );
    if (direct) return Number(direct.rate) || 1;

    // Check inverse rate: orgBaseCurrency -> fromCurrency
    const inverse = orgExchangeRates.find(
      (r) => r.fromCurrency === orgBaseCurrency && r.toCurrency === fromCurrency
    );
    if (inverse && Number(inverse.rate) > 0) {
      return 1 / Number(inverse.rate);
    }

    // Default fallback: 1 (if no rate configured yet)
    return 1;
  };

  const rates: ShipmentRateItem[] = shipment.rates.map((rate) => {
    // 1. Group by currency bucket
    const bucketsMap = new Map<
      string,
      { totalNet: number; totalGross: number; totalProfit: number }
    >();

    let primaryCurrency = orgBaseCurrency;

    const freightItems: FreightItemSummary[] = rate.freightItems.map((fi) => {
      const net = Number(fi.net) || 0;
      const quantity = Number(fi.quantity) || 0;
      const gross = Number(fi.gross) || 0;
      const profit = gross - net;
      const itemCurrency = fi.currency?.trim() || orgBaseCurrency;

      primaryCurrency = itemCurrency;

      const lineNet = net * quantity;
      const lineGross = gross * quantity;
      const lineProfit = profit * quantity;

      const existingBucket = bucketsMap.get(itemCurrency) || {
        totalNet: 0,
        totalGross: 0,
        totalProfit: 0,
      };

      existingBucket.totalNet += lineNet;
      existingBucket.totalGross += lineGross;
      existingBucket.totalProfit += lineProfit;
      bucketsMap.set(itemCurrency, existingBucket);

      const fxRate = getFxRateToBase(itemCurrency);
      const convertedNet = net * fxRate;
      const convertedGross = gross * fxRate;
      const convertedProfit = convertedGross - convertedNet;

      return {
        id: fi.id,
        freight: fi.freight,
        unit: fi.unit,
        net: convertedNet,
        quantity,
        gross: convertedGross,
        profit: convertedProfit,
        currency: orgBaseCurrency,
        originalNet: net,
        originalGross: gross,
        originalCurrency: itemCurrency,
      };
    });

    const currencies: CurrencyFinancialBucket[] = Array.from(
      bucketsMap.entries()
    ).map(([curr, b]) => {
      const margin =
        b.totalGross > 0 ? (b.totalProfit / b.totalGross) * 100 : 0;
      return {
        currency: curr,
        totalNet: b.totalNet,
        totalGross: b.totalGross,
        totalProfit: b.totalProfit,
        marginPercent: margin,
      };
    });

    // 2. Compute consolidated totals converted to organization baseCurrency
    let consolidatedNet = 0;
    let consolidatedGross = 0;
    let consolidatedProfit = 0;

    currencies.forEach((b) => {
      const rateToBase = getFxRateToBase(b.currency);
      consolidatedNet += b.totalNet * rateToBase;
      consolidatedGross += b.totalGross * rateToBase;
      consolidatedProfit += b.totalProfit * rateToBase;
    });

    const consolidatedMarginPercent =
      consolidatedGross > 0
        ? (consolidatedProfit / consolidatedGross) * 100
        : 0;

    // Fallback unweighted totals (for single-currency or backward compat)
    const fallbackBucket = currencies[0];
    const totalNet = fallbackBucket ? fallbackBucket.totalNet : 0;
    const totalGross = fallbackBucket ? fallbackBucket.totalGross : 0;
    const totalProfit = fallbackBucket ? fallbackBucket.totalProfit : 0;
    const marginPercent = fallbackBucket ? fallbackBucket.marginPercent : 0;

    return {
      id: rate.id,
      shipmentId: rate.shipmentId,
      providerId: rate.providerId,
      optionName: rate.optionName,
      provider: {
        id: rate.provider.id,
        name: rate.provider.name,
        organizationId: rate.provider.organizationId,
      },
      freightItems,
      currencies,
      baseCurrency: orgBaseCurrency,
      consolidatedNet,
      consolidatedGross,
      consolidatedProfit,
      consolidatedMarginPercent,
      totalNet,
      totalGross,
      totalProfit,
      marginPercent,
      primaryCurrency,
      createdAt: rate.createdAt,
    };
  });

  // Calculate best rate (lowest consolidated net) and highest margin
  let bestRateId: string | undefined;
  let highestMarginRateId: string | undefined;
  let lowestConsolidatedNet = Infinity;
  let highestConsolidatedProfit = -Infinity;

  rates.forEach((r) => {
    if (r.freightItems.length > 0) {
      if (r.consolidatedNet < lowestConsolidatedNet) {
        lowestConsolidatedNet = r.consolidatedNet;
        bestRateId = r.id;
      }
      if (r.consolidatedProfit > highestConsolidatedProfit) {
        highestConsolidatedProfit = r.consolidatedProfit;
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
    baseCurrency: orgBaseCurrency,
    rates,
    bestRateId,
    highestMarginRateId,
  };
}

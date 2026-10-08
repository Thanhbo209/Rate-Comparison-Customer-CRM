import { prisma } from "@/lib/db/prisma";
import type {
  ProviderItem,
  ShipmentRateItem,
  ShipmentComparisonDetail,
  FreightItemSummary,
  CurrencyFinancialBucket,
  MultiShipmentRateOverview,
  OverallProfitSummary,
  AgentComparisonSummary,
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

/**
 * Fetch all shipments with all carrier rates and line items,
 * along with overall profit summaries and Agent (Carrier/Provider) comparisons.
 */
export async function getAllShipmentsRateOverview(
  organizationId?: string | null,
  isPlatformAdmin = false
): Promise<MultiShipmentRateOverview | null> {
  if (!organizationId && !isPlatformAdmin) return null;

  const orgFilter =
    isPlatformAdmin && !organizationId
      ? {}
      : { customer: { organizationId: organizationId! } };

  // Fetch organization settings for currency & exchange rates
  let orgBaseCurrency = "USD";
  let orgExchangeRates: Array<{
    fromCurrency: string;
    toCurrency: string;
    rate: unknown;
  }> = [];

  if (organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { exchangeRates: true },
    });
    if (org) {
      orgBaseCurrency = org.baseCurrency || "USD";
      orgExchangeRates = org.exchangeRates;
    }
  }

  const getFxRateToBase = (fromCurrency: string): number => {
    if (fromCurrency === orgBaseCurrency) return 1;
    const direct = orgExchangeRates.find(
      (r) => r.fromCurrency === fromCurrency && r.toCurrency === orgBaseCurrency
    );
    if (direct) return Number(direct.rate) || 1;
    const inverse = orgExchangeRates.find(
      (r) => r.fromCurrency === orgBaseCurrency && r.toCurrency === fromCurrency
    );
    if (inverse && Number(inverse.rate) > 0) {
      return 1 / Number(inverse.rate);
    }
    return 1;
  };

  const rawShipments = await prisma.shipment.findMany({
    where: orgFilter,
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
    orderBy: { createdAt: "desc" },
  });

  const agentMap = new Map<
    string,
    {
      providerId: string;
      providerName: string;
      shipmentIds: Set<string>;
      optionsCount: number;
      totalFreightItems: number;
      totalNet: number;
      totalGross: number;
      totalProfit: number;
      bestCostCount: number;
      topMarginCount: number;
    }
  >();

  let overallTotalNet = 0;
  let overallTotalGross = 0;
  let overallTotalProfit = 0;
  let overallTotalFreightItems = 0;
  let overallTotalRates = 0;

  const shipments: ShipmentComparisonDetail[] = rawShipments.map((s) => {
    const rates: ShipmentRateItem[] = s.rates.map((rate) => {
      overallTotalRates += 1;
      const bucketsMap = new Map<
        string,
        { totalNet: number; totalGross: number; totalProfit: number }
      >();

      let primaryCurrency = orgBaseCurrency;

      const freightItems: FreightItemSummary[] = rate.freightItems.map((fi) => {
        overallTotalFreightItems += 1;
        const net = Number(fi.net) || 0;
        const quantity = Number(fi.quantity) || 0;
        const gross = Number(fi.gross) || 0;
        const profit = gross - net;
        const itemCurrency = fi.currency?.trim() || orgBaseCurrency;
        primaryCurrency = itemCurrency;

        const lineNet = net * quantity;
        const lineGross = gross * quantity;
        const lineProfit = profit * quantity;

        const existing = bucketsMap.get(itemCurrency) || {
          totalNet: 0,
          totalGross: 0,
          totalProfit: 0,
        };
        existing.totalNet += lineNet;
        existing.totalGross += lineGross;
        existing.totalProfit += lineProfit;
        bucketsMap.set(itemCurrency, existing);

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

      let consolidatedNet = 0;
      let consolidatedGross = 0;
      let consolidatedProfit = 0;

      currencies.forEach((b) => {
        const fx = getFxRateToBase(b.currency);
        consolidatedNet += b.totalNet * fx;
        consolidatedGross += b.totalGross * fx;
        consolidatedProfit += b.totalProfit * fx;
      });

      const consolidatedMarginPercent =
        consolidatedGross > 0
          ? (consolidatedProfit / consolidatedGross) * 100
          : 0;

      overallTotalNet += consolidatedNet;
      overallTotalGross += consolidatedGross;
      overallTotalProfit += consolidatedProfit;

      // Track agent analytics
      const agentKey = rate.providerId;
      const agentStat = agentMap.get(agentKey) || {
        providerId: rate.providerId,
        providerName: rate.provider.name,
        shipmentIds: new Set<string>(),
        optionsCount: 0,
        totalFreightItems: 0,
        totalNet: 0,
        totalGross: 0,
        totalProfit: 0,
        bestCostCount: 0,
        topMarginCount: 0,
      };

      agentStat.shipmentIds.add(s.id);
      agentStat.optionsCount += 1;
      agentStat.totalFreightItems += freightItems.length;
      agentStat.totalNet += consolidatedNet;
      agentStat.totalGross += consolidatedGross;
      agentStat.totalProfit += consolidatedProfit;
      agentMap.set(agentKey, agentStat);

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

    let bestRateId: string | undefined;
    let highestMarginRateId: string | undefined;
    let lowestNet = Infinity;
    let highestProfit = -Infinity;

    rates.forEach((r) => {
      if (r.freightItems.length > 0) {
        if (r.consolidatedNet < lowestNet) {
          lowestNet = r.consolidatedNet;
          bestRateId = r.id;
        }
        if (r.consolidatedProfit > highestProfit) {
          highestProfit = r.consolidatedProfit;
          highestMarginRateId = r.id;
        }
      }
    });

    if (bestRateId) {
      const best = rates.find((r) => r.id === bestRateId);
      if (best) {
        const ag = agentMap.get(best.providerId);
        if (ag) ag.bestCostCount += 1;
      }
    }

    if (highestMarginRateId) {
      const top = rates.find((r) => r.id === highestMarginRateId);
      if (top) {
        const ag = agentMap.get(top.providerId);
        if (ag) ag.topMarginCount += 1;
      }
    }

    return {
      id: s.id,
      name: s.name,
      direction: s.direction,
      commodity: s.commodity,
      customerId: s.customerId,
      customer: s.customer,
      baseCurrency: orgBaseCurrency,
      rates,
      bestRateId,
      highestMarginRateId,
    };
  });

  const agentRankings: AgentComparisonSummary[] = Array.from(agentMap.values())
    .map((ag) => {
      const avgMargin =
        ag.totalGross > 0 ? (ag.totalProfit / ag.totalGross) * 100 : 0;
      return {
        providerId: ag.providerId,
        providerName: ag.providerName,
        shipmentCount: ag.shipmentIds.size,
        optionsCount: ag.optionsCount,
        totalFreightItems: ag.totalFreightItems,
        totalNet: ag.totalNet,
        totalGross: ag.totalGross,
        totalProfit: ag.totalProfit,
        averageMarginPercent: avgMargin,
        bestCostCount: ag.bestCostCount,
        topMarginCount: ag.topMarginCount,
      };
    })
    .sort((a, b) => b.totalProfit - a.totalProfit);

  const overallAvgMargin =
    overallTotalGross > 0 ? (overallTotalProfit / overallTotalGross) * 100 : 0;

  const overall: OverallProfitSummary = {
    baseCurrency: orgBaseCurrency,
    totalShipments: shipments.length,
    totalRates: overallTotalRates,
    totalFreightItems: overallTotalFreightItems,
    totalNet: overallTotalNet,
    totalGross: overallTotalGross,
    totalProfit: overallTotalProfit,
    averageMarginPercent: overallAvgMargin,
    agentRankings,
  };

  return {
    baseCurrency: orgBaseCurrency,
    shipments,
    overall,
  };
}

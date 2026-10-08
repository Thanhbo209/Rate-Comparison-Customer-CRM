export interface ExchangeRateLookup {
  fromCurrency: string;
  toCurrency: string;
  rate: number | string | unknown;
}

export interface MinimalFreightItem {
  id?: string;
  freight?: string;
  unit?: string | null;
  net: number;
  gross: number;
  quantity?: number;
  currency?: string | null;
}

export interface MinimalRateForRanking {
  id: string;
  providerId?: string;
  optionName?: string | null;
  provider?: { id: string; name: string };
  freightItems?: MinimalFreightItem[];
  // Pre-calculated values if available
  consolidatedNet?: number;
  consolidatedGross?: number;
  consolidatedProfit?: number;
}

export interface RateProfitBreakdown {
  rateId: string;
  totalNet: number;
  totalGross: number;
  totalProfit: number;
  marginPercent: number;
  hasMissingExchangeRate: boolean;
  missingCurrencies: string[];
}

export interface RateRankingResult {
  breakdowns: RateProfitBreakdown[];
  winnerId: string | null;
  winnerRate: MinimalRateForRanking | null;
  tieBreakUsed: boolean;
  unrankedRateIds: string[];
}

export interface MinimalShipmentForSummary {
  id?: string;
  selectedRateId?: string | null;
  selectedRate?: MinimalRateForRanking | null;
  bestCustomerRateId?: string | null;
  baseCurrency?: string;
  rates?: MinimalRateForRanking[];
}

export interface CustomerAgentSummaryItem {
  providerId: string;
  providerName: string;
  shipmentsWon: number;
  totalProfit: number;
  averageProfitPerShipment: number;
}

/**
 * Pure helper to resolve currency exchange rate to baseCurrency.
 * Returns null if the currency is not baseCurrency and no valid direct/inverse rate exists.
 */
export function getExchangeRateToBase(
  currency: string | undefined | null,
  baseCurrency: string,
  exchangeRates: ExchangeRateLookup[] = []
): number | null {
  const normCurr = (currency || baseCurrency).trim().toUpperCase();
  const normBase = baseCurrency.trim().toUpperCase();

  if (normCurr === normBase) {
    return 1;
  }

  // 1. Direct rate: normCurr -> normBase
  const direct = exchangeRates.find(
    (r) =>
      r.fromCurrency.trim().toUpperCase() === normCurr &&
      r.toCurrency.trim().toUpperCase() === normBase
  );
  if (direct && Number(direct.rate) > 0) {
    return Number(direct.rate);
  }

  // 2. Inverse rate: normBase -> normCurr
  const inverse = exchangeRates.find(
    (r) =>
      r.fromCurrency.trim().toUpperCase() === normBase &&
      r.toCurrency.trim().toUpperCase() === normCurr
  );
  if (inverse && Number(inverse.rate) > 0) {
    return 1 / Number(inverse.rate);
  }

  // No exchange rate configured
  return null;
}

/**
 * Pure calculation to rank ShipmentRates by absolute profit in organization's baseCurrency.
 *
 * Rules:
 * 1. "Profit" = (gross - net) * quantity per FreightItem, converted to baseCurrency, summed per ShipmentRate.
 * 2. Best agent = ShipmentRate with the highest profit.
 * 3. Tie-breaker = lower total gross (cheaper for the customer).
 * 4. Rates with a missing exchange rate are flagged and excluded from ranking.
 */
export function rankRatesByProfit(
  rates: MinimalRateForRanking[] | undefined | null,
  baseCurrency: string,
  exchangeRates: ExchangeRateLookup[] = []
): RateRankingResult {
  if (!rates || rates.length === 0) {
    return {
      breakdowns: [],
      winnerId: null,
      winnerRate: null,
      tieBreakUsed: false,
      unrankedRateIds: [],
    };
  }

  const breakdowns: RateProfitBreakdown[] = [];
  const unrankedRateIds: string[] = [];
  const contenders: { rate: MinimalRateForRanking; breakdown: RateProfitBreakdown }[] = [];

  for (const rate of rates) {
    const items = rate.freightItems || [];
    let rateNet = 0;
    let rateGross = 0;
    let hasMissingExchangeRate = false;
    const missingCurrenciesSet = new Set<string>();

    for (const item of items) {
      const itemCurr = item.currency || baseCurrency;
      const fx = getExchangeRateToBase(itemCurr, baseCurrency, exchangeRates);

      if (fx === null) {
        hasMissingExchangeRate = true;
        missingCurrenciesSet.add(itemCurr);
        continue;
      }

      const qty =
        typeof item.quantity === "number" && item.quantity > 0
          ? item.quantity
          : Number(item.quantity) || 1;
      const net = (Number(item.net) || 0) * fx * qty;
      const gross = (Number(item.gross) || 0) * fx * qty;

      rateNet += net;
      rateGross += gross;
    }

    const missingCurrencies = Array.from(missingCurrenciesSet);
    const rateProfit = rateGross - rateNet;
    const margin = rateGross > 0 ? (rateProfit / rateGross) * 100 : 0;

    const breakdown: RateProfitBreakdown = {
      rateId: rate.id,
      totalNet: rateNet,
      totalGross: rateGross,
      totalProfit: rateProfit,
      marginPercent: margin,
      hasMissingExchangeRate,
      missingCurrencies,
    };

    breakdowns.push(breakdown);

    if (hasMissingExchangeRate) {
      unrankedRateIds.push(rate.id);
    } else {
      contenders.push({ rate, breakdown });
    }
  }

  if (contenders.length === 0) {
    return {
      breakdowns,
      winnerId: null,
      winnerRate: null,
      tieBreakUsed: false,
      unrankedRateIds,
    };
  }

  // Sort contenders:
  // 1. Highest totalProfit (descending)
  // 2. Tie-break: lower totalGross (cheaper for customer, ascending)
  contenders.sort((a, b) => {
    const profitDiff = b.breakdown.totalProfit - a.breakdown.totalProfit;
    if (Math.abs(profitDiff) > 0.0001) {
      return profitDiff;
    }
    // Tie-break by lower gross
    return a.breakdown.totalGross - b.breakdown.totalGross;
  });

  const winner = contenders[0];
  let tieBreakUsed = false;

  if (contenders.length > 1) {
    const runnerUp = contenders[1];
    const profitDiff = Math.abs(winner.breakdown.totalProfit - runnerUp.breakdown.totalProfit);
    if (profitDiff <= 0.0001 && winner.breakdown.totalGross < runnerUp.breakdown.totalGross) {
      tieBreakUsed = true;
    }
  }

  return {
    breakdowns,
    winnerId: winner.rate.id,
    winnerRate: winner.rate,
    tieBreakUsed,
    unrankedRateIds,
  };
}

/**
 * Roll up each shipment's SELECTED rate (or its recommended rate if none is selected),
 * grouped by Provider.
 *
 * Returns per Provider:
 * - shipmentsWon: number of shipments won
 * - totalProfit: sum of profit across won shipments
 * - averageProfitPerShipment: totalProfit / shipmentsWon
 * Sorted by totalProfit descending.
 */
export function getCustomerAgentSummary(
  shipments: MinimalShipmentForSummary[] | undefined | null,
  baseCurrency = "USD",
  exchangeRates: ExchangeRateLookup[] = []
): CustomerAgentSummaryItem[] {
  if (!shipments || shipments.length === 0) {
    return [];
  }

  const providerMap = new Map<
    string,
    {
      providerId: string;
      providerName: string;
      shipmentsWon: number;
      totalProfit: number;
    }
  >();

  for (const s of shipments) {
    const rates = s.rates || [];
    if (rates.length === 0) continue;

    const shipmentBaseCurr = s.baseCurrency || baseCurrency;

    // 1. Determine effective winning rate:
    // Priority: selectedRate -> selectedRateId -> recommended/ranked winner -> bestCustomerRateId
    let winningRate: MinimalRateForRanking | null = null;
    let winningProfit = 0;

    if (s.selectedRate) {
      winningRate = s.selectedRate;
    } else if (s.selectedRateId) {
      winningRate = rates.find((r) => r.id === s.selectedRateId) || null;
    }

    if (winningRate) {
      // Calculate profit if not already present
      if (typeof winningRate.consolidatedProfit === "number") {
        winningProfit = winningRate.consolidatedProfit;
      } else {
        const ranking = rankRatesByProfit([winningRate], shipmentBaseCurr, exchangeRates);
        winningProfit = ranking.breakdowns[0]?.totalProfit || 0;
      }
    } else {
      // Fallback: recommended rate
      const ranking = rankRatesByProfit(rates, shipmentBaseCurr, exchangeRates);
      if (ranking.winnerRate) {
        winningRate = ranking.winnerRate;
        const b = ranking.breakdowns.find((x) => x.rateId === winningRate?.id);
        winningProfit = b?.totalProfit || winningRate.consolidatedProfit || 0;
      } else if (s.bestCustomerRateId) {
        winningRate = rates.find((r) => r.id === s.bestCustomerRateId) || null;
        winningProfit = winningRate?.consolidatedProfit || 0;
      }
    }

    if (!winningRate) continue;

    const providerId =
      winningRate.providerId || winningRate.provider?.id || "unknown";
    const providerName =
      winningRate.provider?.name || "Unknown Provider";

    const existing = providerMap.get(providerId);
    if (!existing) {
      providerMap.set(providerId, {
        providerId,
        providerName,
        shipmentsWon: 1,
        totalProfit: winningProfit,
      });
    } else {
      existing.shipmentsWon += 1;
      existing.totalProfit += winningProfit;
    }
  }

  return Array.from(providerMap.values())
    .map((item) => ({
      providerId: item.providerId,
      providerName: item.providerName,
      shipmentsWon: item.shipmentsWon,
      totalProfit: item.totalProfit,
      averageProfitPerShipment:
        item.shipmentsWon > 0 ? item.totalProfit / item.shipmentsWon : 0,
    }))
    .sort((a, b) => b.totalProfit - a.totalProfit);
}

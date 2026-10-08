/**
 * shipment-ranking.ts
 *
 * Pure functions for shipment-level profit ranking.
 *
 * Rules:
 *  - Shipment total = sum of ALL rates' consolidatedNet/Gross/Profit.
 *    Those values are already in the org base currency and already
 *    multiplied by quantity — no further conversion is needed here.
 *  - Rankings are per-customer: only shipments with the same customer.id
 *    are compared against each other.
 *  - Best shipment = highest total profit. Tie-break: lower total gross.
 *  - "Best choice" badge is shown only when ≥ 2 shipments with rates
 *    exist for the same customer.
 *  - Shipments with no rates are not ranked (rank = null).
 *
 * This file is intentionally separate from lib/rate/ranking.ts (which
 * handles per-rate profit ranking). No names clash.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShipmentForRanking {
  id: string;
  customer: { id: string };
  rates: {
    consolidatedNet: number;
    consolidatedGross: number;
    consolidatedProfit: number;
  }[];
}

export interface ShipmentTotals {
  net: number;
  gross: number;
  profit: number;
  /** profit / gross × 100; 0 when gross = 0 */
  marginPercent: number;
  rateCount: number;
}

export interface ShipmentRankResult extends ShipmentTotals {
  /** null when shipment has no rates */
  rank: number | null;
  /** how many other shipments (same customer, with rates) this is compared with */
  comparedWith: number;
  /** true only when this is the best shipment for its customer */
  isBest: boolean;
  /** profit gap below the best shipment (always ≥ 0); null when rank is null */
  profitBehindBest: number | null;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 * Compute the aggregate net/gross/profit/margin for a single shipment's
 * rates array. Rates with no items are still included (they contribute 0).
 */
export function getShipmentTotals(
  rates: ShipmentForRanking["rates"]
): ShipmentTotals {
  let net = 0;
  let gross = 0;
  let profit = 0;

  for (const r of rates) {
    net += r.consolidatedNet;
    gross += r.consolidatedGross;
    profit += r.consolidatedProfit;
  }

  const marginPercent = gross > 0 ? (profit / gross) * 100 : 0;

  return { net, gross, profit, marginPercent, rateCount: rates.length };
}

/**
 * Rank every shipment in the supplied list by total profit, grouped by
 * customer.id.
 *
 * @param shipments - Use the FULL list (before pagination / search filtering)
 *                    so that ranking is globally correct.
 * @returns A Map from shipmentId → ShipmentRankResult.
 */
export function rankShipments(
  shipments: ShipmentForRanking[]
): Map<string, ShipmentRankResult> {
  // 1. Compute totals for every shipment
  const totalsMap = new Map<string, ShipmentTotals>();
  for (const s of shipments) {
    totalsMap.set(s.id, getShipmentTotals(s.rates));
  }

  // 2. Group shipment IDs by customer
  const byCustomer = new Map<string, string[]>();
  for (const s of shipments) {
    const cid = s.customer.id;
    const existing = byCustomer.get(cid);
    if (existing) {
      existing.push(s.id);
    } else {
      byCustomer.set(cid, [s.id]);
    }
  }

  // 3. Rank within each customer group
  const result = new Map<string, ShipmentRankResult>();

  for (const [, ids] of byCustomer) {
    // Only shipments with at least 1 rate participate in the ranking
    const ranked = ids
      .filter((id) => (totalsMap.get(id)?.rateCount ?? 0) > 0)
      .sort((a, b) => {
        const pa = totalsMap.get(a)!.profit;
        const pb = totalsMap.get(b)!.profit;
        if (pb !== pa) return pb - pa; // higher profit first
        // Tie-break: lower gross is better for the customer
        const ga = totalsMap.get(a)!.gross;
        const gb = totalsMap.get(b)!.gross;
        return ga - gb;
      });

    const comparedWith = ranked.length;
    const bestProfit =
      ranked.length > 0 ? totalsMap.get(ranked[0])!.profit : 0;

    // Assign ranks to shipments that have rates
    ranked.forEach((id, idx) => {
      const totals = totalsMap.get(id)!;
      result.set(id, {
        ...totals,
        rank: idx + 1,
        comparedWith,
        isBest: idx === 0 && comparedWith >= 2,
        profitBehindBest: bestProfit - totals.profit,
      });
    });

    // Shipments with no rates get a null rank
    ids
      .filter((id) => (totalsMap.get(id)?.rateCount ?? 0) === 0)
      .forEach((id) => {
        const totals = totalsMap.get(id)!;
        result.set(id, {
          ...totals,
          rank: null,
          comparedWith,
          isBest: false,
          profitBehindBest: null,
        });
      });
  }

  return result;
}

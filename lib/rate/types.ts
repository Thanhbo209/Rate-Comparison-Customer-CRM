export interface ProviderItem {
  id: string;
  name: string;
  organizationId: string;
  _count?: {
    shipmentRates: number;
  };
}

export interface FreightItemSummary {
  id: string;
  freight: string;
  unit: string | null;
  net: number; // Converted to system baseCurrency
  quantity: number;
  gross: number; // Converted to system baseCurrency
  profit: number; // Converted to system baseCurrency
  currency: string; // The system baseCurrency it is currently displayed in
  originalNet: number;
  originalGross: number;
  originalCurrency: string;
}

export interface CurrencyFinancialBucket {
  currency: string;
  totalNet: number;
  totalGross: number;
  totalProfit: number;
  marginPercent: number;
}

export interface ShipmentRateItem {
  id: string;
  shipmentId: string;
  providerId: string;
  optionName: string | null;
  provider: ProviderItem;
  freightItems: FreightItemSummary[];
  // Currency-grouped totals
  currencies: CurrencyFinancialBucket[];
  // Consolidated totals converted to organization baseCurrency
  baseCurrency: string;
  consolidatedNet: number;
  consolidatedGross: number;
  consolidatedProfit: number;
  consolidatedMarginPercent: number;
  // Legacy / fallback primary figures
  totalNet: number;
  totalGross: number;
  totalProfit: number;
  marginPercent: number;
  primaryCurrency: string;
  hasMissingExchangeRate?: boolean;
  missingCurrencies?: string[];
  createdAt: Date | string;
}

export interface ShipmentComparisonDetail {
  id: string;
  name: string;
  direction: "IMPORT" | "EXPORT";
  commodity: string | null;
  selectedRateId?: string | null;
  customerId: string;
  customer: {
    id: string;
    companyName: string;
    organization?: {
      id: string;
      name: string;
      baseCurrency?: string;
    };
  };
  baseCurrency: string;
  rates: ShipmentRateItem[];
  // Best overall recommendation for customer based on maximum freight profit
  bestCustomerRateId?: string;
  bestCustomerRateProfit?: number;
  bestCustomerRateCarrier?: string;
  tieBreakUsed?: boolean;
  unrankedRateIds?: string[];
  // Lowest buying cost option
  bestRateId?: string;
  highestMarginRateId?: string;
  createdAt?: Date | string;
}

export interface AgentComparisonSummary {
  providerId: string;
  providerName: string;
  shipmentCount: number;
  optionsCount: number;
  totalFreightItems: number;
  totalNet: number;
  totalGross: number;
  totalProfit: number;
  averageMarginPercent: number;
  bestCostCount: number;
  topMarginCount: number;
}

export interface OverallProfitSummary {
  baseCurrency: string;
  totalShipments: number;
  totalRates: number;
  totalFreightItems: number;
  totalNet: number;
  totalGross: number;
  totalProfit: number;
  averageMarginPercent: number;
  agentRankings: AgentComparisonSummary[];
}

export interface MultiShipmentRateOverview {
  baseCurrency: string;
  shipments: ShipmentComparisonDetail[];
  overall: OverallProfitSummary;
}

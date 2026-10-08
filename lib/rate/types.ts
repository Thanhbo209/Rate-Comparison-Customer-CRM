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
  net: number;
  quantity: number;
  gross: number;
  profit: number;
  currency: string;
}

export interface ShipmentRateItem {
  id: string;
  shipmentId: string;
  providerId: string;
  provider: ProviderItem;
  freightItems: FreightItemSummary[];
  totalNet: number;
  totalGross: number;
  totalProfit: number;
  marginPercent: number;
  primaryCurrency: string;
  createdAt: Date | string;
}

export interface ShipmentComparisonDetail {
  id: string;
  name: string;
  direction: "IMPORT" | "EXPORT";
  commodity: string | null;
  customerId: string;
  customer: {
    id: string;
    companyName: string;
    organization?: {
      id: string;
      name: string;
    };
  };
  rates: ShipmentRateItem[];
  bestRateId?: string;
  highestMarginRateId?: string;
}

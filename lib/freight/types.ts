import { FreightChargeType } from "../generated/prisma/enums";

export interface FreightItemRecord {
  id: string;
  shipmentRateId: string;
  freight: string;
  unit: string | null;
  chargeType: FreightChargeType;
  quantity: number;
  net: number;
  gross: number;
  profit: number;
  currency: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface FreightItemFormData {
  shipmentRateId: string;
  freight: string;
  unit?: string;
  chargeType: string;
  quantity: number;
  net: number;
  gross: number;
  currency?: string;
}

export interface RateItemTotals {
  totalNet: number;
  totalGross: number;
  totalProfit: number;
  marginPercent: number;
  currency: string;
}

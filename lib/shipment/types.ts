export type ShipmentDirection = "IMPORT" | "EXPORT";

export interface ShipmentItem {
  id: string;
  name: string;
  direction: ShipmentDirection;
  commodity: string | null;
  customerId: string;
  customer: {
    id: string;
    companyName: string;
    organizationId: string;
    organization?: {
      id: string;
      name: string;
    };
  };
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: {
    rates: number;
  };
}

export interface ShipmentFormData {
  name: string;
  customerId: string;
  direction: ShipmentDirection;
  commodity?: string;
}

export interface ShipmentStats {
  totalShipments: number;
  importCount: number;
  exportCount: number;
  totalCustomers: number;
}

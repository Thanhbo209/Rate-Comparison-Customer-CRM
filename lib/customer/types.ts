export interface CustomerItem {
  id: string;
  organizationId: string;
  organization?: {
    id: string;
    name: string;
  };
  companyName: string;
  industrialZone: string | null;
  location: string | null;
  address: string | null;
  commodity: string | null;
  contactPerson: string | null;
  cellPhone: string | null;
  email: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: {
    shipments: number;
  };
}

export interface CustomerFormData {
  companyName: string;
  industrialZone?: string;
  location?: string;
  address?: string;
  commodity?: string;
  contactPerson?: string;
  cellPhone?: string;
  email?: string;
}

export interface CustomerStats {
  totalCustomers: number;
  totalShipments: number;
  totalCommodities: number;
  totalZones: number;
}

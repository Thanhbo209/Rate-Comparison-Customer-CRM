import { prisma } from "@/lib/db/prisma";
import { getCurrentProfile } from "@/lib/auth/session";

export interface ExchangeRateItem {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  updatedAt: Date;
}

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

export interface OrganizationSettingsData {
  user: UserProfileData;
  organization: {
    id: string;
    name: string;
    baseCurrency: string;
    createdAt: Date;
  };
  exchangeRates: ExchangeRateItem[];
  canEdit: boolean;
}

/**
 * Fetch organization settings including user profile, organization details, base currency, and exchange rates.
 */
export async function getOrganizationSettingsData(): Promise<OrganizationSettingsData | null> {
  const profile = await getCurrentProfile();
  if (!profile || !profile.organizationId) {
    return null;
  }

  const org = await prisma.organization.findUnique({
    where: { id: profile.organizationId },
    include: {
      exchangeRates: {
        orderBy: { fromCurrency: "asc" },
      },
    },
  });

  if (!org) return null;

  const canEdit =
    profile.role === "SALES_MANAGER" || profile.role === "ADMIN";

  return {
    user: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      createdAt: profile.createdAt,
    },
    organization: {
      id: org.id,
      name: org.name,
      baseCurrency: org.baseCurrency || "USD",
      createdAt: org.createdAt,
    },
    exchangeRates: org.exchangeRates.map((r) => ({
      id: r.id,
      fromCurrency: r.fromCurrency,
      toCurrency: r.toCurrency,
      rate: Number(r.rate),
      updatedAt: r.updatedAt,
    })),
    canEdit,
  };
}

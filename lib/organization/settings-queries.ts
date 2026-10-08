import { prisma } from "@/lib/db/prisma";
import { getCurrentProfile } from "@/lib/auth/session";

export interface ExchangeRateItem {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  updatedAt: Date;
}

export interface OrganizationSettingsData {
  organization: {
    id: string;
    name: string;
    baseCurrency: string;
  };
  exchangeRates: ExchangeRateItem[];
  canEdit: boolean;
}

/**
 * Fetch organization settings including base currency and exchange rates.
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
    organization: {
      id: org.id,
      name: org.name,
      baseCurrency: org.baseCurrency || "USD",
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

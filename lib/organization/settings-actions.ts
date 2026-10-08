"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentProfile } from "@/lib/auth/session";

export type SettingsActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Update organization base currency and name.
 */
export async function updateOrganizationCurrencyAction({
  baseCurrency,
}: {
  baseCurrency: string;
}): Promise<SettingsActionResponse<{ baseCurrency: string }>> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return { success: false, error: "Authentication required." };
    }

    if (!profile.organizationId) {
      return { success: false, error: "Organization required." };
    }

    if (profile.role !== "SALES_MANAGER" && profile.role !== "ADMIN") {
      return {
        success: false,
        error: "Only Sales Managers and Admins can update organization settings.",
      };
    }

    const trimmedCurrency = baseCurrency?.trim().toUpperCase();
    if (!trimmedCurrency || trimmedCurrency.length !== 3) {
      return {
        success: false,
        error: "Please enter a valid 3-letter currency code (e.g. USD, VND, EUR).",
      };
    }

    await prisma.organization.update({
      where: { id: profile.organizationId },
      data: {
        baseCurrency: trimmedCurrency,
      },
    });

    revalidatePath("/dashboard/sales/settings");
    revalidatePath("/dashboard/admin/settings");
    revalidatePath("/dashboard/sales/rates");
    revalidatePath("/dashboard/admin/rates");

    return { success: true, data: { baseCurrency: trimmedCurrency } };
  } catch (error) {
    console.error("Failed to update organization base currency:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update currency.",
    };
  }
}

/**
 * Upsert an exchange rate for the organization.
 * e.g., 1 USD = 25,400 VND or 1 EUR = 1.08 USD
 */
export async function upsertExchangeRateAction({
  fromCurrency,
  toCurrency,
  rate,
}: {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
}): Promise<SettingsActionResponse<{ id: string }>> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return { success: false, error: "Authentication required." };
    }

    if (!profile.organizationId) {
      return { success: false, error: "Organization required." };
    }

    if (profile.role !== "SALES_MANAGER" && profile.role !== "ADMIN") {
      return {
        success: false,
        error: "Only Sales Managers and Admins can manage exchange rates.",
      };
    }

    const from = fromCurrency?.trim().toUpperCase();
    const to = toCurrency?.trim().toUpperCase();
    const numRate = Number(rate);

    if (!from || from.length !== 3 || !to || to.length !== 3) {
      return {
        success: false,
        error: "Currencies must be 3-letter ISO codes (e.g. USD, VND, EUR).",
      };
    }

    if (from === to) {
      return {
        success: false,
        error: "From and To currencies cannot be the same.",
      };
    }

    if (!numRate || numRate <= 0 || isNaN(numRate)) {
      return {
        success: false,
        error: "Exchange rate must be a positive number greater than 0.",
      };
    }

    const orgId = profile.organizationId;

    const record = await prisma.organizationExchangeRate.upsert({
      where: {
        organizationId_fromCurrency_toCurrency: {
          organizationId: orgId,
          fromCurrency: from,
          toCurrency: to,
        },
      },
      update: {
        rate: numRate,
      },
      create: {
        organizationId: orgId,
        fromCurrency: from,
        toCurrency: to,
        rate: numRate,
      },
    });

    revalidatePath("/dashboard/sales/settings");
    revalidatePath("/dashboard/admin/settings");
    revalidatePath("/dashboard/sales/rates");
    revalidatePath("/dashboard/admin/rates");

    return { success: true, data: { id: record.id } };
  } catch (error) {
    console.error("Failed to upsert exchange rate:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to save exchange rate.",
    };
  }
}

/**
 * Delete an exchange rate.
 */
export async function deleteExchangeRateAction({
  id,
}: {
  id: string;
}): Promise<SettingsActionResponse<null>> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return { success: false, error: "Authentication required." };
    }

    if (!profile.organizationId) {
      return { success: false, error: "Organization required." };
    }

    if (profile.role !== "SALES_MANAGER" && profile.role !== "ADMIN") {
      return {
        success: false,
        error: "Only Sales Managers and Admins can delete exchange rates.",
      };
    }

    const existing = await prisma.organizationExchangeRate.findUnique({
      where: { id },
    });

    if (!existing || existing.organizationId !== profile.organizationId) {
      return { success: false, error: "Exchange rate not found." };
    }

    await prisma.organizationExchangeRate.delete({
      where: { id },
    });

    revalidatePath("/dashboard/sales/settings");
    revalidatePath("/dashboard/admin/settings");
    revalidatePath("/dashboard/sales/rates");
    revalidatePath("/dashboard/admin/rates");

    return { success: true, data: null };
  } catch (error) {
    console.error("Failed to delete exchange rate:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete exchange rate.",
    };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentProfile } from "@/lib/auth/session";
import type { CustomerFormData, CustomerItem } from "./types";
import {
  getCustomerAgentSummary,
  type CustomerAgentSummaryItem,
} from "@/lib/rate/ranking";

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function createCustomerAction(
  data: CustomerFormData
): Promise<ActionResponse<CustomerItem>> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return { success: false, error: "Authentication required" };
    }

    if (!profile.organizationId) {
      return {
        success: false,
        error:
          profile.role === "ADMIN"
            ? "Platform administrators must belong to an organization to create customer records."
            : "You must belong to an organization to create customer records.",
      };
    }

    if (!data.companyName?.trim()) {
      return { success: false, error: "Company name is required" };
    }

    const customer = await prisma.customer.create({
      data: {
        organizationId: profile.organizationId,
        companyName: data.companyName.trim(),
        industrialZone: data.industrialZone?.trim() || null,
        location: data.location?.trim() || null,
        address: data.address?.trim() || null,
        commodity: data.commodity?.trim() || null,
        contactPerson: data.contactPerson?.trim() || null,
        cellPhone: data.cellPhone?.trim() || null,
        email: data.email?.trim() || null,
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        _count: {
          select: { shipments: true },
        },
      },
    });

    revalidatePath("/dashboard/admin/customers");
    revalidatePath("/dashboard/sales/customers");

    return { success: true, data: customer };
  } catch (error) {
    console.error("Failed to create customer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create customer",
    };
  }
}

export async function updateCustomerAction(
  id: string,
  data: CustomerFormData
): Promise<ActionResponse<CustomerItem>> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return { success: false, error: "Authentication required" };
    }

    if (profile.role !== "ADMIN" && !profile.organizationId) {
      return { success: false, error: "Organization required" };
    }

    if (!data.companyName?.trim()) {
      return { success: false, error: "Company name is required" };
    }

    // Tenant isolation: if not platform admin, strictly restrict to user's organization
    const where =
      profile.role === "ADMIN" && !profile.organizationId
        ? { id }
        : { id, organizationId: profile.organizationId! };

    const existing = await prisma.customer.findFirst({
      where,
    });

    if (!existing) {
      return { success: false, error: "Customer not found or permission denied" };
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        companyName: data.companyName.trim(),
        industrialZone: data.industrialZone?.trim() || null,
        location: data.location?.trim() || null,
        address: data.address?.trim() || null,
        commodity: data.commodity?.trim() || null,
        contactPerson: data.contactPerson?.trim() || null,
        cellPhone: data.cellPhone?.trim() || null,
        email: data.email?.trim() || null,
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        _count: {
          select: { shipments: true },
        },
      },
    });

    revalidatePath("/dashboard/admin/customers");
    revalidatePath("/dashboard/sales/customers");

    return { success: true, data: customer };
  } catch (error) {
    console.error("Failed to update customer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update customer",
    };
  }
}

export async function deleteCustomerAction(
  id: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return { success: false, error: "Authentication required" };
    }

    if (profile.role !== "ADMIN" && !profile.organizationId) {
      return { success: false, error: "Organization required" };
    }

    // Role check: Only SALES_MANAGER or ADMIN can delete customer accounts
    if (profile.role === "SALES") {
      return {
        success: false,
        error: "Only Sales Managers or Administrators can delete customer accounts.",
      };
    }

    const where =
      profile.role === "ADMIN" && !profile.organizationId
        ? { id }
        : { id, organizationId: profile.organizationId! };

    const existing = await prisma.customer.findFirst({
      where,
    });

    if (!existing) {
      return { success: false, error: "Customer not found or permission denied" };
    }

    await prisma.customer.delete({
      where: { id },
    });

    revalidatePath("/dashboard/admin/customers");
    revalidatePath("/dashboard/sales/customers");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Failed to delete customer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete customer",
    };
  }
}

/**
 * Retrieve roll-up agent (Provider) statistics for a specific customer,
 * calculating shipmentsWon, totalProfit, and averageProfitPerShipment based
 * on selected (or recommended) rates per shipment.
 */
export async function getCustomerAgentSummaryAction(
  customerId: string
): Promise<
  ActionResponse<{
    baseCurrency: string;
    bestAgent: CustomerAgentSummaryItem | null;
    agentSummary: CustomerAgentSummaryItem[];
  }>
> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return { success: false, error: "Authentication required" };
    }

    if (!profile.organizationId && profile.role !== "ADMIN") {
      return { success: false, error: "Organization required" };
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        organization: {
          select: {
            id: true,
            baseCurrency: true,
            exchangeRates: true,
          },
        },
        shipments: {
          include: {
            selectedRate: {
              include: {
                provider: true,
                freightItems: true,
              },
            },
            rates: {
              include: {
                provider: true,
                freightItems: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return { success: false, error: "Customer not found" };
    }

    if (
      profile.role !== "ADMIN" &&
      customer.organizationId !== profile.organizationId
    ) {
      return { success: false, error: "Permission denied" };
    }

    const baseCurrency = customer.organization?.baseCurrency || "USD";
    const exchangeRates = customer.organization?.exchangeRates || [];

    const summary = getCustomerAgentSummary(
      customer.shipments.map((s) => ({
        id: s.id,
        selectedRateId: s.selectedRateId,
        selectedRate: s.selectedRate
          ? {
              id: s.selectedRate.id,
              providerId: s.selectedRate.providerId,
              provider: s.selectedRate.provider,
              freightItems: s.selectedRate.freightItems.map((fi) => ({
                id: fi.id,
                net: Number(fi.net),
                gross: Number(fi.gross),
                quantity: Number(fi.quantity),
                currency: fi.currency,
              })),
            }
          : null,
        rates: s.rates.map((r) => ({
          id: r.id,
          providerId: r.providerId,
          provider: r.provider,
          freightItems: r.freightItems.map((fi) => ({
            id: fi.id,
            net: Number(fi.net),
            gross: Number(fi.gross),
            quantity: Number(fi.quantity),
            currency: fi.currency,
          })),
        })),
      })),
      baseCurrency,
      exchangeRates.map((r) => ({
        fromCurrency: r.fromCurrency,
        toCurrency: r.toCurrency,
        rate: Number(r.rate),
      }))
    );

    return {
      success: true,
      data: {
        baseCurrency,
        bestAgent: summary[0] || null,
        agentSummary: summary,
      },
    };
  } catch (error) {
    console.error("Failed to get customer agent summary:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to calculate agent summary",
    };
  }
}


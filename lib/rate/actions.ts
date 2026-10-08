"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentProfile } from "@/lib/auth/session";

export type RateActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Create or retrieve a freight provider for the user's organization.
 */
export async function createProviderAction({
  name,
}: {
  name: string;
}): Promise<RateActionResponse<{ id: string; name: string }>> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return { success: false, error: "Authentication required." };
    }

    if (!profile.organizationId && profile.role !== "ADMIN") {
      return {
        success: false,
        error: "You must belong to an organization to add freight providers.",
      };
    }

    const trimmed = name?.trim();
    if (!trimmed || trimmed.length < 2) {
      return {
        success: false,
        error: "Provider name must be at least 2 characters long.",
      };
    }

    const orgId = profile.organizationId;
    if (!orgId) {
      return {
        success: false,
        error: "Organization context required.",
      };
    }

    const existing = await prisma.provider.findFirst({
      where: {
        organizationId: orgId,
        name: { equals: trimmed, mode: "insensitive" },
      },
    });

    if (existing) {
      return { success: true, data: existing };
    }

    const created = await prisma.provider.create({
      data: {
        organizationId: orgId,
        name: trimmed,
      },
    });

    revalidatePath("/dashboard/sales/rates");
    revalidatePath("/dashboard/admin/rates");

    return { success: true, data: created };
  } catch (error) {
    console.error("Failed to create provider:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create provider.",
    };
  }
}

/**
 * Add a carrier/provider rate comparison card to a shipment.
 */
export async function addShipmentRateAction({
  shipmentId,
  providerId,
  providerName,
  optionName,
}: {
  shipmentId: string;
  providerId?: string;
  providerName?: string;
  optionName?: string;
}): Promise<RateActionResponse<{ id: string; providerName: string }>> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return { success: false, error: "Authentication required." };
    }

    if (!profile.organizationId && profile.role !== "ADMIN") {
      return { success: false, error: "Organization required." };
    }

    // Verify shipment belongs to user's organization (tenant isolation)
    const shipmentFilter =
      profile.role === "ADMIN" && !profile.organizationId
        ? { id: shipmentId }
        : { id: shipmentId, customer: { organizationId: profile.organizationId! } };

    const shipment = await prisma.shipment.findFirst({
      where: shipmentFilter,
      include: { customer: true },
    });

    if (!shipment) {
      return {
        success: false,
        error: "Shipment not found or belongs to another organization.",
      };
    }

    let targetProviderId = providerId;

    // If new provider name was entered instead
    if (!targetProviderId && providerName?.trim()) {
      const orgId = shipment.customer.organizationId;
      const trimmed = providerName.trim();

      const existingProvider = await prisma.provider.findFirst({
        where: {
          organizationId: orgId,
          name: { equals: trimmed, mode: "insensitive" },
        },
      });

      if (existingProvider) {
        targetProviderId = existingProvider.id;
      } else {
        const createdProvider = await prisma.provider.create({
          data: {
            organizationId: orgId,
            name: trimmed,
          },
        });
        targetProviderId = createdProvider.id;
      }
    }

    if (!targetProviderId) {
      return {
        success: false,
        error: "Please select or enter a carrier/provider name.",
      };
    }

    const trimmedOptionName = optionName?.trim() || null;

    const rate = await prisma.shipmentRate.create({
      data: {
        shipmentId,
        providerId: targetProviderId,
        optionName: trimmedOptionName,
      },
      include: {
        provider: true,
      },
    });

    revalidatePath("/dashboard/sales/rates");
    revalidatePath("/dashboard/admin/rates");
    revalidatePath("/dashboard/sales/shipments");

    return {
      success: true,
      data: { id: rate.id, providerName: rate.provider.name },
    };
  } catch (error) {
    console.error("Failed to add shipment rate:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to add shipment rate.",
    };
  }
}

/**
 * Delete a carrier rate from a shipment.
 */
export async function deleteShipmentRateAction({
  shipmentRateId,
}: {
  shipmentRateId: string;
}): Promise<RateActionResponse> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return { success: false, error: "Authentication required." };
    }

    if (!profile.organizationId && profile.role !== "ADMIN") {
      return { success: false, error: "Organization required." };
    }

    // Tenant check
    const rate = await prisma.shipmentRate.findUnique({
      where: { id: shipmentRateId },
      include: {
        shipment: {
          include: { customer: true },
        },
      },
    });

    if (!rate) {
      return { success: false, error: "Rate not found." };
    }

    if (
      profile.role !== "ADMIN" &&
      rate.shipment.customer.organizationId !== profile.organizationId
    ) {
      return { success: false, error: "Permission denied." };
    }

    await prisma.shipmentRate.delete({
      where: { id: shipmentRateId },
    });

    revalidatePath("/dashboard/sales/rates");
    revalidatePath("/dashboard/admin/rates");
    revalidatePath("/dashboard/sales/shipments");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete shipment rate:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete shipment rate.",
    };
  }
}

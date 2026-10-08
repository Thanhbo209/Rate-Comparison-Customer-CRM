"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentProfile } from "@/lib/auth/session";
import type { FreightItemFormData, FreightItemRecord } from "./types";

export type FreightActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Add an itemized freight charge line to a shipment carrier rate.
 */
export async function createFreightItemAction(
  data: FreightItemFormData
): Promise<FreightActionResponse<FreightItemRecord>> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return { success: false, error: "Authentication required." };
    }

    if (!profile.organizationId && profile.role !== "ADMIN") {
      return { success: false, error: "Organization required." };
    }

    if (!data.freight?.trim()) {
      return { success: false, error: "Freight item charge description is required." };
    }

    if (!data.shipmentRateId) {
      return { success: false, error: "Shipment rate ID is required." };
    }

    // Verify tenant isolation: ensure rate belongs to customer of user's organization
    const rate = await prisma.shipmentRate.findUnique({
      where: { id: data.shipmentRateId },
      include: {
        shipment: {
          include: {
            customer: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!rate) {
      return { success: false, error: "Shipment rate not found." };
    }

    if (
      profile.role !== "ADMIN" &&
      rate.shipment.customer.organizationId !== profile.organizationId
    ) {
      return { success: false, error: "Permission denied." };
    }

    const orgBaseCurrency =
      rate.shipment.customer.organization?.baseCurrency || "USD";

    const net = Number(data.net) || 0;
    const gross = Number(data.gross) || 0;
    const quantity = Math.max(0.001, Number(data.quantity) || 1);
    const currency = orgBaseCurrency;

    const item = await prisma.freightItem.create({
      data: {
        shipmentRateId: data.shipmentRateId,
        freight: data.freight.trim(),
        unit: data.unit?.trim() || "CONTAINER",
        quantity,
        net,
        gross,
        currency,
      },
    });

    revalidatePath("/dashboard/sales/rates");
    revalidatePath("/dashboard/admin/rates");
    revalidatePath("/dashboard/sales/shipments");

    return {
      success: true,
      data: {
        id: item.id,
        shipmentRateId: item.shipmentRateId,
        freight: item.freight,
        unit: item.unit,
        quantity: Number(item.quantity),
        net: Number(item.net),
        gross: Number(item.gross),
        profit: Number(item.gross) - Number(item.net),
        currency: item.currency,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    };
  } catch (error) {
    console.error("Failed to create freight item:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create freight item.",
    };
  }
}

/**
 * Update an existing freight item.
 */
export async function updateFreightItemAction(
  id: string,
  data: Partial<FreightItemFormData>
): Promise<FreightActionResponse<FreightItemRecord>> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return { success: false, error: "Authentication required." };
    }

    if (!profile.organizationId && profile.role !== "ADMIN") {
      return { success: false, error: "Organization required." };
    }

    const existing = await prisma.freightItem.findUnique({
      where: { id },
      include: {
        shipmentRate: {
          include: {
            shipment: { include: { customer: true } },
          },
        },
      },
    });

    if (!existing) {
      return { success: false, error: "Freight item not found." };
    }

    if (
      profile.role !== "ADMIN" &&
      existing.shipmentRate.shipment.customer.organizationId !==
        profile.organizationId
    ) {
      return { success: false, error: "Permission denied." };
    }

    const net = data.net !== undefined ? Number(data.net) : Number(existing.net);
    const gross =
      data.gross !== undefined ? Number(data.gross) : Number(existing.gross);
    const quantity =
      data.quantity !== undefined
        ? Math.max(0.001, Number(data.quantity))
        : Number(existing.quantity);

    const updated = await prisma.freightItem.update({
      where: { id },
      data: {
        freight: data.freight?.trim() || existing.freight,
        unit: data.unit !== undefined ? data.unit.trim() : existing.unit,
        quantity,
        net,
        gross,
        currency: data.currency?.trim() || existing.currency,
      },
    });

    revalidatePath("/dashboard/sales/rates");
    revalidatePath("/dashboard/admin/rates");
    revalidatePath("/dashboard/sales/shipments");

    return {
      success: true,
      data: {
        id: updated.id,
        shipmentRateId: updated.shipmentRateId,
        freight: updated.freight,
        unit: updated.unit,
        quantity: Number(updated.quantity),
        net: Number(updated.net),
        gross: Number(updated.gross),
        profit: Number(updated.gross) - Number(updated.net),
        currency: updated.currency,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    };
  } catch (error) {
    console.error("Failed to update freight item:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update freight item.",
    };
  }
}

/**
 * Delete a freight line item.
 */
export async function deleteFreightItemAction(
  id: string
): Promise<FreightActionResponse<{ id: string }>> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return { success: false, error: "Authentication required." };
    }

    if (!profile.organizationId && profile.role !== "ADMIN") {
      return { success: false, error: "Organization required." };
    }

    const existing = await prisma.freightItem.findUnique({
      where: { id },
      include: {
        shipmentRate: {
          include: {
            shipment: { include: { customer: true } },
          },
        },
      },
    });

    if (!existing) {
      return { success: false, error: "Freight item not found." };
    }

    if (
      profile.role !== "ADMIN" &&
      existing.shipmentRate.shipment.customer.organizationId !==
        profile.organizationId
    ) {
      return { success: false, error: "Permission denied." };
    }

    await prisma.freightItem.delete({
      where: { id },
    });

    revalidatePath("/dashboard/sales/rates");
    revalidatePath("/dashboard/admin/rates");
    revalidatePath("/dashboard/sales/shipments");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Failed to delete freight item:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete freight item.",
    };
  }
}

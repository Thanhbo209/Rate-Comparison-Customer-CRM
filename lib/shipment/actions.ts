"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentProfile } from "@/lib/auth/session";
import type { ShipmentFormData, ShipmentItem } from "./types";

export type ShipmentActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function createShipmentAction(
  data: ShipmentFormData
): Promise<ShipmentActionResponse<ShipmentItem>> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return { success: false, error: "Authentication required." };
    }

    if (!profile.organizationId && profile.role !== "ADMIN") {
      return {
        success: false,
        error: "You must belong to an organization to create shipments.",
      };
    }

    if (!data.name?.trim()) {
      return { success: false, error: "Shipment name or reference is required." };
    }

    if (!data.customerId) {
      return { success: false, error: "Please select a customer for this shipment." };
    }

    // Verify that the customer belongs to the user's organization (tenant isolation)
    const customerFilter =
      profile.role === "ADMIN" && !profile.organizationId
        ? { id: data.customerId }
        : { id: data.customerId, organizationId: profile.organizationId! };

    const customer = await prisma.customer.findFirst({
      where: customerFilter,
    });

    if (!customer) {
      return {
        success: false,
        error: "Customer not found or belongs to another organization.",
      };
    }

    const shipment = await prisma.shipment.create({
      data: {
        name: data.name.trim(),
        customerId: customer.id,
        direction: data.direction,
        commodity: data.commodity?.trim() || null,
      },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            organizationId: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            rates: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/sales/shipments");
    revalidatePath("/dashboard/admin/shipments");
    revalidatePath("/dashboard/sales/customers");

    return { success: true, data: shipment };
  } catch (error) {
    console.error("Failed to create shipment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create shipment.",
    };
  }
}

export async function updateShipmentAction(
  id: string,
  data: ShipmentFormData
): Promise<ShipmentActionResponse<ShipmentItem>> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return { success: false, error: "Authentication required." };
    }

    if (!profile.organizationId && profile.role !== "ADMIN") {
      return { success: false, error: "Organization required." };
    }

    if (!data.name?.trim()) {
      return { success: false, error: "Shipment name or reference is required." };
    }

    // Verify shipment exists and belongs to the user's organization
    const shipmentFilter =
      profile.role === "ADMIN" && !profile.organizationId
        ? { id }
        : { id, customer: { organizationId: profile.organizationId! } };

    const existing = await prisma.shipment.findFirst({
      where: shipmentFilter,
    });

    if (!existing) {
      return {
        success: false,
        error: "Shipment not found or permission denied.",
      };
    }

    // If customer is being changed, verify new customer also belongs to user's org
    if (data.customerId && data.customerId !== existing.customerId) {
      const customerFilter =
        profile.role === "ADMIN" && !profile.organizationId
          ? { id: data.customerId }
          : { id: data.customerId, organizationId: profile.organizationId! };

      const customer = await prisma.customer.findFirst({
        where: customerFilter,
      });

      if (!customer) {
        return {
          success: false,
          error: "Selected customer does not belong to your organization.",
        };
      }
    }

    const updated = await prisma.shipment.update({
      where: { id },
      data: {
        name: data.name.trim(),
        customerId: data.customerId,
        direction: data.direction,
        commodity: data.commodity?.trim() || null,
      },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            organizationId: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            rates: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/sales/shipments");
    revalidatePath("/dashboard/admin/shipments");
    revalidatePath("/dashboard/sales/customers");

    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update shipment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update shipment.",
    };
  }
}

export async function deleteShipmentAction(
  id: string
): Promise<ShipmentActionResponse<{ id: string }>> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return { success: false, error: "Authentication required." };
    }

    if (!profile.organizationId && profile.role !== "ADMIN") {
      return { success: false, error: "Organization required." };
    }

    // Role check: Only SALES_MANAGER or ADMIN can delete shipments
    if (profile.role === "SALES") {
      return {
        success: false,
        error: "Only Sales Managers or Administrators can delete shipments.",
      };
    }

    const shipmentFilter =
      profile.role === "ADMIN" && !profile.organizationId
        ? { id }
        : { id, customer: { organizationId: profile.organizationId! } };

    const existing = await prisma.shipment.findFirst({
      where: shipmentFilter,
    });

    if (!existing) {
      return {
        success: false,
        error: "Shipment not found or permission denied.",
      };
    }

    await prisma.shipment.delete({
      where: { id },
    });

    revalidatePath("/dashboard/sales/shipments");
    revalidatePath("/dashboard/admin/shipments");
    revalidatePath("/dashboard/sales/customers");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Failed to delete shipment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete shipment.",
    };
  }
}

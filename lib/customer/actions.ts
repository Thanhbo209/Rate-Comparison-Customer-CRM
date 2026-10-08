"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentProfile } from "@/lib/auth/session";
import type { CustomerFormData, CustomerItem } from "./types";

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

    if (!data.companyName?.trim()) {
      return { success: false, error: "Company name is required" };
    }

    // Ensure customer belongs to current user's organization
    const existing = await prisma.customer.findFirst({
      where: { id, organizationId: profile.organizationId },
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

    // Ensure customer belongs to current user's organization
    const existing = await prisma.customer.findFirst({
      where: { id, organizationId: profile.organizationId },
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

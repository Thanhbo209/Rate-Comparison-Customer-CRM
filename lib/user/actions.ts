"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type UserActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Update user display name and profile info.
 */
export async function updateUserProfileAction({
  name,
}: {
  name: string;
}): Promise<UserActionResponse<{ name: string }>> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return { success: false, error: "Authentication required." };
    }

    const trimmed = name?.trim();
    if (!trimmed || trimmed.length < 2) {
      return {
        success: false,
        error: "Name must be at least 2 characters long.",
      };
    }

    // 1. Update application DB user record
    await prisma.user.update({
      where: { id: profile.id },
      data: { name: trimmed },
    });

    // 2. Also sync Supabase auth user metadata if possible
    try {
      const supabase = await createClient();
      await supabase.auth.updateUser({
        data: { full_name: trimmed },
      });
    } catch (authErr) {
      console.warn("Failed to sync Supabase auth metadata:", authErr);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/sales/settings");
    revalidatePath("/dashboard/admin/settings");

    return { success: true, data: { name: trimmed } };
  } catch (error) {
    console.error("Failed to update user profile:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile.",
    };
  }
}

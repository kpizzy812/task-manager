"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validations/profile";

export type ActionResponse = {
  success: boolean;
  error?: string;
};

// Helper to get current user
async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return user;
}

// Get current profile with full details
export async function getProfileDetails() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      createdAt: true,
      _count: {
        select: {
          ownedProjects: true,
          assignedTasks: true,
        },
      },
    },
  });

  return profile;
}

// Update user profile
export async function updateProfile(formData: FormData): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Необходима авторизация" };
  }

  const rawData = {
    name: formData.get("name") as string,
    avatar: (formData.get("avatar") as string) || null,
  };

  const validated = updateProfileSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    await prisma.profile.update({
      where: { id: user.id },
      data: {
        name: validated.data.name,
        avatar: validated.data.avatar,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Ошибка при обновлении профиля" };
  }
}

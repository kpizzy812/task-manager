"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validations/profile";

export type ActionResponse = {
  success: boolean;
  error?: string;
};

export type UploadResponse = ActionResponse & {
  url?: string;
};

const AVATAR_BUCKET = "avatars";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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

// Upload avatar to Supabase Storage
export async function uploadAvatar(formData: FormData): Promise<UploadResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Необходима авторизация" };
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, error: "Файл не выбран" };
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Допустимые форматы: JPG, PNG, WebP, GIF" };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "Максимальный размер файла: 2MB" };
  }

  const supabase = await createClient();

  // Generate unique filename
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  // Delete old avatar if exists
  const { data: existingFiles } = await supabase.storage
    .from(AVATAR_BUCKET)
    .list(user.id);

  if (existingFiles && existingFiles.length > 0) {
    const filesToDelete = existingFiles.map((f) => `${user.id}/${f.name}`);
    await supabase.storage.from(AVATAR_BUCKET).remove(filesToDelete);
  }

  // Upload new avatar
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { success: false, error: "Ошибка при загрузке файла" };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(fileName);

  const avatarUrl = urlData.publicUrl;

  // Update profile with new avatar URL
  try {
    await prisma.profile.update({
      where: { id: user.id },
      data: { avatar: avatarUrl },
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true, url: avatarUrl };
  } catch {
    return { success: false, error: "Ошибка при обновлении профиля" };
  }
}

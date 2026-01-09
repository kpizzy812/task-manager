"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

export type ActionResponse = {
  success: boolean;
  error?: string;
  message?: string; // For success messages (e.g., email confirmation)
};

export async function login(
  formData: FormData,
  inviteToken?: string
): Promise<ActionResponse> {
  const rawData = {
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  };

  const validated = loginSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  });

  if (error) {
    return { success: false, error: "Неверный email или пароль" };
  }

  // Redirect to invite page if token provided
  if (inviteToken) {
    redirect(`/invite/${inviteToken}`);
  }

  redirect("/dashboard");
}

export async function register(
  formData: FormData,
  inviteToken?: string
): Promise<ActionResponse> {
  const rawData = {
    name: formData.get("name")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
    confirmPassword: formData.get("confirmPassword")?.toString() ?? "",
  };

  const validated = registerSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const supabase = await createClient();

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      data: {
        name: validated.data.name,
      },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { success: false, error: "Пользователь с таким email уже существует" };
    }
    return { success: false, error: "Ошибка при регистрации. Попробуйте позже" };
  }

  if (!data.user) {
    return { success: false, error: "Ошибка при создании пользователя" };
  }

  // Check if email confirmation is required (session will be null)
  if (!data.session) {
    return {
      success: true,
      message: "Проверьте email для подтверждения регистрации",
    };
  }

  // Create profile in database
  try {
    await prisma.profile.create({
      data: {
        id: data.user.id,
        email: validated.data.email,
        name: validated.data.name,
      },
    });
  } catch (err) {
    // Only ignore duplicate key error (profile already exists via trigger)
    const isDuplicate = err instanceof Error &&
      (err.message.includes("Unique constraint") || err.message.includes("duplicate"));
    if (!isDuplicate) {
      console.error("Failed to create profile:", err);
    }
  }

  // Redirect to invite page if token provided
  if (inviteToken) {
    redirect(`/invite/${inviteToken}`);
  }

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

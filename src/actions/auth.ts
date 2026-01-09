"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

export type ActionResponse = {
  success: boolean;
  error?: string;
};

export async function login(formData: FormData): Promise<ActionResponse> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
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

  redirect("/dashboard");
}

export async function register(formData: FormData): Promise<ActionResponse> {
  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const validated = registerSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const supabase = await createClient();

  // Sign up user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      data: {
        name: validated.data.name,
      },
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

  // Create profile in database
  try {
    await prisma.profile.create({
      data: {
        id: data.user.id,
        email: validated.data.email,
        name: validated.data.name,
      },
    });
  } catch {
    // Profile may already exist if trigger is set up in Supabase
    // Just continue to dashboard
  }

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

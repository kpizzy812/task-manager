"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/lib/validations/project";

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

// Get all projects for current user
export async function getProjects() {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
    include: {
      owner: {
        select: { id: true, name: true, avatar: true },
      },
      members: {
        select: { userId: true, role: true },
      },
      _count: {
        select: { tasks: true },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return projects;
}

// Get single project by ID
export async function getProject(projectId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true, avatar: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      },
      _count: {
        select: { tasks: true },
      },
    },
  });

  return project;
}

// Create new project
export async function createProject(formData: FormData): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Необходима авторизация" };
  }

  const rawData = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
  };

  const validated = createProjectSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    const project = await prisma.project.create({
      data: {
        name: validated.data.name,
        description: validated.data.description,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    revalidatePath("/dashboard");
    redirect(`/projects/${project.id}`);
  } catch {
    return { success: false, error: "Ошибка при создании проекта" };
  }
}

// Update project
export async function updateProject(
  projectId: string,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Необходима авторизация" };
  }

  // Check if user has access to project
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: user.id },
        { members: { some: { userId: user.id, role: { in: ["OWNER", "ADMIN"] } } } },
      ],
    },
  });

  if (!project) {
    return { success: false, error: "Проект не найден или нет доступа" };
  }

  const rawData = {
    name: (formData.get("name") as string) || undefined,
    description: formData.get("description") as string | null,
  };

  const validated = updateProjectSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        name: validated.data.name,
        description: validated.data.description,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Ошибка при обновлении проекта" };
  }
}

// Delete project
export async function deleteProject(projectId: string): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Необходима авторизация" };
  }

  // Only owner can delete project
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: user.id,
    },
  });

  if (!project) {
    return { success: false, error: "Проект не найден или нет доступа" };
  }

  try {
    await prisma.project.delete({
      where: { id: projectId },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Ошибка при удалении проекта" };
  }
}

// Get current user profile
export async function getCurrentProfile() {
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
    },
  });

  return profile;
}

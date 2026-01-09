"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  createProjectSchema,
  updateProjectSchema,
  inviteMemberSchema,
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

  let projectId: string;

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
    projectId = project.id;
  } catch {
    return { success: false, error: "Ошибка при создании проекта" };
  }

  revalidatePath("/dashboard");
  redirect(`/projects/${projectId}`);
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

// ==================== INVITATIONS ====================

// Invite member to project
export async function inviteMember(
  projectId: string,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Необходима авторизация" };
  }

  // Check if user is owner or admin
  const membership = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId: user.id,
      role: { in: ["OWNER", "ADMIN"] },
    },
  });

  if (!membership) {
    return { success: false, error: "Нет прав для приглашения участников" };
  }

  const rawData = {
    email: formData.get("email") as string,
  };

  const validated = inviteMemberSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const email = validated.data.email.toLowerCase();

  // Check if user is already a member
  const existingMember = await prisma.projectMember.findFirst({
    where: {
      projectId,
      user: { email },
    },
  });

  if (existingMember) {
    return { success: false, error: "Пользователь уже является участником проекта" };
  }

  // Check if invitation already exists
  const existingInvitation = await prisma.invitation.findFirst({
    where: {
      projectId,
      email,
      status: "PENDING",
    },
  });

  if (existingInvitation) {
    return { success: false, error: "Приглашение уже отправлено на этот email" };
  }

  try {
    await prisma.invitation.create({
      data: {
        email,
        projectId,
        senderId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    revalidatePath(`/projects/${projectId}/settings`);
    return { success: true };
  } catch {
    return { success: false, error: "Ошибка при отправке приглашения" };
  }
}

// Get pending invitations for project
export async function getProjectInvitations(projectId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  // Check access
  const membership = await prisma.projectMember.findFirst({
    where: { projectId, userId: user.id },
  });

  if (!membership) {
    return [];
  }

  const invitations = await prisma.invitation.findMany({
    where: {
      projectId,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    include: {
      sender: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return invitations;
}

// Cancel invitation
export async function cancelInvitation(invitationId: string): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Необходима авторизация" };
  }

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: { project: true },
  });

  if (!invitation) {
    return { success: false, error: "Приглашение не найдено" };
  }

  // Check if user is owner or admin
  const membership = await prisma.projectMember.findFirst({
    where: {
      projectId: invitation.projectId,
      userId: user.id,
      role: { in: ["OWNER", "ADMIN"] },
    },
  });

  if (!membership) {
    return { success: false, error: "Нет прав для отмены приглашения" };
  }

  try {
    await prisma.invitation.delete({
      where: { id: invitationId },
    });

    revalidatePath(`/projects/${invitation.projectId}/settings`);
    return { success: true };
  } catch {
    return { success: false, error: "Ошибка при отмене приглашения" };
  }
}

// Get invitation by token
export async function getInvitationByToken(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      project: {
        select: { id: true, name: true, description: true },
      },
      sender: {
        select: { name: true, email: true },
      },
    },
  });

  if (!invitation) {
    return null;
  }

  // Check if expired
  if (invitation.expiresAt < new Date() || invitation.status !== "PENDING") {
    return null;
  }

  return invitation;
}

// Accept invitation
export async function acceptInvitation(token: string): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Необходима авторизация" };
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { email: true },
  });

  if (!profile) {
    return { success: false, error: "Профиль не найден" };
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    return { success: false, error: "Приглашение не найдено" };
  }

  if (invitation.status !== "PENDING") {
    return { success: false, error: "Приглашение уже использовано" };
  }

  if (invitation.expiresAt < new Date()) {
    return { success: false, error: "Срок действия приглашения истёк" };
  }

  // Check if email matches
  if (invitation.email.toLowerCase() !== profile.email.toLowerCase()) {
    return { success: false, error: "Это приглашение предназначено для другого email" };
  }

  // Check if already a member
  const existingMember = await prisma.projectMember.findFirst({
    where: {
      projectId: invitation.projectId,
      userId: user.id,
    },
  });

  if (existingMember) {
    // Update invitation status
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });
    return { success: false, error: "Вы уже являетесь участником этого проекта" };
  }

  try {
    await prisma.$transaction([
      prisma.projectMember.create({
        data: {
          projectId: invitation.projectId,
          userId: user.id,
          role: "MEMBER",
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      }),
    ]);

    revalidatePath("/dashboard");
    revalidatePath(`/projects/${invitation.projectId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Ошибка при принятии приглашения" };
  }
}

// Decline invitation
export async function declineInvitation(token: string): Promise<ActionResponse> {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    return { success: false, error: "Приглашение не найдено" };
  }

  if (invitation.status !== "PENDING") {
    return { success: false, error: "Приглашение уже обработано" };
  }

  try {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "DECLINED" },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Ошибка при отклонении приглашения" };
  }
}

// ==================== MEMBERS ====================

// Get project members with details
export async function getProjectMembersWithDetails(projectId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  // Check access
  const membership = await prisma.projectMember.findFirst({
    where: { projectId, userId: user.id },
  });

  if (!membership) {
    return [];
  }

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
    },
    orderBy: [
      { role: "asc" }, // OWNER first, then ADMIN, then MEMBER
      { joinedAt: "asc" },
    ],
  });

  return members;
}

// Update member role
export async function updateMemberRole(
  projectId: string,
  memberId: string,
  role: "ADMIN" | "MEMBER"
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Необходима авторизация" };
  }

  // Only owner can change roles
  const ownerMembership = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId: user.id,
      role: "OWNER",
    },
  });

  if (!ownerMembership) {
    return { success: false, error: "Только владелец может изменять роли" };
  }

  // Find target member
  const targetMember = await prisma.projectMember.findFirst({
    where: {
      projectId,
      user: { id: memberId },
    },
  });

  if (!targetMember) {
    return { success: false, error: "Участник не найден" };
  }

  // Cannot change owner role
  if (targetMember.role === "OWNER") {
    return { success: false, error: "Нельзя изменить роль владельца" };
  }

  try {
    await prisma.projectMember.update({
      where: { id: targetMember.id },
      data: { role },
    });

    revalidatePath(`/projects/${projectId}/settings`);
    return { success: true };
  } catch {
    return { success: false, error: "Ошибка при изменении роли" };
  }
}

// Remove member from project
export async function removeMember(
  projectId: string,
  memberId: string
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Необходима авторизация" };
  }

  // Check if user is owner or admin (or removing themselves)
  const userMembership = await prisma.projectMember.findFirst({
    where: { projectId, userId: user.id },
  });

  if (!userMembership) {
    return { success: false, error: "Нет доступа к проекту" };
  }

  // Find target member
  const targetMember = await prisma.projectMember.findFirst({
    where: {
      projectId,
      user: { id: memberId },
    },
  });

  if (!targetMember) {
    return { success: false, error: "Участник не найден" };
  }

  // Cannot remove owner
  if (targetMember.role === "OWNER") {
    return { success: false, error: "Нельзя удалить владельца проекта" };
  }

  // Check permissions
  const isSelf = memberId === user.id;
  const isOwnerOrAdmin = userMembership.role === "OWNER" || userMembership.role === "ADMIN";

  if (!isSelf && !isOwnerOrAdmin) {
    return { success: false, error: "Нет прав для удаления участника" };
  }

  // Admin cannot remove other admins
  if (userMembership.role === "ADMIN" && targetMember.role === "ADMIN" && !isSelf) {
    return { success: false, error: "Администратор не может удалить другого администратора" };
  }

  try {
    await prisma.projectMember.delete({
      where: { id: targetMember.id },
    });

    revalidatePath(`/projects/${projectId}/settings`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Ошибка при удалении участника" };
  }
}

// Leave project (alias for removing self)
export async function leaveProject(projectId: string): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Необходима авторизация" };
  }

  return removeMember(projectId, user.id);
}

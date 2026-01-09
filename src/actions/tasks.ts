"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkProjectAccess } from "@/lib/auth";
import {
  createTaskSchema,
  updateTaskSchema,
  type TaskStatus,
} from "@/lib/validations/task";

export type ActionResponse = {
  success: boolean;
  error?: string;
};

// Get all tasks for a project grouped by status
export async function getTasksByProject(projectId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const hasAccess = await checkProjectAccess(projectId, user.id);
  if (!hasAccess) {
    return null;
  }

  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      assignee: {
        select: { id: true, name: true, avatar: true },
      },
      creator: {
        select: { id: true, name: true },
      },
    },
    orderBy: { order: "asc" },
  });

  // Group tasks by status
  const groupedTasks: Record<TaskStatus, typeof tasks> = {
    TODO: [],
    IN_PROGRESS: [],
    REVIEW: [],
    DONE: [],
  };

  tasks.forEach((task) => {
    groupedTasks[task.status as TaskStatus].push(task);
  });

  return groupedTasks;
}

// Get single task
export async function getTask(taskId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        select: { id: true, name: true },
      },
      assignee: {
        select: { id: true, name: true, email: true, avatar: true },
      },
      creator: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!task) {
    return null;
  }

  const hasAccess = await checkProjectAccess(task.projectId, user.id);
  if (!hasAccess) {
    return null;
  }

  return task;
}

// Create new task
export async function createTask(
  projectId: string,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Необходима авторизация" };
  }

  const hasAccess = await checkProjectAccess(projectId, user.id);
  if (!hasAccess) {
    return { success: false, error: "Нет доступа к проекту" };
  }

  const rawData = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    status: (formData.get("status") as string) || "TODO",
    priority: (formData.get("priority") as string) || "MEDIUM",
    deadline: (formData.get("deadline") as string) || null,
    assigneeId: (formData.get("assigneeId") as string) || null,
  };

  const validated = createTaskSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    // Get max order for this status
    const maxOrder = await prisma.task.aggregate({
      where: {
        projectId,
        status: validated.data.status,
      },
      _max: { order: true },
    });

    await prisma.task.create({
      data: {
        title: validated.data.title,
        description: validated.data.description,
        status: validated.data.status,
        priority: validated.data.priority,
        deadline: validated.data.deadline
          ? new Date(validated.data.deadline)
          : null,
        assigneeId: validated.data.assigneeId || null,
        order: (maxOrder._max.order ?? 0) + 1,
        projectId,
        creatorId: user.id,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Ошибка при создании задачи" };
  }
}

// Update task
export async function updateTask(
  taskId: string,
  formData: FormData
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Необходима авторизация" };
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true },
  });

  if (!task) {
    return { success: false, error: "Задача не найдена" };
  }

  const hasAccess = await checkProjectAccess(task.projectId, user.id);
  if (!hasAccess) {
    return { success: false, error: "Нет доступа к проекту" };
  }

  const rawData = {
    title: (formData.get("title") as string) || undefined,
    description: formData.get("description") as string | null,
    status: (formData.get("status") as string) || undefined,
    priority: (formData.get("priority") as string) || undefined,
    deadline: formData.get("deadline") as string | null,
    assigneeId: formData.get("assigneeId") as string | null,
  };

  const validated = updateTaskSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        title: validated.data.title,
        description: validated.data.description,
        status: validated.data.status,
        priority: validated.data.priority,
        deadline: validated.data.deadline
          ? new Date(validated.data.deadline)
          : null,
        assigneeId: validated.data.assigneeId || null,
      },
    });

    revalidatePath(`/projects/${task.projectId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Ошибка при обновлении задачи" };
  }
}

// Update task status and order (for drag and drop)
export async function updateTaskOrder(
  taskId: string,
  newStatus: TaskStatus,
  newOrder: number
): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Необходима авторизация" };
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true, status: true, order: true },
  });

  if (!task) {
    return { success: false, error: "Задача не найдена" };
  }

  const hasAccess = await checkProjectAccess(task.projectId, user.id);
  if (!hasAccess) {
    return { success: false, error: "Нет доступа к проекту" };
  }

  try {
    // Update task status and order
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        order: newOrder,
      },
    });

    // Don't revalidate - UI is already updated optimistically
    // revalidatePath would reset the optimistic state and block UI
    return { success: true };
  } catch {
    return { success: false, error: "Ошибка при обновлении порядка" };
  }
}

// Delete task
export async function deleteTask(taskId: string): Promise<ActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Необходима авторизация" };
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true },
  });

  if (!task) {
    return { success: false, error: "Задача не найдена" };
  }

  const hasAccess = await checkProjectAccess(task.projectId, user.id);
  if (!hasAccess) {
    return { success: false, error: "Нет доступа к проекту" };
  }

  try {
    await prisma.task.delete({
      where: { id: taskId },
    });

    revalidatePath(`/projects/${task.projectId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Ошибка при удалении задачи" };
  }
}

// Get project members for assigning tasks
export async function getProjectMembers(projectId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const hasAccess = await checkProjectAccess(projectId, user.id);
  if (!hasAccess) {
    return [];
  }

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
    },
  });

  return members.map((m) => m.user);
}

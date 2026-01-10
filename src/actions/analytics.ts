"use server";

import { isPast, isToday } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// Types for analytics data
export type StatusCount = {
  status: string;
  count: number;
  label: string;
};

export type OverdueTask = {
  id: string;
  title: string;
  deadline: Date;
  priority: string;
  assignee: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
};

export type ProjectAnalytics = {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  statusCounts: StatusCount[];
  overdueTasksList: OverdueTask[];
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

// Check if user has access to project
async function checkProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
  });

  return !!project;
}

// Status labels mapping
const STATUS_LABELS: Record<string, string> = {
  TODO: "К выполнению",
  IN_PROGRESS: "В работе",
  REVIEW: "На проверке",
  DONE: "Готово",
};

// Get project analytics data
export async function getProjectAnalytics(
  projectId: string
): Promise<ProjectAnalytics | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const hasAccess = await checkProjectAccess(projectId, user.id);
  if (!hasAccess) {
    return null;
  }

  // Get all tasks for the project
  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      assignee: {
        select: { id: true, name: true, avatar: true },
      },
    },
  });

  // Calculate metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  // Match the same logic as task-deadline-indicator: overdue if past AND not today
  const overdueTasksList = tasks.filter((t) => {
    if (!t.deadline || t.status === "DONE") return false;
    const deadlineDate = new Date(t.deadline);
    return isPast(deadlineDate) && !isToday(deadlineDate);
  });
  const overdueTasks = overdueTasksList.length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Count by status
  const statusCountsMap = tasks.reduce(
    (acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const statusCounts: StatusCount[] = [
    { status: "TODO", count: statusCountsMap.TODO || 0, label: STATUS_LABELS.TODO },
    { status: "IN_PROGRESS", count: statusCountsMap.IN_PROGRESS || 0, label: STATUS_LABELS.IN_PROGRESS },
    { status: "REVIEW", count: statusCountsMap.REVIEW || 0, label: STATUS_LABELS.REVIEW },
    { status: "DONE", count: statusCountsMap.DONE || 0, label: STATUS_LABELS.DONE },
  ];

  // Sort overdue tasks by deadline (most urgent first)
  const sortedOverdueTasks: OverdueTask[] = overdueTasksList
    .sort((a, b) => {
      const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
      const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
      return dateA - dateB;
    })
    .map((task) => ({
      id: task.id,
      title: task.title,
      deadline: task.deadline!,
      priority: task.priority,
      assignee: task.assignee,
    }));

  return {
    totalTasks,
    completedTasks,
    overdueTasks,
    completionRate,
    statusCounts,
    overdueTasksList: sortedOverdueTasks,
  };
}

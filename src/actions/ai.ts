"use server";

import { isPast, isToday, format } from "date-fns";
import { ru } from "date-fns/locale";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  AI_GENERATE_RATE_LIMIT,
  AI_DIGEST_RATE_LIMIT,
} from "@/lib/rate-limit";
import { chatCompletion, parseAIJson } from "@/lib/ai/deepseek";
import { buildTaskGenerationPrompt, buildDigestPrompt } from "@/lib/ai/prompts";
import { handleAIError } from "@/lib/ai/errors";
import {
  aiGeneratedTaskSchema,
  generateTaskInputSchema,
  type AIGeneratedTask,
} from "@/lib/validations/ai";
import { type DigestTasksInput, type AIGeneratedProject } from "@/lib/ai/types";
import { addDays } from "date-fns";

/**
 * Generate task details using AI
 */
export async function generateTaskDetails(title: string): Promise<{
  data?: AIGeneratedTask;
  error?: string;
}> {
  try {
    // Validate input
    const validation = generateTaskInputSchema.safeParse({ title });
    if (!validation.success) {
      return { error: validation.error.issues[0].message };
    }

    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Необходима авторизация" };
    }

    // Rate limiting by user ID
    const rateCheck = checkRateLimit(
      `ai-generate:${user.id}`,
      AI_GENERATE_RATE_LIMIT
    );
    if (!rateCheck.success) {
      return {
        error: `Превышен лимит запросов. Попробуйте через ${rateCheck.resetIn} сек.`,
      };
    }

    // Call AI
    const prompt = buildTaskGenerationPrompt(title);
    const response = await chatCompletion([{ role: "user", content: prompt }]);

    // Parse and validate response
    const parsed = parseAIJson<AIGeneratedTask>(response);
    const validated = aiGeneratedTaskSchema.safeParse(parsed);

    if (!validated.success) {
      console.error("AI response validation failed:", validated.error);
      return { error: "Некорректный ответ от AI" };
    }

    return { data: validated.data };
  } catch (error) {
    console.error("AI generate error:", error);
    return { error: handleAIError(error) };
  }
}

/**
 * Generate daily digest for a project
 */
export async function getProjectDigest(projectId: string): Promise<{
  content?: string;
  error?: string;
}> {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Необходима авторизация" };
    }

    // Check project access
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: user.id,
      },
    });

    if (!membership) {
      return { error: "Нет доступа к проекту" };
    }

    // Rate limiting
    const rateCheck = checkRateLimit(
      `ai-digest:${user.id}`,
      AI_DIGEST_RATE_LIMIT
    );
    if (!rateCheck.success) {
      return {
        error: `Превышен лимит запросов. Попробуйте через ${Math.ceil(rateCheck.resetIn / 60)} мин.`,
      };
    }

    // Get user's tasks in the project
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        OR: [{ assigneeId: user.id }, { creatorId: user.id }],
      },
      orderBy: [{ priority: "desc" }, { deadline: "asc" }],
      take: 30,
    });

    // Calculate stats
    const stats = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "TODO").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      review: tasks.filter((t) => t.status === "REVIEW").length,
      done: tasks.filter((t) => t.status === "DONE").length,
      overdue: tasks.filter(
        (t) =>
          t.deadline &&
          t.status !== "DONE" &&
          isPast(t.deadline) &&
          !isToday(t.deadline)
      ).length,
    };

    // Format tasks list
    const activeTasks = tasks.filter((t) => t.status !== "DONE").slice(0, 10);
    const tasksList = activeTasks
      .map((t) => {
        const priority =
          t.priority === "URGENT"
            ? "🔴"
            : t.priority === "HIGH"
              ? "🟠"
              : t.priority === "MEDIUM"
                ? "🟡"
                : "🟢";
        const deadline = t.deadline
          ? ` (до ${format(t.deadline, "d MMM", { locale: ru })})`
          : "";
        const overdue =
          t.deadline && isPast(t.deadline) && !isToday(t.deadline)
            ? " ⚠️ просрочено"
            : "";
        return `${priority} ${t.title}${deadline}${overdue}`;
      })
      .join("\n");

    const digestInput: DigestTasksInput = {
      ...stats,
      tasksList,
    };

    // Call AI
    const prompt = buildDigestPrompt(digestInput);
    const content = await chatCompletion(
      [{ role: "user", content: prompt }],
      { max_tokens: 500 }
    );

    return { content };
  } catch (error) {
    console.error("AI digest error:", error);
    return { error: handleAIError(error) };
  }
}

/**
 * Create project with tasks from AI-generated data
 */
export async function createProjectFromAI(data: AIGeneratedProject): Promise<{
  projectId?: string;
  error?: string;
}> {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Необходима авторизация" };
    }

    // Validate project data
    if (!data.project?.name || data.project.name.length < 2) {
      return { error: "Некорректное название проекта" };
    }

    // Create project with tasks in transaction
    const project = await prisma.$transaction(async (tx) => {
      // Create project
      const newProject = await tx.project.create({
        data: {
          name: data.project.name.slice(0, 100),
          description: data.project.description?.slice(0, 500) || null,
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: "OWNER",
            },
          },
        },
      });

      // Create tasks
      if (data.tasks && data.tasks.length > 0) {
        const tasksToCreate = data.tasks.slice(0, 10).map((task, index) => ({
          title: task.title.slice(0, 200),
          description: task.description?.slice(0, 2000) || null,
          status: "TODO" as const,
          priority: task.priority || "MEDIUM",
          deadline: task.deadlineDays
            ? addDays(new Date(), Math.min(task.deadlineDays, 90))
            : null,
          projectId: newProject.id,
          creatorId: user.id,
          order: index,
        }));

        await tx.task.createMany({
          data: tasksToCreate,
        });
      }

      return newProject;
    });

    return { projectId: project.id };
  } catch (error) {
    console.error("Create project from AI error:", error);
    return { error: "Ошибка создания проекта" };
  }
}

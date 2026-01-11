import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { chatCompletionStream } from "@/lib/ai/deepseek";
import { buildAssistantSystemPrompt } from "@/lib/ai/prompts";
import { checkRateLimit, AI_GENERATE_RATE_LIMIT } from "@/lib/rate-limit";
import { type ChatMessage } from "@/lib/ai/types";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function getUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

async function getUserContext(userId: string) {
  // Get user's projects count
  const projectsCount = await prisma.project.count({
    where: {
      members: {
        some: { userId },
      },
    },
  });

  // Get user's active tasks (not done) across all projects
  const tasks = await prisma.task.findMany({
    where: {
      project: {
        members: {
          some: { userId },
        },
      },
      status: {
        not: "DONE",
      },
    },
    select: {
      title: true,
      status: true,
      priority: true,
      deadline: true,
      project: {
        select: { name: true },
      },
    },
    orderBy: [{ priority: "desc" }, { deadline: "asc" }],
    take: 20,
  });

  // Get user name from profile
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  // Build tasks context string
  let tasksContext = "";
  if (tasks.length > 0) {
    const priorityEmoji: Record<string, string> = {
      URGENT: "🔴",
      HIGH: "🟠",
      MEDIUM: "🟡",
      LOW: "🟢",
    };

    const statusLabels: Record<string, string> = {
      TODO: "К выполнению",
      IN_PROGRESS: "В работе",
      REVIEW: "На проверке",
      DONE: "Готово",
    };

    tasksContext = tasks
      .map((t) => {
        const emoji = priorityEmoji[t.priority] || "⚪";
        const deadline = t.deadline
          ? ` (до ${t.deadline.toLocaleDateString("ru-RU")})`
          : "";
        const status = statusLabels[t.status] || t.status;
        return `${emoji} [${t.project.name}] ${t.title}${deadline} — ${status}`;
      })
      .join("\n");
  }

  return {
    userName: profile?.name || undefined,
    projectsCount,
    tasksContext: tasksContext || undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Rate limiting
    const rateCheck = checkRateLimit(`ai-chat:${user.id}`, AI_GENERATE_RATE_LIMIT);
    if (!rateCheck.success) {
      return new Response(
        JSON.stringify({
          error: `Rate limit exceeded. Try again in ${rateCheck.resetIn}s`,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const { messages } = body as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user context for personalized system prompt
    const context = await getUserContext(user.id);
    const systemPrompt = buildAssistantSystemPrompt(context);

    // Add system prompt
    const fullMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // Get streaming response
    const stream = await chatCompletionStream(fullMessages, {
      max_tokens: 2000,
      temperature: 0.7,
    });

    // Return as streaming response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

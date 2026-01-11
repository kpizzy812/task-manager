"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Loader2,
  Bot,
  User,
  X,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type ChatMessage, type AIGeneratedProject, type AIGeneratedTasksForProject } from "@/lib/ai/types";
import { parseAIJson } from "@/lib/ai/deepseek";
import { createProjectFromAI, addTasksToProject } from "@/actions/ai";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Привет! Я AI-ассистент. Могу помочь:\n\n• Составить план на день\n• Создать новый проект с задачами\n• Добавить задачи в существующий проект\n• Дать советы по приоритетам\n\nЧем могу помочь?",
};

export function AIChatWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Prepare messages for API
      const apiMessages: ChatMessage[] = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: userMessage },
      ];

      // Call streaming API
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get response");
      }

      // Read streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      let fullResponse = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        fullResponse += chunk;

        // Update last message with streaming content
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content: fullResponse,
          };
          return newMessages;
        });
      }

      // Check if AI wants to perform an action
      if (fullResponse.includes('"action": "CREATE_PROJECT"')) {
        await handleCreateProject(fullResponse);
      } else if (fullResponse.includes('"action": "ADD_TASKS"')) {
        await handleAddTasks(fullResponse);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Ошибка чата");
      // Remove empty assistant message on error
      setMessages((prev) => prev.filter((m) => m.content !== ""));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateProject(response: string) {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
      if (!jsonMatch) return;

      const projectData = parseAIJson<AIGeneratedProject>(jsonMatch[1]);

      if (projectData.action !== "CREATE_PROJECT") return;

      setIsCreating(true);
      toast.loading("Создаю проект...", { id: "create-project" });

      const result = await createProjectFromAI(projectData);

      if (result.error) {
        toast.error(result.error, { id: "create-project" });
        return;
      }

      toast.success(`Проект "${projectData.project.name}" создан!`, {
        id: "create-project",
      });

      // Close chat and redirect to project
      setIsOpen(false);
      if (result.projectId) {
        router.push(`/projects/${result.projectId}`);
      }
    } catch (error) {
      console.error("Create project error:", error);
      toast.error("Ошибка создания проекта", { id: "create-project" });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleAddTasks(response: string) {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
      if (!jsonMatch) return;

      const tasksData = parseAIJson<AIGeneratedTasksForProject>(jsonMatch[1]);

      if (tasksData.action !== "ADD_TASKS") return;

      setIsCreating(true);
      toast.loading("Добавляю задачи...", { id: "add-tasks" });

      const result = await addTasksToProject(tasksData);

      if (result.error) {
        toast.error(result.error, { id: "add-tasks" });
        return;
      }

      toast.success(
        `Добавлено ${result.tasksCount} задач в проект!`,
        { id: "add-tasks" }
      );

      // Close chat and redirect to project
      setIsOpen(false);
      if (result.projectId) {
        router.push(`/projects/${result.projectId}`);
      }
    } catch (error) {
      console.error("Add tasks error:", error);
      toast.error("Ошибка добавления задач", { id: "add-tasks" });
    } finally {
      setIsCreating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleClearChat() {
    setMessages([INITIAL_MESSAGE]);
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110",
          isOpen
            ? "bg-muted text-muted-foreground rotate-0"
            : "bg-primary text-primary-foreground"
        )}
        aria-label={isOpen ? "Закрыть чат" : "Открыть AI чат"}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Sparkles className="h-6 w-6" />
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] transition-all duration-300",
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <Card className="flex flex-col h-[500px] max-h-[calc(100vh-140px)] shadow-2xl border-2">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/50">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">AI Ассистент</p>
                <p className="text-xs text-muted-foreground">
                  Всегда готов помочь
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="text-xs"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Новый чат
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-2",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-2 prose-headings:text-sm prose-hr:my-2">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}
                </div>

                {message.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.content === "" && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Напишите сообщение..."
                className="min-h-[40px] max-h-24 resize-none text-sm"
                disabled={isLoading || isCreating}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading || isCreating}
                className="shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type ChatMessage, type AIGeneratedProject } from "@/lib/ai/types";
import { parseAIJson } from "@/lib/ai/deepseek";
import { createProjectFromAI } from "@/actions/ai";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function ProjectChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content:
            "Привет! Я помогу создать проект с задачами. Расскажи, какой проект ты хочешь создать? Что это за цель или задача?",
        },
      ]);
    }
  }, [messages.length]);

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

      // Check if AI wants to create project
      if (fullResponse.includes('"action": "CREATE_PROJECT"')) {
        await handleCreateProject(fullResponse);
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

      // Redirect to project
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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-3xl mx-auto">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}

            <Card
              className={cn(
                "max-w-[80%] p-3",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </Card>

            {message.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.content === "" && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <Card className="p-3 bg-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Опишите ваш проект..."
            className="min-h-[44px] max-h-32 resize-none"
            disabled={isLoading || isCreating}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading || isCreating}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          <Sparkles className="w-3 h-3 inline mr-1" />
          AI создаст проект с задачами на основе вашего описания
        </p>
      </div>
    </div>
  );
}

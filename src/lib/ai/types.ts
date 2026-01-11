/**
 * Types for AI integration with OpenRouter
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamOptions {
  temperature?: number;
  max_tokens?: number;
}

export interface AIGeneratedTask {
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  deadlineDays: number;
}

export interface DigestTasksInput {
  total: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
  overdue: number;
  tasksList: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      content: string;
    };
    finish_reason: string;
  }[];
}

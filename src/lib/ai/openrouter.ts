/**
 * OpenRouter API client
 * Unified API for multiple LLM providers (OpenAI, Anthropic, etc.)
 */

import { type ChatMessage, type StreamOptions } from "./types";
import { AIError } from "./errors";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini";

/**
 * Send a chat completion request to OpenRouter
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options?: StreamOptions
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new AIError(401, "OPENROUTER_API_KEY not configured");
  }

  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Task Manager",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new AIError(response.status, errorText);
  }

  const data = await response.json();

  if (!data.choices?.[0]?.message?.content) {
    throw new AIError(500, "Invalid response from AI");
  }

  return data.choices[0].message.content;
}

/**
 * Parse JSON from AI response (handles markdown code blocks)
 */
export function parseAIJson<T>(response: string): T {
  // Remove markdown code blocks if present
  let cleaned = response.trim();

  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }

  cleaned = cleaned.trim();

  return JSON.parse(cleaned) as T;
}

/**
 * DeepSeek API client
 * OpenAI-compatible API
 */

import { type ChatMessage, type StreamOptions } from "./types";
import { AIError } from "./errors";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-chat";

/**
 * Send a chat completion request to DeepSeek
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options?: StreamOptions
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new AIError(401, "DEEPSEEK_API_KEY not configured");
  }

  const model = process.env.DEEPSEEK_MODEL || DEFAULT_MODEL;

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
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
 * Send a streaming chat completion request to DeepSeek
 * Returns a ReadableStream for real-time text generation
 */
export async function chatCompletionStream(
  messages: ChatMessage[],
  options?: StreamOptions
): Promise<ReadableStream<string>> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new AIError(401, "DEEPSEEK_API_KEY not configured");
  }

  const model = process.env.DEEPSEEK_MODEL || DEFAULT_MODEL;

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 2000,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new AIError(response.status, errorText);
  }

  if (!response.body) {
    throw new AIError(500, "No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();

      if (done) {
        controller.close();
        return;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            controller.close();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              controller.enqueue(content);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    },
  });
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

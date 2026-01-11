/**
 * AI error handling utilities
 */

export class AIError extends Error {
  constructor(
    public status: number,
    public details: string
  ) {
    super(`AI Error (${status}): ${details}`);
    this.name = "AIError";
  }
}

export function handleAIError(error: unknown): string {
  if (error instanceof AIError) {
    if (error.status === 429) return "Превышен лимит запросов к AI";
    if (error.status === 401) return "Ошибка авторизации AI";
    if (error.status === 500) return "Ошибка сервера AI";
    return "Ошибка генерации";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Неизвестная ошибка AI";
}

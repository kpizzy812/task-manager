import { z } from "zod";

export const aiGeneratedTaskSchema = z.object({
  description: z.string().max(2000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  deadlineDays: z.number().int().min(1).max(90),
});

export type AIGeneratedTask = z.infer<typeof aiGeneratedTaskSchema>;

export const generateTaskInputSchema = z.object({
  title: z.string().min(3, "Минимум 3 символа").max(200),
});

export type GenerateTaskInput = z.infer<typeof generateTaskInputSchema>;

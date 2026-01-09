import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Название проекта должно быть не менее 2 символов")
    .max(100, "Название проекта должно быть не более 100 символов"),
  description: z
    .string()
    .max(500, "Описание должно быть не более 500 символов")
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Название проекта должно быть не менее 2 символов")
    .max(100, "Название проекта должно быть не более 100 символов")
    .optional(),
  description: z
    .string()
    .max(500, "Описание должно быть не более 500 символов")
    .optional()
    .nullable(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

import { z } from "zod";

export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]);
export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(2, "Название задачи должно быть не менее 2 символов")
    .max(200, "Название задачи должно быть не более 200 символов"),
  description: z
    .string()
    .max(2000, "Описание должно быть не более 2000 символов")
    .optional(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  deadline: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(2, "Название задачи должно быть не менее 2 символов")
    .max(200, "Название задачи должно быть не более 200 символов")
    .optional(),
  description: z
    .string()
    .max(2000, "Описание должно быть не более 2000 символов")
    .optional()
    .nullable(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  deadline: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

export const updateTaskOrderSchema = z.object({
  taskId: z.string(),
  newStatus: taskStatusSchema,
  newOrder: z.number(),
});

export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskOrderInput = z.infer<typeof updateTaskOrderSchema>;

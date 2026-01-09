import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Имя должно быть не менее 2 символов")
    .max(100, "Имя слишком длинное")
    .transform((v) => v.trim()),
  avatar: z
    .string()
    .url("Введите корректный URL")
    .nullable()
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

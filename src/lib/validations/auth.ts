import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .email({ message: "Введите корректный email" })
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(6, "Пароль должен быть не менее 6 символов")
    .max(72, "Пароль слишком длинный"), // bcrypt limit
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Имя должно быть не менее 2 символов")
    .max(100, "Имя слишком длинное")
    .transform((v) => v.trim()),
  email: z
    .email({ message: "Введите корректный email" })
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(6, "Пароль должен быть не менее 6 символов")
    .max(72, "Пароль слишком длинный"),
  confirmPassword: z
    .string()
    .min(6, "Подтвердите пароль")
    .max(72, "Пароль слишком длинный"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ message: "Введите корректный email" }),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Имя должно быть не менее 2 символов"),
  email: z.email({ message: "Введите корректный email" }),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
  confirmPassword: z.string().min(6, "Подтвердите пароль"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

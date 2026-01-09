import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Вход | Task Manager",
  description: "Войдите в свой аккаунт",
};

export default function LoginPage() {
  return <LoginForm />;
}

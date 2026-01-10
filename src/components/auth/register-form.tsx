"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { register } from "@/actions/auth";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const prefillEmail = searchParams.get("email");
  const projectName = searchParams.get("project");

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: prefillEmail || "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(data: RegisterInput) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("confirmPassword", data.confirmPassword);

      const result = await register(formData, inviteToken ?? undefined);

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.message) {
        toast.success(result.message);
        form.reset();
      }
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Создать аккаунт</CardTitle>
        <CardDescription>
          Заполните форму для регистрации
        </CardDescription>
        {inviteToken && projectName && (
          <div className="mt-3 rounded-lg bg-primary/10 p-3 text-sm text-primary">
            После регистрации вы будете добавлены в проект «{projectName}»
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Иван Иванов"
                      autoComplete="name"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      autoComplete="email"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Пароль</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Минимум 6 символов"
                      autoComplete="new-password"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Подтверждение пароля</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Повторите пароль"
                      autoComplete="new-password"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Зарегистрироваться
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link
            href={
              inviteToken
                ? `/login?invite=${inviteToken}${prefillEmail ? `&email=${encodeURIComponent(prefillEmail)}` : ""}${projectName ? `&project=${encodeURIComponent(projectName)}` : ""}`
                : "/login"
            }
            className="text-primary hover:underline"
          >
            Войти
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

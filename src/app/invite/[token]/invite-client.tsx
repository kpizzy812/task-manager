"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Check, X, Mail, Users } from "lucide-react";
import { toast } from "sonner";

import { acceptInvitation, declineInvitation } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type InvitePageClientProps = {
  token: string;
  invitation: {
    email: string;
    project: {
      name: string;
      description: string | null;
    };
    sender: {
      name: string;
    };
  };
  isLoggedIn: boolean;
  userEmail: string | undefined;
};

export function InvitePageClient({
  token,
  invitation,
  isLoggedIn,
  userEmail,
}: InvitePageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const emailMatches = userEmail?.toLowerCase() === invitation.email.toLowerCase();

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptInvitation(token);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Вы присоединились к проекту");
        router.push("/dashboard");
      }
    });
  }

  function handleDecline() {
    startTransition(async () => {
      const result = await declineInvitation(token);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Приглашение отклонено");
        router.push("/");
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Приглашение в проект</CardTitle>
          <CardDescription>
            {invitation.sender.name} приглашает вас присоединиться
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 text-center">
            <h3 className="text-lg font-semibold">{invitation.project.name}</h3>
            {invitation.project.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {invitation.project.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>Приглашение для: {invitation.email}</span>
          </div>

          {!isLoggedIn && (
            <div className="rounded-lg bg-amber-50 p-4 text-center text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              Для принятия приглашения необходимо войти в аккаунт или
              зарегистрироваться с email: <strong>{invitation.email}</strong>
            </div>
          )}

          {isLoggedIn && !emailMatches && (
            <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
              Это приглашение предназначено для другого email ({invitation.email}).
              Вы авторизованы как {userEmail}.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {!isLoggedIn ? (
            <>
              <Button asChild className="w-full">
                <Link href={`/login?invite=${token}`}>Войти</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href={`/register?invite=${token}`}>Зарегистрироваться</Link>
              </Button>
            </>
          ) : emailMatches ? (
            <div className="flex w-full gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDecline}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Отклонить
              </Button>
              <Button className="flex-1" onClick={handleAccept} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Принять
              </Button>
            </div>
          ) : (
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">Перейти к проектам</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { updateProfile } from "@/actions/profile";
import { updateProfileSchema } from "@/lib/validations/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AvatarUpload } from "./avatar-upload";

type ProfileSettingsProps = {
  profile: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    createdAt: Date;
    _count: {
      ownedProjects: number;
      assignedTasks: number;
    };
  };
};

export function ProfileSettings({ profile }: ProfileSettingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<{ name: string }>({
    resolver: zodResolver(updateProfileSchema.pick({ name: true })),
    defaultValues: {
      name: profile.name,
    },
  });

  function onSubmit(data: { name: string }) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", data.name);

      const result = await updateProfile(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Профиль обновлён");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Профиль</CardTitle>
          <CardDescription>
            Управление персональными данными
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <AvatarUpload
              currentAvatar={profile.avatar}
              name={profile.name}
              size="lg"
            />
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-semibold">{profile.name}</h3>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <p className="text-xs text-muted-foreground">
                На платформе с {format(new Date(profile.createdAt), "d MMMM yyyy", { locale: ru })}
              </p>
              <p className="text-xs text-muted-foreground pt-2">
                Нажмите на аватар для загрузки фото
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Редактирование</CardTitle>
          <CardDescription>
            Обновите ваше имя
          </CardDescription>
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
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Отображается в проектах и задачах
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Сохранить
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Статистика</CardTitle>
          <CardDescription>
            Ваша активность на платформе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Мои проекты</p>
              <p className="text-2xl font-bold">{profile._count.ownedProjects}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Назначенные задачи</p>
              <p className="text-2xl font-bold">{profile._count.assignedTasks}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

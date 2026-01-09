"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { updateProject, deleteProject } from "@/actions/projects";
import {
  updateProjectSchema,
  type UpdateProjectInput,
} from "@/lib/validations/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProjectMembersList } from "@/components/projects/project-members-list";
import { InviteMemberModal } from "@/components/projects/invite-member-modal";

type ProjectRole = "OWNER" | "ADMIN" | "MEMBER";

type Member = {
  id: string;
  role: ProjectRole;
  joinedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
};

type Invitation = {
  id: string;
  email: string | null;
  token: string;
  isPublic: boolean;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    email: string;
  };
};

type ProjectSettingsClientProps = {
  projectId: string;
  project: {
    id: string;
    name: string;
    description: string | null;
  };
  members: Member[];
  invitations: Invitation[];
  currentUserId: string;
  currentUserRole: ProjectRole;
  canInvite: boolean;
  isOwner: boolean;
};

export function ProjectSettingsClient({
  projectId,
  project,
  members,
  invitations,
  currentUserId,
  currentUserRole,
  canInvite,
  isOwner,
}: ProjectSettingsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const form = useForm<UpdateProjectInput>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: project.name,
      description: project.description ?? "",
    },
  });

  function onSubmit(data: UpdateProjectInput) {
    startTransition(async () => {
      const formData = new FormData();
      if (data.name) formData.append("name", data.name);
      if (data.description !== undefined) {
        formData.append("description", data.description ?? "");
      }

      const result = await updateProject(projectId, formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Проект обновлён");
      }
    });
  }

  function handleDeleteProject() {
    startTransition(async () => {
      const result = await deleteProject(projectId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Проект удалён");
        router.push("/dashboard");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
          <CardDescription>
            Обновите название и описание проекта
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
                    <FormLabel>Название проекта</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Мой проект"
                        disabled={isPending || !isOwner}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Описание проекта..."
                        className="resize-none"
                        disabled={isPending || !isOwner}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isOwner && (
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Сохранить
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Участники проекта</CardTitle>
              <CardDescription>
                Управление участниками и их ролями
              </CardDescription>
            </div>
            {canInvite && (
              <Button onClick={() => setIsInviteModalOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Пригласить
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ProjectMembersList
            projectId={projectId}
            members={members}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
          />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {isOwner && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Опасная зона</CardTitle>
            <CardDescription>
              Удаление проекта необратимо. Все задачи и данные будут удалены.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isPending}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить проект
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие нельзя отменить. Все задачи, участники и данные
                    проекта будут безвозвратно удалены.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteProject}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Удалить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Invite Modal */}
      <InviteMemberModal
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        projectId={projectId}
        invitations={invitations}
      />
    </div>
  );
}

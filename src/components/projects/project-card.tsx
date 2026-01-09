"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { FolderKanban, MoreHorizontal, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { deleteProject } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

type ProjectCardProps = {
  project: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    ownerId: string;
    _count: {
      tasks: number;
    };
    members: {
      userId: string;
      role: string;
    }[];
  };
  currentUserId: string;
};

export function ProjectCard({ project, currentUserId }: ProjectCardProps) {
  const isOwner = project.ownerId === currentUserId;
  const memberCount = project.members.length;
  const taskCount = project._count.tasks;

  async function handleDelete() {
    const result = await deleteProject(project.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Проект удалён");
    }
  }

  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      <Link href={`/projects/${project.id}`} className="absolute inset-0 z-0" />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{project.name}</CardTitle>
            <CardDescription className="text-xs">
              Обновлён{" "}
              {formatDistanceToNow(project.updatedAt, {
                addSuffix: true,
                locale: ru,
              })}
            </CardDescription>
          </div>
        </div>
        {isOwner && (
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative z-10 h-8 w-8"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Меню</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Удалить
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие нельзя отменить. Проект &quot;{project.name}&quot; и
                  все его задачи будут удалены навсегда.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Удалить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardHeader>
      <CardContent>
        {project.description && (
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
            {project.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{memberCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <FolderKanban className="h-4 w-4" />
            <span>{taskCount} задач</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

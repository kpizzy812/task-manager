import { Metadata } from "next";
import { notFound } from "next/navigation";
import { BarChart3, Settings } from "lucide-react";
import Link from "next/link";

import { getProject } from "@/actions/projects";
import { getTasksByProject, getProjectMembers } from "@/actions/tasks";
import { getCurrentUser, getUserProjectRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { type TaskStatus } from "@/lib/validations/task";
import { type Task } from "@/types/task";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return {
      title: "Проект не найден | Task Manager",
    };
  }

  return {
    title: `${project.name} | Task Manager`,
    description: project.description ?? "Kanban-доска проекта",
  };
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    notFound();
  }

  const [project, tasks, members, userRole] = await Promise.all([
    getProject(id),
    getTasksByProject(id),
    getProjectMembers(id),
    getUserProjectRole(id, user.id),
  ]);

  if (!project || !tasks || !userRole) {
    notFound();
  }

  // Transform tasks to match component types
  const transformedTasks: Record<TaskStatus, Task[]> = {
    TODO: tasks.TODO as Task[],
    IN_PROGRESS: tasks.IN_PROGRESS as Task[],
    REVIEW: tasks.REVIEW as Task[],
    DONE: tasks.DONE as Task[],
  };

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight truncate">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground line-clamp-2">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/projects/${id}/analytics`}>
              <BarChart3 className="h-4 w-4" />
              <span className="sr-only">Аналитика проекта</span>
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={`/projects/${id}/settings`}>
              <Settings className="h-4 w-4" />
              <span className="sr-only">Настройки проекта</span>
            </Link>
          </Button>
        </div>
      </div>

      <KanbanBoard
        projectId={id}
        initialTasks={transformedTasks}
        members={members}
        currentUserId={user.id}
        userRole={userRole}
      />
    </div>
  );
}

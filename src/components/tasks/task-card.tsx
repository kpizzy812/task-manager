"use client";

import { useSortable } from "@dnd-kit/react/sortable";

import { type TaskStatus } from "@/lib/validations/task";
import { type Task } from "@/types/task";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskPriorityBadge } from "./task-priority-badge";
import { TaskDeadlineIndicator } from "./task-deadline-indicator";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  task: Task;
  index: number;
  column: TaskStatus;
  onClick: () => void;
};

export function TaskCard({ task, index, column, onClick }: TaskCardProps) {
  const { ref, isDragging } = useSortable({
    id: task.id,
    index,
    type: "task",
    accept: "task",
    group: column,
  });

  const initials = task.assignee?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card
      ref={ref}
      className={cn(
        "cursor-pointer transition-shadow hover:shadow-md",
        isDragging && "opacity-50 shadow-lg"
      )}
      onClick={onClick}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium leading-tight">
            {task.title}
          </CardTitle>
          <TaskPriorityBadge priority={task.priority} className="shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {task.description && (
          <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
            {task.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          {task.deadline ? (
            <TaskDeadlineIndicator deadline={task.deadline} />
          ) : (
            <span />
          )}
          {task.assignee && (
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={task.assignee.avatar ?? undefined}
                alt={task.assignee.name}
              />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { type TaskStatus } from "@/lib/validations/task";
import { type Task } from "@/types/task";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TaskPriorityBadge } from "./task-priority-badge";
import { TaskDeadlineIndicator } from "./task-deadline-indicator";

const COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

const statusLabels: Record<TaskStatus, string> = {
  TODO: "К выполнению",
  IN_PROGRESS: "В работе",
  REVIEW: "На проверке",
  DONE: "Готово",
};

type MobileTaskCardProps = {
  task: Task;
  onClick: () => void;
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
};

export function MobileTaskCard({ task, onClick, onMoveTask }: MobileTaskCardProps) {
  const currentIndex = COLUMNS.indexOf(task.status as TaskStatus);
  const canMoveLeft = currentIndex > 0;
  const canMoveRight = currentIndex < COLUMNS.length - 1;

  const initials = task.assignee?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleMoveLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canMoveLeft) {
      onMoveTask(task.id, COLUMNS[currentIndex - 1]);
    }
  };

  const handleMoveRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canMoveRight) {
      onMoveTask(task.id, COLUMNS[currentIndex + 1]);
    }
  };

  return (
    <Card className="p-3">
      <div className="cursor-pointer" onClick={onClick}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium leading-tight">{task.title}</h3>
          <TaskPriorityBadge priority={task.priority} className="shrink-0" />
        </div>
        {task.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {task.description}
          </p>
        )}
        <div className="mt-1.5 flex items-center justify-between">
          {task.deadline ? (
            <TaskDeadlineIndicator deadline={task.deadline} />
          ) : (
            <span />
          )}
          {task.assignee && (
            <Avatar className="h-5 w-5">
              <AvatarImage
                src={task.assignee.avatar ?? undefined}
                alt={task.assignee.name}
              />
              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>

      {/* Move buttons */}
      <div className="mt-2 flex items-center justify-between border-t pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={handleMoveLeft}
          disabled={!canMoveLeft}
        >
          <ChevronLeft className="h-3 w-3" />
          {canMoveLeft && statusLabels[COLUMNS[currentIndex - 1]]}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={handleMoveRight}
          disabled={!canMoveRight}
        >
          {canMoveRight && statusLabels[COLUMNS[currentIndex + 1]]}
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
}

"use client";

import { useDroppable } from "@dnd-kit/react";
import { Plus } from "lucide-react";

import { type TaskStatus } from "@/lib/validations/task";
import { type Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskCard } from "./task-card";

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  TODO: { label: "К выполнению", color: "bg-slate-500" },
  IN_PROGRESS: { label: "В работе", color: "bg-blue-500" },
  REVIEW: { label: "На проверке", color: "bg-purple-500" },
  DONE: { label: "Готово", color: "bg-green-500" },
};

type KanbanColumnProps = {
  status: TaskStatus;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
};

export function KanbanColumn({
  status,
  tasks,
  onAddTask,
  onTaskClick,
}: KanbanColumnProps) {
  const { ref, isDropTarget } = useDroppable({
    id: status,
    type: "column",
    accept: ["task"],
  });

  const config = statusConfig[status];

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-full min-w-[280px] flex-col rounded-lg p-2 transition-colors",
        isDropTarget ? "bg-primary/10" : "bg-muted/50"
      )}
    >
      {/* Column header */}
      <div className="mb-3 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", config.color)} />
          <h3 className="text-sm font-semibold">{config.label}</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onAddTask(status)}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Добавить задачу</span>
        </Button>
      </div>

      {/* Tasks list */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {tasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            index={index}
            column={status}
            onClick={() => onTaskClick(task)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-4">
            <p className="text-center text-sm text-muted-foreground">
              Перетащите сюда задачу или нажмите +
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

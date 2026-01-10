"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { updateTaskOrder } from "@/actions/tasks";
import { type TaskStatus } from "@/lib/validations/task";
import { type Task, type ProjectMember } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { MobileTaskCard } from "./mobile-task-card";
import { CreateTaskModal } from "./create-task-modal";
import { TaskDetailsModal } from "./task-details-modal";

type UserRole = "OWNER" | "ADMIN" | "MEMBER";

type MobileKanbanViewProps = {
  projectId: string;
  tasks: Record<TaskStatus, Task[]>;
  members: ProjectMember[];
  onTasksChange: (tasks: Record<TaskStatus, Task[]>) => void;
  currentUserId: string;
  userRole: UserRole;
};

const COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

const statusConfig: Record<TaskStatus, { label: string; shortLabel: string; color: string }> = {
  TODO: { label: "К выполнению", shortLabel: "Новые", color: "bg-slate-500" },
  IN_PROGRESS: { label: "В работе", shortLabel: "В работе", color: "bg-blue-500" },
  REVIEW: { label: "На проверке", shortLabel: "Проверка", color: "bg-purple-500" },
  DONE: { label: "Готово", shortLabel: "Готово", color: "bg-green-500" },
};

export function MobileKanbanView({
  projectId,
  tasks,
  members,
  onTasksChange,
  currentUserId,
  userRole,
}: MobileKanbanViewProps) {
  const [activeTab, setActiveTab] = useState<TaskStatus>("TODO");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  async function handleMoveTask(taskId: string, newStatus: TaskStatus) {
    // Find task and its current status
    let task: Task | undefined;
    let oldStatus: TaskStatus | undefined;

    for (const status of COLUMNS) {
      const found = tasks[status].find((t) => t.id === taskId);
      if (found) {
        task = found;
        oldStatus = status;
        break;
      }
    }

    if (!task || !oldStatus) return;

    // Optimistic update
    const newTasks = { ...tasks };
    newTasks[oldStatus] = tasks[oldStatus].filter((t) => t.id !== taskId);
    newTasks[newStatus] = [...tasks[newStatus], { ...task, status: newStatus }];
    onTasksChange(newTasks);

    // Switch to the new tab
    setActiveTab(newStatus);

    // Server update
    const result = await updateTaskOrder(taskId, newStatus, newTasks[newStatus].length - 1);
    if (result.error) {
      toast.error(result.error);
      // Rollback
      onTasksChange(tasks);
    }
  }

  function handleAddTask() {
    setCreateModalOpen(true);
  }

  function handleTaskClick(task: Task) {
    setSelectedTask(task);
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TaskStatus)}>
        <div className="flex items-center gap-2 mb-3">
          <TabsList className="flex-1 grid grid-cols-4">
            {COLUMNS.map((status) => (
              <TabsTrigger
                key={status}
                value={status}
                className="relative px-1 text-xs"
              >
                <span className={cn("mr-1 h-2 w-2 rounded-full", statusConfig[status].color)} />
                <span className="hidden xs:inline">{statusConfig[status].shortLabel}</span>
                <span className="xs:hidden">{tasks[status].length}</span>
                <span className="hidden xs:inline ml-1 text-muted-foreground">
                  ({tasks[status].length})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleAddTask}>
            <Plus className="h-4 w-4" />
            <span className="sr-only">Добавить задачу</span>
          </Button>
        </div>

        {COLUMNS.map((status) => (
          <TabsContent key={status} value={status} className="mt-0">
            <div className="flex flex-col gap-2">
              {tasks[status].length === 0 ? (
                <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
                  <p className="text-center text-sm text-muted-foreground">
                    Нет задач в статусе &quot;{statusConfig[status].label}&quot;
                  </p>
                </div>
              ) : (
                tasks[status].map((task) => (
                  <MobileTaskCard
                    key={task.id}
                    task={task}
                    onClick={() => handleTaskClick(task)}
                    onMoveTask={handleMoveTask}
                  />
                ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <CreateTaskModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        projectId={projectId}
        defaultStatus={activeTab}
        members={members}
      />

      <TaskDetailsModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        members={members}
        currentUserId={currentUserId}
        userRole={userRole}
      />
    </>
  );
}

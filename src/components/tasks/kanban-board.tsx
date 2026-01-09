"use client";

import { useState, useEffect } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { toast } from "sonner";

import { updateTaskOrder } from "@/actions/tasks";
import { type TaskStatus } from "@/lib/validations/task";
import { type Task, type ProjectMember } from "@/types/task";
import { KanbanColumn } from "./kanban-column";
import { CreateTaskModal } from "./create-task-modal";
import { TaskDetailsModal } from "./task-details-modal";

type KanbanBoardProps = {
  projectId: string;
  initialTasks: Record<TaskStatus, Task[]>;
  members: ProjectMember[];
};

const COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

export function KanbanBoard({
  projectId,
  initialTasks,
  members,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);

  // Sync local state when server data changes (after router.refresh())
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>("TODO");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  function handleAddTask(status: TaskStatus) {
    setCreateStatus(status);
    setCreateModalOpen(true);
  }

  function handleTaskClick(task: Task) {
    setSelectedTask(task);
  }

  async function handleDragEnd(event: { source: { id: string; type: string }; target: { id: string; type: string } | null; canceled: boolean }) {
    if (event.canceled || !event.target) return;

    const { source, target } = event;
    if (source.type !== "task") return;

    const taskId = source.id as string;
    const newStatus = target.id as TaskStatus;

    // Find the task in current state
    let movedTask: Task | null = null;
    for (const column of COLUMNS) {
      const task = tasks[column].find((t) => t.id === taskId);
      if (task) {
        movedTask = task;
        break;
      }
    }

    if (!movedTask) return;

    // Calculate new order
    const tasksInNewColumn = tasks[newStatus];
    const newOrder = tasksInNewColumn.length > 0
      ? Math.max(...tasksInNewColumn.map((t) => t.order)) + 1
      : 0;

    // Optimistically update UI
    const result = await updateTaskOrder(taskId, newStatus, newOrder);

    if (result.error) {
      toast.error(result.error);
      // Revert by setting back old state - but we rely on server revalidation
    }
  }

  return (
    <>
      <DragDropProvider
        onDragOver={(event) => {
          const { source } = event.operation;
          if (source?.type !== "task") return;
          setTasks((tasks) => move(tasks, event));
        }}
        onDragEnd={(event) => {
          handleDragEnd({
            source: { id: String(event.operation.source?.id), type: String(event.operation.source?.type) },
            target: event.operation.target ? { id: String(event.operation.target.id), type: String(event.operation.target.type) } : null,
            canceled: event.canceled,
          });
        }}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasks[status]}
              onAddTask={handleAddTask}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>
      </DragDropProvider>

      <CreateTaskModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        projectId={projectId}
        defaultStatus={createStatus}
        members={members}
      />

      <TaskDetailsModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        members={members}
      />
    </>
  );
}

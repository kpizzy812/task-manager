"use client";

import { useState, useEffect, useRef } from "react";
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
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>("TODO");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Track if we're currently dragging to prevent sync overwrite
  const isDraggingRef = useRef(false);

  // Sync local state when server data changes (after router.refresh())
  useEffect(() => {
    // Don't overwrite local state while dragging
    if (!isDraggingRef.current) {
      setTasks(initialTasks);
    }
  }, [initialTasks]);

  function handleAddTask(status: TaskStatus) {
    setCreateStatus(status);
    setCreateModalOpen(true);
  }

  function handleTaskClick(task: Task) {
    setSelectedTask(task);
  }

  function handleDragEnd(event: {
    source: { id: string; type: string };
    target: { id: string; type: string } | null;
    canceled: boolean;
  }) {
    isDraggingRef.current = false;

    if (event.canceled || !event.target) return;

    const { source, target } = event;
    if (source.type !== "task") return;

    const taskId = source.id as string;
    const newStatus = target.id as TaskStatus;

    // Find the task in current state
    let movedTask: Task | null = null;
    let oldStatus: TaskStatus | null = null;
    for (const column of COLUMNS) {
      const task = tasks[column].find((t) => t.id === taskId);
      if (task) {
        movedTask = task;
        oldStatus = column;
        break;
      }
    }

    if (!movedTask || !oldStatus) return;

    // Calculate new order
    const tasksInNewColumn = tasks[newStatus].filter((t) => t.id !== taskId);
    const newOrder =
      tasksInNewColumn.length > 0
        ? Math.max(...tasksInNewColumn.map((t) => t.order)) + 1
        : 0;

    // Save current state for rollback
    const previousTasks = tasks;

    // Optimistically update UI immediately
    setTasks((current) => {
      const updated = { ...current };
      // Remove from old column
      updated[oldStatus] = current[oldStatus].filter((t) => t.id !== taskId);
      // Add to new column with updated status
      const updatedTask = { ...movedTask!, status: newStatus, order: newOrder };
      updated[newStatus] = [...current[newStatus].filter((t) => t.id !== taskId), updatedTask];
      return updated;
    });

    // Send to server in background (no await)
    updateTaskOrder(taskId, newStatus, newOrder).then((result) => {
      if (result.error) {
        toast.error(result.error);
        // Rollback on error
        setTasks(previousTasks);
      }
    });
  }

  return (
    <>
      <DragDropProvider
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragOver={(event) => {
          const { source } = event.operation;
          if (source?.type !== "task") return;
          setTasks((tasks) => move(tasks, event));
        }}
        onDragEnd={(event) => {
          handleDragEnd({
            source: {
              id: String(event.operation.source?.id),
              type: String(event.operation.source?.type),
            },
            target: event.operation.target
              ? {
                  id: String(event.operation.target.id),
                  type: String(event.operation.target.type),
                }
              : null,
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

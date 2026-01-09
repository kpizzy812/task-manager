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

  // Track pending server update to prevent sync overwrite
  const pendingUpdateRef = useRef(false);

  // Sync local state when server data changes (after router.refresh())
  useEffect(() => {
    if (!pendingUpdateRef.current) {
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

  // Find which column a task is in
  function findTaskColumn(taskId: string, currentTasks: Record<TaskStatus, Task[]>): TaskStatus | null {
    for (const column of COLUMNS) {
      if (currentTasks[column].some((t) => t.id === taskId)) {
        return column;
      }
    }
    return null;
  }

  function handleDragEnd(event: {
    source: { id: string; type: string } | null;
    target: { id: string; type: string } | null;
    canceled: boolean;
    currentTasks: Record<TaskStatus, Task[]>;
  }) {
    const { source, target, canceled, currentTasks } = event;

    if (canceled || !source || !target) return;
    if (source.type !== "task") return;

    const taskId = source.id;

    // Determine target column
    let newStatus: TaskStatus;
    if (target.type === "column") {
      newStatus = target.id as TaskStatus;
    } else {
      // Target is another task - find its column
      const targetColumn = findTaskColumn(target.id, currentTasks);
      if (!targetColumn) return;
      newStatus = targetColumn;
    }

    // Find task's current column after move() was applied
    const currentColumn = findTaskColumn(taskId, currentTasks);
    if (!currentColumn) return;

    // Get the task
    const movedTask = currentTasks[currentColumn].find((t) => t.id === taskId);
    if (!movedTask) return;

    // Calculate new order based on position in column
    const taskIndex = currentTasks[newStatus].findIndex((t) => t.id === taskId);
    const newOrder = taskIndex >= 0 ? taskIndex : 0;

    // Set pending flag to prevent useEffect from overwriting
    pendingUpdateRef.current = true;

    // Send to server
    updateTaskOrder(taskId, newStatus, newOrder)
      .then((result) => {
        if (result.error) {
          toast.error(result.error);
        }
      })
      .finally(() => {
        // Allow sync again after a short delay
        setTimeout(() => {
          pendingUpdateRef.current = false;
        }, 500);
      });
  }

  return (
    <>
      <DragDropProvider
        onDragOver={(event) => {
          const { source } = event.operation;
          if (source?.type !== "task") return;
          setTasks((currentTasks) => move(currentTasks, event));
        }}
        onDragEnd={(event) => {
          // Get current tasks state for the handler
          setTasks((currentTasks) => {
            handleDragEnd({
              source: event.operation.source
                ? { id: String(event.operation.source.id), type: String(event.operation.source.type) }
                : null,
              target: event.operation.target
                ? { id: String(event.operation.target.id), type: String(event.operation.target.type) }
                : null,
              canceled: event.canceled,
              currentTasks,
            });
            return currentTasks;
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

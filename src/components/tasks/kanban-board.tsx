"use client";

import { useState, useEffect, useRef } from "react";
import { DragDropProvider } from "@dnd-kit/react";
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
  // Store previous state for rollback on cancel/error
  const previousTasksRef = useRef<Record<TaskStatus, Task[]> | null>(null);

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
  function findTaskColumn(
    taskId: string,
    currentTasks: Record<TaskStatus, Task[]>
  ): TaskStatus | null {
    for (const column of COLUMNS) {
      if (currentTasks[column].some((t) => t.id === taskId)) {
        return column;
      }
    }
    return null;
  }

  // Move task between columns (optimistic update)
  function moveTask(
    currentTasks: Record<TaskStatus, Task[]>,
    taskId: string,
    targetColumn: TaskStatus,
    targetIndex?: number
  ): Record<TaskStatus, Task[]> {
    // Find source column
    const sourceColumn = findTaskColumn(taskId, currentTasks);
    if (!sourceColumn) return currentTasks;

    // Find the task
    const task = currentTasks[sourceColumn].find((t) => t.id === taskId);
    if (!task) return currentTasks;

    // Create new state
    const newTasks = { ...currentTasks };

    // Remove from source
    newTasks[sourceColumn] = currentTasks[sourceColumn].filter(
      (t) => t.id !== taskId
    );

    // Add to target
    const updatedTask = { ...task, status: targetColumn };
    if (targetIndex !== undefined && targetIndex >= 0) {
      const targetTasks = [...currentTasks[targetColumn].filter((t) => t.id !== taskId)];
      targetTasks.splice(targetIndex, 0, updatedTask);
      newTasks[targetColumn] = targetTasks;
    } else {
      newTasks[targetColumn] = [
        ...currentTasks[targetColumn].filter((t) => t.id !== taskId),
        updatedTask,
      ];
    }

    return newTasks;
  }

  return (
    <>
      <DragDropProvider
        onDragStart={() => {
          // Save current state for potential rollback
          previousTasksRef.current = tasks;
        }}
        onDragOver={(event) => {
          const { source, target } = event.operation;
          if (!source || source.type !== "task" || !target) return;

          const taskId = String(source.id);

          // Determine target column and index
          let targetColumn: TaskStatus;
          let targetIndex: number | undefined;

          if (target.type === "column") {
            targetColumn = target.id as TaskStatus;
          } else {
            // Target is another task
            const targetTaskId = String(target.id);
            setTasks((current) => {
              const column = findTaskColumn(targetTaskId, current);
              if (!column) return current;

              targetColumn = column;
              targetIndex = current[column].findIndex((t) => t.id === targetTaskId);

              return moveTask(current, taskId, targetColumn, targetIndex);
            });
            return;
          }

          setTasks((current) => moveTask(current, taskId, targetColumn, targetIndex));
        }}
        onDragEnd={(event) => {
          const { source, target } = event.operation;

          // Handle cancel - rollback to previous state
          if (event.canceled) {
            if (previousTasksRef.current) {
              setTasks(previousTasksRef.current);
            }
            previousTasksRef.current = null;
            return;
          }

          if (!source || source.type !== "task" || !target) {
            previousTasksRef.current = null;
            return;
          }

          const taskId = String(source.id);

          // Get final position from current state
          setTasks((currentTasks) => {
            const currentColumn = findTaskColumn(taskId, currentTasks);
            if (!currentColumn) return currentTasks;

            const taskIndex = currentTasks[currentColumn].findIndex(
              (t) => t.id === taskId
            );

            // Set pending flag to prevent useEffect from overwriting
            pendingUpdateRef.current = true;

            // Send to server in background
            updateTaskOrder(taskId, currentColumn, taskIndex)
              .then((result) => {
                if (result.error) {
                  toast.error(result.error);
                  // Rollback on error
                  if (previousTasksRef.current) {
                    setTasks(previousTasksRef.current);
                  }
                }
              })
              .finally(() => {
                previousTasksRef.current = null;
                setTimeout(() => {
                  pendingUpdateRef.current = false;
                }, 500);
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

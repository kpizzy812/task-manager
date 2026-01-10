"use client";

import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { DragDropProvider } from "@dnd-kit/react";
import { toast } from "sonner";

import { updateTaskOrder } from "@/actions/tasks";
import { type TaskStatus } from "@/lib/validations/task";
import { type Task, type ProjectMember } from "@/types/task";
import { KanbanColumn } from "./kanban-column";
import { CreateTaskModal } from "./create-task-modal";
import { TaskDetailsModal } from "./task-details-modal";
import { MobileKanbanView } from "./mobile-kanban-view";

type UserRole = "OWNER" | "ADMIN" | "MEMBER";

type KanbanBoardProps = {
  projectId: string;
  initialTasks: Record<TaskStatus, Task[]>;
  members: ProjectMember[];
  currentUserId: string;
  userRole: UserRole;
};

const COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

export function KanbanBoard({
  projectId,
  initialTasks,
  members,
  currentUserId,
  userRole,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>("TODO");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Store previous state for rollback on cancel/error
  const previousTasksRef = useRef<Record<TaskStatus, Task[]> | null>(null);
  // Track server sync version to handle stale updates
  const localVersionRef = useRef(0);
  // Track last move to prevent duplicate updates
  const lastMoveRef = useRef<{ taskId: string; column: string; index: number } | null>(null);
  // Throttle flag for requestAnimationFrame
  const rafRef = useRef<number | null>(null);

  // Sync local state when server data changes
  useEffect(() => {
    setTasks(initialTasks);
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
      {/* Mobile view with tabs */}
      <div className="md:hidden">
        <MobileKanbanView
          projectId={projectId}
          tasks={tasks}
          members={members}
          onTasksChange={setTasks}
          currentUserId={currentUserId}
          userRole={userRole}
        />
      </div>

      {/* Desktop view with drag-and-drop */}
      <div className="hidden md:block">
        <DragDropProvider
        onDragStart={() => {
          // Save current state for potential rollback
          previousTasksRef.current = tasks;
          // Reset last move tracking
          lastMoveRef.current = null;
        }}
        onDragOver={(event) => {
          // Throttle with requestAnimationFrame to prevent browser crash
          if (rafRef.current !== null) return;

          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;

            const { source, target } = event.operation;
            if (!source || source.type !== "task" || !target) return;

            const taskId = String(source.id);

            // Determine target column and index
            let targetColumn: TaskStatus;
            let targetIndex: number;

            if (target.type === "column") {
              targetColumn = target.id as TaskStatus;
              targetIndex = -1; // End of column
            } else {
              // Target is another task - find its column and index
              const targetTaskId = String(target.id);
              flushSync(() => {
                setTasks((current) => {
                  const column = findTaskColumn(targetTaskId, current);
                  if (!column) return current;

                  targetColumn = column;
                  targetIndex = current[column].findIndex((t) => t.id === targetTaskId);

                  // Skip if position hasn't changed
                  const lastMove = lastMoveRef.current;
                  if (
                    lastMove &&
                    lastMove.taskId === taskId &&
                    lastMove.column === targetColumn &&
                    lastMove.index === targetIndex
                  ) {
                    return current;
                  }

                  lastMoveRef.current = { taskId, column: targetColumn, index: targetIndex };
                  return moveTask(current, taskId, targetColumn, targetIndex);
                });
              });
              return;
            }

            // Skip if position hasn't changed
            const lastMove = lastMoveRef.current;
            if (
              lastMove &&
              lastMove.taskId === taskId &&
              lastMove.column === targetColumn &&
              lastMove.index === targetIndex
            ) {
              return;
            }

            lastMoveRef.current = { taskId, column: targetColumn, index: targetIndex };
            flushSync(() => {
              setTasks((current) =>
                moveTask(current, taskId, targetColumn, targetIndex >= 0 ? targetIndex : undefined)
              );
            });
          });
        }}
        onDragEnd={(event) => {
          const { source, target } = event.operation;

          // Cancel any pending RAF
          if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
          }

          // Handle cancel - rollback to previous state
          if (event.canceled) {
            if (previousTasksRef.current) {
              flushSync(() => {
                setTasks(previousTasksRef.current!);
              });
            }
            previousTasksRef.current = null;
            lastMoveRef.current = null;
            return;
          }

          if (!source || source.type !== "task" || !target) {
            previousTasksRef.current = null;
            return;
          }

          const taskId = String(source.id);
          // Capture rollback state before clearing
          const rollbackState = previousTasksRef.current;
          previousTasksRef.current = null;
          lastMoveRef.current = null;

          // Defer server call to next tick to not block UI
          // This is critical - server actions block the event loop on invocation
          setTimeout(() => {
            // Increment version to track this update
            const updateVersion = ++localVersionRef.current;

            // Get final position from current state
            setTasks((currentTasks) => {
              const currentColumn = findTaskColumn(taskId, currentTasks);
              if (!currentColumn) return currentTasks;

              const taskIndex = currentTasks[currentColumn].findIndex(
                (t) => t.id === taskId
              );

              // Send to server in background
              updateTaskOrder(taskId, currentColumn, taskIndex).then((result) => {
                if (result.error) {
                  toast.error(result.error);
                  // Only rollback if no newer updates happened
                  if (localVersionRef.current === updateVersion && rollbackState) {
                    setTasks(rollbackState);
                  }
                }
              });

              return currentTasks;
            });
          }, 0);
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
          currentUserId={currentUserId}
          userRole={userRole}
        />
      </div>
    </>
  );
}

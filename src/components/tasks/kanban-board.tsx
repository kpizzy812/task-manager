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
          }}
          onDragOver={(event) => {
            const { source } = event.operation;
            // Only handle task drags, not column drags
            if (source?.type !== "task") return;

            // Use move helper from @dnd-kit/helpers for optimistic updates
            setTasks((currentTasks) => move(currentTasks, event));
          }}
          onDragEnd={(event) => {
            const { source } = event.operation;

            // Handle cancel - rollback to previous state
            if (event.canceled) {
              if (previousTasksRef.current) {
                setTasks(previousTasksRef.current);
              }
              previousTasksRef.current = null;
              return;
            }

            if (source?.type !== "task") {
              previousTasksRef.current = null;
              return;
            }

            const taskId = String(source.id);
            const rollbackState = previousTasksRef.current;
            previousTasksRef.current = null;

            // Defer server call to next tick to not block UI
            setTimeout(() => {
              const updateVersion = ++localVersionRef.current;

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

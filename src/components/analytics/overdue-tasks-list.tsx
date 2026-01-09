import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { AlertTriangle, Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { type OverdueTask } from "@/actions/analytics";
import { type TaskPriority } from "@/lib/validations/task";

type OverdueTasksListProps = {
  tasks: OverdueTask[];
};

export function OverdueTasksList({ tasks }: OverdueTasksListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <CardTitle>Просроченные задачи</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-3">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <p className="mt-3 text-sm font-medium">
              Нет просроченных задач
            </p>
            <p className="text-sm text-muted-foreground">
              Все задачи выполняются в срок
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start justify-between gap-4 rounded-lg border p-3"
              >
                <div className="flex-1 space-y-1">
                  <p className="font-medium leading-none">{task.title}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      Просрочено{" "}
                      {formatDistanceToNow(new Date(task.deadline), {
                        locale: ru,
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TaskPriorityBadge
                    priority={task.priority as TaskPriority}
                  />
                  {task.assignee && (
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={task.assignee.avatar ?? undefined}
                        alt={task.assignee.name}
                      />
                      <AvatarFallback className="text-xs">
                        {task.assignee.name
                          .split(" ")
                          .filter((n) => n.length > 0)
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "?"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

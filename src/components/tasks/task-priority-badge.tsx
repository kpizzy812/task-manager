import { type TaskPriority } from "@/lib/validations/task";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const priorityConfig: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  LOW: {
    label: "Низкий",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  },
  MEDIUM: {
    label: "Средний",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  HIGH: {
    label: "Высокий",
    className: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  },
  URGENT: {
    label: "Срочный",
    className: "bg-red-100 text-red-700 hover:bg-red-100",
  },
};

type TaskPriorityBadgeProps = {
  priority: TaskPriority;
  className?: string;
};

export function TaskPriorityBadge({ priority, className }: TaskPriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

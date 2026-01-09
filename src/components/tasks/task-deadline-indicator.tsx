import { formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

type TaskDeadlineIndicatorProps = {
  deadline: Date;
  className?: string;
};

export function TaskDeadlineIndicator({
  deadline,
  className,
}: TaskDeadlineIndicatorProps) {
  const isOverdue = isPast(deadline) && !isToday(deadline);
  const isDueToday = isToday(deadline);
  const isDueTomorrow = isTomorrow(deadline);

  let label: string;
  if (isOverdue) {
    label = `Просрочено ${formatDistanceToNow(deadline, {
      addSuffix: false,
      locale: ru,
    })} назад`;
  } else if (isDueToday) {
    label = "Сегодня";
  } else if (isDueTomorrow) {
    label = "Завтра";
  } else {
    label = formatDistanceToNow(deadline, { addSuffix: true, locale: ru });
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs",
        isOverdue && "text-red-600",
        isDueToday && "text-orange-600",
        !isOverdue && !isDueToday && "text-muted-foreground",
        className
      )}
    >
      {isOverdue ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <Calendar className="h-3 w-3" />
      )}
      <span>{label}</span>
    </div>
  );
}

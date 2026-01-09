import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ListTodo,
  TrendingUp,
} from "lucide-react";

import { getProject } from "@/actions/projects";
import { getProjectAnalytics } from "@/actions/analytics";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/analytics/stat-card";
import { StatusChart } from "@/components/analytics/status-chart";
import { OverdueTasksList } from "@/components/analytics/overdue-tasks-list";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return {
      title: "Аналитика | Task Manager",
    };
  }

  return {
    title: `Аналитика - ${project.name} | Task Manager`,
    description: `Статистика и метрики проекта ${project.name}`,
  };
}

export default async function AnalyticsPage({ params }: Props) {
  const { id } = await params;
  const [project, analytics] = await Promise.all([
    getProject(id),
    getProjectAnalytics(id),
  ]);

  if (!project || !analytics) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Назад к проекту</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Аналитика</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Всего задач"
          value={analytics.totalTasks}
          icon={ListTodo}
          description="Общее количество задач в проекте"
        />
        <StatCard
          title="Выполнено"
          value={analytics.completedTasks}
          icon={CheckCircle2}
          description={`${analytics.completionRate}% от всех задач`}
        />
        <StatCard
          title="Просрочено"
          value={analytics.overdueTasks}
          icon={Clock}
          description="Задач с пропущенным дедлайном"
        />
        <StatCard
          title="Прогресс"
          value={`${analytics.completionRate}%`}
          icon={TrendingUp}
          description="Процент выполнения проекта"
        />
      </div>

      {/* Charts and Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StatusChart data={analytics.statusCounts} />
        <OverdueTasksList tasks={analytics.overdueTasksList} />
      </div>
    </div>
  );
}

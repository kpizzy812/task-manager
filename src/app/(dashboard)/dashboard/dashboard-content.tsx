"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProjectList } from "@/components/projects/project-list";
import { CreateProjectModal } from "@/components/projects/create-project-modal";

type Project = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  _count: {
    tasks: number;
  };
  members: {
    userId: string;
    role: string;
  }[];
};

type DashboardContentProps = {
  projects: Project[];
  currentUserId: string;
};

export function DashboardContent({ projects, currentUserId }: DashboardContentProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Проекты</h1>
          <p className="text-muted-foreground">
            Управляйте своими проектами и задачами
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Создать проект
        </Button>
      </div>

      <ProjectList
        projects={projects}
        currentUserId={currentUserId}
        onCreateProject={() => setIsCreateModalOpen(true)}
      />

      <CreateProjectModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}

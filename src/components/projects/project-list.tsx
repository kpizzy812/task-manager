"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProjectCard } from "./project-card";

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

type ProjectListProps = {
  projects: Project[];
  currentUserId: string;
  onCreateProject: () => void;
};

export function ProjectList({
  projects,
  currentUserId,
  onCreateProject,
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Plus className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Нет проектов</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Создайте свой первый проект, чтобы начать работу
        </p>
        <Button onClick={onCreateProject} className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Создать проект
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}

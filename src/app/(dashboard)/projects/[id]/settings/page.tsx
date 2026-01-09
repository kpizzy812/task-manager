import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  getProject,
  getProjectMembersWithDetails,
  getProjectInvitations,
  getCurrentProfile,
} from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { ProjectSettingsClient } from "./settings-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return {
      title: "Проект не найден | Task Manager",
    };
  }

  return {
    title: `Настройки: ${project.name} | Task Manager`,
    description: "Настройки проекта и управление участниками",
  };
}

export default async function ProjectSettingsPage({ params }: Props) {
  const { id } = await params;
  const [project, members, invitations, profile] = await Promise.all([
    getProject(id),
    getProjectMembersWithDetails(id),
    getProjectInvitations(id),
    getCurrentProfile(),
  ]);

  if (!project || !profile) {
    notFound();
  }

  // Find current user's membership
  const currentMembership = members.find((m) => m.user.id === profile.id);
  if (!currentMembership) {
    notFound();
  }

  const isOwner = currentMembership.role === "OWNER";
  const canInvite = currentMembership.role === "OWNER" || currentMembership.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Назад к проекту</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Настройки проекта</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
      </div>

      <ProjectSettingsClient
        projectId={id}
        project={{
          id: project.id,
          name: project.name,
          description: project.description,
        }}
        members={members}
        invitations={invitations}
        currentUserId={profile.id}
        currentUserRole={currentMembership.role}
        canInvite={canInvite}
        isOwner={isOwner}
      />
    </div>
  );
}

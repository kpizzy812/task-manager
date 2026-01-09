"use client";

import { useState } from "react";

import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { CreateProjectModal } from "@/components/projects/create-project-modal";

type Project = {
  id: string;
  name: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
};

type DashboardShellProps = {
  user: User;
  projects: Project[];
  children: React.ReactNode;
};

export function DashboardShell({ user, projects, children }: DashboardShellProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user}
        mobileNav={
          <MobileNav
            projects={projects}
            onCreateProject={() => setIsCreateModalOpen(true)}
          />
        }
      />
      <Sidebar projects={projects} onCreateProject={() => setIsCreateModalOpen(true)} />
      <main className="md:pl-64">
        <div className="p-4 md:p-6">{children}</div>
      </main>
      <CreateProjectModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}

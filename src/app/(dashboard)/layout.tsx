import { redirect } from "next/navigation";

import { getCurrentProfile, getProjects } from "@/actions/projects";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AIChatWidget } from "@/components/ai/ai-chat-widget";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const projects = await getProjects();

  // Transform projects for sidebar
  const sidebarProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
  }));

  return (
    <>
      <DashboardShell user={profile} projects={sidebarProjects}>
        {children}
      </DashboardShell>
      <AIChatWidget />
    </>
  );
}

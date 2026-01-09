import { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentProfile, getProjects } from "@/actions/projects";
import { DashboardContent } from "./dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard | Task Manager",
  description: "Управляйте своими проектами и задачами",
};

export default async function DashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login?error=no_profile");
  }

  const projects = await getProjects();

  return <DashboardContent projects={projects} currentUserId={profile.id} />;
}

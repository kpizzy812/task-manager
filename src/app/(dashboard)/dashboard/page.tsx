import { Metadata } from "next";

import { getCurrentProfile, getProjects } from "@/actions/projects";
import { DashboardContent } from "./dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard | Task Manager",
  description: "Управляйте своими проектами и задачами",
};

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const projects = await getProjects();

  return <DashboardContent projects={projects} currentUserId={profile!.id} />;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, LayoutDashboard, Plus, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Project = {
  id: string;
  name: string;
};

type SidebarProps = {
  projects: Project[];
  onCreateProject: () => void;
};

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Настройки",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({ projects, onCreateProject }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-64 border-r bg-background md:block">
      <div className="flex h-full flex-col gap-2 p-4">
        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="my-2 h-px bg-border" />

        {/* Projects section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-3">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Проекты
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onCreateProject}
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Создать проект</span>
            </Button>
          </div>

          <nav className="flex flex-col gap-1">
            {projects.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Нет проектов
              </p>
            ) : (
              projects.map((project) => {
                const projectPath = `/projects/${project.id}`;
                const isActive = pathname.startsWith(projectPath);
                return (
                  <Link
                    key={project.id}
                    href={projectPath}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <FolderKanban className="h-4 w-4" />
                    <span className="truncate">{project.name}</span>
                  </Link>
                );
              })
            )}
          </nav>
        </div>
      </div>
    </aside>
  );
}

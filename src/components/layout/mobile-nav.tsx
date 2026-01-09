"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, LayoutDashboard, Menu, Plus, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Project = {
  id: string;
  name: string;
};

type MobileNavProps = {
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

export function MobileNav({ projects, onCreateProject }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const handleLinkClick = () => {
    setOpen(false);
  };

  const handleCreateProject = () => {
    setOpen(false);
    onCreateProject();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Меню</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              T
            </div>
            Task Manager
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-2 py-4">
          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
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
                onClick={handleCreateProject}
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
                      onClick={handleLinkClick}
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
      </SheetContent>
    </Sheet>
  );
}

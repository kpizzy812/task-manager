import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProjectChat } from "@/components/ai/project-chat";

export const metadata: Metadata = {
  title: "Создать проект с AI | Task Manager",
  description: "Создайте проект с задачами с помощью AI-ассистента",
};

export default function AIProjectPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Назад</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Создать проект с AI
          </h1>
          <p className="text-muted-foreground">
            Опишите цель, и AI создаст проект с задачами
          </p>
        </div>
      </div>

      <ProjectChat />
    </div>
  );
}

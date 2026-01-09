import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Страница не найдена
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Возможно, она была удалена или перемещена
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Вернуться на главную</Link>
        </Button>
      </div>
    </div>
  );
}

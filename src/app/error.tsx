"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold">Произошла ошибка</h1>
        <p className="mt-2 text-muted-foreground">
          Что-то пошло не так. Попробуйте обновить страницу.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground">
            Код: {error.digest}
          </p>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            <Home className="mr-2 h-4 w-4" />
            На главную
          </Button>
          <Button onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить
          </Button>
        </div>
      </div>
    </div>
  );
}

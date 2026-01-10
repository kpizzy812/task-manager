"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  // Prevent hydration mismatch - required pattern for next-themes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <span className="h-4 w-4" />
        <span className="sr-only">Переключить тему</span>
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
      {resolvedTheme === "dark" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="sr-only">Переключить тему</span>
    </Button>
  );
}

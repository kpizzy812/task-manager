"use client";

import { useState, useEffect } from "react";
import { Bot, RefreshCw, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { getProjectDigest } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DigestContent } from "./digest-content";

type DigestCardProps = {
  projectId: string;
};

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCacheKey(projectId: string) {
  return `ai-digest:${projectId}`;
}

interface CachedDigest {
  content: string;
  timestamp: number;
}

export function DigestCard({ projectId }: DigestCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load cached digest on mount
  useEffect(() => {
    const cached = localStorage.getItem(getCacheKey(projectId));
    if (cached) {
      try {
        const parsed: CachedDigest = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          setContent(parsed.content);
          setLastUpdated(new Date(parsed.timestamp));
          setIsOpen(true);
        } else {
          localStorage.removeItem(getCacheKey(projectId));
        }
      } catch {
        localStorage.removeItem(getCacheKey(projectId));
      }
    }
  }, [projectId]);

  async function handleGenerate() {
    setIsLoading(true);
    setIsOpen(true);

    try {
      const result = await getProjectDigest(projectId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.content) {
        setContent(result.content);
        setLastUpdated(new Date());

        // Cache the result
        const cached: CachedDigest = {
          content: result.content,
          timestamp: Date.now(),
        };
        localStorage.setItem(getCacheKey(projectId), JSON.stringify(cached));

        toast.success("План дня сгенерирован!");
      }
    } catch {
      toast.error("Ошибка генерации");
    } finally {
      setIsLoading(false);
    }
  }

  const canRefresh = !isLoading;

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">AI Ассистент</CardTitle>
            </div>
            {content && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isOpen ? "Свернуть" : "Развернуть"}
                </Button>
              </CollapsibleTrigger>
            )}
          </div>
          {!content && (
            <CardDescription>
              AI проанализирует ваши задачи и составит план на день
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          {!content ? (
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Сгенерировать план дня
            </Button>
          ) : (
            <CollapsibleContent>
              <DigestContent content={content} isLoading={isLoading} />

              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                {lastUpdated && (
                  <span>
                    Обновлено:{" "}
                    {lastUpdated.toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={!canRefresh}
                >
                  {isLoading ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-1 h-3 w-3" />
                  )}
                  Обновить
                </Button>
              </div>
            </CollapsibleContent>
          )}
        </CardContent>
      </Collapsible>
    </Card>
  );
}

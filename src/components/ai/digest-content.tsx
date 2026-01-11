"use client";

import { Skeleton } from "@/components/ui/skeleton";

type DigestContentProps = {
  content: string | null;
  isLoading: boolean;
};

export function DigestContent({ content, isLoading }: DigestContentProps) {
  if (isLoading && !content) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (!content) {
    return null;
  }

  // Simple markdown-like rendering
  const lines = content.split("\n");

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {lines.map((line, index) => {
        // Headers
        if (line.startsWith("## ")) {
          return (
            <h3
              key={index}
              className="text-sm font-semibold mt-4 mb-2 first:mt-0"
            >
              {line.slice(3)}
            </h3>
          );
        }

        // Empty lines
        if (!line.trim()) {
          return <div key={index} className="h-2" />;
        }

        // Regular text
        return (
          <p key={index} className="text-sm text-muted-foreground my-1">
            {line}
          </p>
        );
      })}
    </div>
  );
}

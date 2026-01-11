"use client";

import ReactMarkdown from "react-markdown";
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

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-2 prose-headings:text-base prose-hr:my-2">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

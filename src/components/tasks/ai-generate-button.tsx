"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { generateTaskDetails } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { type AIGeneratedTask } from "@/lib/validations/ai";

type AIGenerateButtonProps = {
  title: string;
  onGenerated: (data: AIGeneratedTask) => void;
  disabled?: boolean;
};

export function AIGenerateButton({
  title,
  onGenerated,
  disabled,
}: AIGenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerate() {
    if (!title.trim() || title.length < 3) {
      toast.error("Введите название задачи (минимум 3 символа)");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateTaskDetails(title);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        onGenerated(result.data);
        toast.success("Детали сгенерированы!");
      }
    } catch {
      toast.error("Ошибка генерации");
    } finally {
      setIsGenerating(false);
    }
  }

  const isDisabled = disabled || isGenerating || !title.trim() || title.length < 3;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleGenerate}
      disabled={isDisabled}
      className="shrink-0"
      title="AI сгенерирует описание, приоритет и дедлайн"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
    </Button>
  );
}

"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2, User } from "lucide-react";
import { toast } from "sonner";

import { uploadAvatar } from "@/actions/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type AvatarUploadProps = {
  currentAvatar: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-12 w-12",
  md: "h-20 w-20",
  lg: "h-32 w-32",
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

const fallbackTextSizes = {
  sm: "text-sm",
  md: "text-2xl",
  lg: "text-4xl",
};

export function AvatarUpload({
  currentAvatar,
  name,
  size = "md",
}: AvatarUploadProps) {
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const displayAvatar = preview || currentAvatar;

  function handleClick() {
    if (!isPending) {
      fileInputRef.current?.click();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Допустимые форматы: JPG, PNG, WebP, GIF");
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Максимальный размер файла: 2MB");
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadAvatar(formData);

      if (result.error) {
        toast.error(result.error);
        setPreview(null);
      } else {
        toast.success("Аватар обновлён");
      }
    });

    // Reset input
    e.target.value = "";
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "group relative rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          isPending && "cursor-not-allowed"
        )}
      >
        <Avatar className={cn(sizeClasses[size], "transition-opacity")}>
          <AvatarImage
            src={displayAvatar ?? undefined}
            alt={name}
            className={cn(
              "transition-opacity",
              isPending && "opacity-50"
            )}
          />
          <AvatarFallback className={fallbackTextSizes[size]}>
            {initials || <User className={iconSizes[size]} />}
          </AvatarFallback>
        </Avatar>

        {/* Overlay on hover */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity",
            !isPending && "group-hover:opacity-100",
            isPending && "opacity-100"
          )}
        >
          {isPending ? (
            <Loader2 className={cn(iconSizes[size], "animate-spin text-white")} />
          ) : (
            <Camera className={cn(iconSizes[size], "text-white")} />
          )}
        </div>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        disabled={isPending}
      />
    </div>
  );
}

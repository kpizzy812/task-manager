"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Copy, Link2, Globe } from "lucide-react";
import { toast } from "sonner";

import {
  inviteMember,
  createPublicInviteLink,
} from "@/actions/projects";
import {
  inviteMemberSchema,
  type InviteMemberInput,
} from "@/lib/validations/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type QuickInviteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
};

export function QuickInviteModal({
  open,
  onOpenChange,
  projectId,
  projectName,
}: QuickInviteModalProps) {
  const [isPending, startTransition] = useTransition();
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
    },
  });

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Ссылка скопирована");
  }

  function onSubmit(data: InviteMemberInput) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", data.email);

      const result = await inviteMember(projectId, formData);

      if (result.error) {
        toast.error(result.error);
      } else if (result.token) {
        const link = `${window.location.origin}/invite/${result.token}`;
        setGeneratedLink(link);
        form.reset();
        toast.success("Приглашение создано");
      }
    });
  }

  function handleCreatePublicLink() {
    startTransition(async () => {
      const result = await createPublicInviteLink(projectId);

      if (result.error) {
        toast.error(result.error);
      } else if (result.token) {
        const link = `${window.location.origin}/invite/${result.token}`;
        setGeneratedLink(link);
        toast.success("Публичная ссылка создана");
      }
    });
  }

  function handleClose() {
    setGeneratedLink(null);
    form.reset();
    onOpenChange(false);
  }

  // Show generated link view
  if (generatedLink) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Ссылка-приглашение создана</DialogTitle>
            <DialogDescription>
              Скопируйте и отправьте ссылку участнику
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={generatedLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(generatedLink)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <Button
              className="w-full"
              onClick={() => {
                copyToClipboard(generatedLink);
                handleClose();
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Скопировать и закрыть
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Пригласить в проект</DialogTitle>
          <DialogDescription>
            {projectName}
          </DialogDescription>
        </DialogHeader>

        {/* Public Link */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Публичная ссылка</span>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleCreatePublicLink}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-2 h-4 w-4" />
            )}
            Создать публичную ссылку
          </Button>
          <p className="text-xs text-muted-foreground">
            Любой с этой ссылкой сможет присоединиться
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              или
            </span>
          </div>
        </div>

        {/* Email Invitation */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">По email</span>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Email</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="user@example.com"
                          disabled={isPending}
                          {...field}
                        />
                        <Button type="submit" disabled={isPending}>
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Создать"
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <p className="text-xs text-muted-foreground">
            Приглашение будет привязано к этому email
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

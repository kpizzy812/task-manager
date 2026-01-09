"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, X, Copy, Check, Link2, Globe } from "lucide-react";
import { toast } from "sonner";

import {
  inviteMember,
  cancelInvitation,
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
  DialogFooter,
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Invitation = {
  id: string;
  email: string | null;
  token: string;
  isPublic: boolean;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    email: string;
  };
};

type InviteMemberModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  invitations: Invitation[];
};

export function InviteMemberModal({
  open,
  onOpenChange,
  projectId,
  invitations,
}: InviteMemberModalProps) {
  const [isPending, startTransition] = useTransition();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
    },
  });

  function copyToClipboard(text: string, token?: string) {
    navigator.clipboard.writeText(text);
    if (token) {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    }
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

  function handleCancelInvitation(invitationId: string) {
    startTransition(async () => {
      const result = await cancelInvitation(invitationId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Приглашение отменено");
      }
    });
  }

  function copyInviteLink(token: string) {
    const link = `${window.location.origin}/invite/${token}`;
    copyToClipboard(link, token);
  }

  // Separate invitations by type
  const emailInvitations = invitations.filter((inv) => !inv.isPublic);
  const publicInvitations = invitations.filter((inv) => inv.isPublic);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Пригласить участника</DialogTitle>
            <DialogDescription>
              Создайте ссылку-приглашение и отправьте её участнику
            </DialogDescription>
          </DialogHeader>

          {/* Public Link Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Публичная ссылка</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Любой с этой ссылкой сможет присоединиться к проекту
            </p>
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

          {/* Email Invitation Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Приглашение по email</h4>
            </div>
            <Alert>
              <AlertDescription className="text-xs">
                Автоматическая отправка email в разработке. После создания
                приглашения скопируйте ссылку и отправьте вручную.
              </AlertDescription>
            </Alert>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email участника</FormLabel>
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
                              <Mail className="h-4 w-4" />
                            )}
                            <span className="ml-2 hidden sm:inline">
                              Создать
                            </span>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>

          {/* Public Invitations List */}
          {publicInvitations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Активные публичные ссылки
              </h4>
              <div className="space-y-2">
                {publicInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Публичная ссылка</span>
                      <Badge variant="secondary" className="text-xs">
                        Многоразовая
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyInviteLink(invitation.token)}
                        disabled={isPending}
                      >
                        {copiedToken === invitation.token ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span className="sr-only">Копировать ссылку</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancelInvitation(invitation.id)}
                        disabled={isPending}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Удалить ссылку</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email Invitations List */}
          {emailInvitations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Ожидающие приглашения по email
              </h4>
              <div className="space-y-2">
                {emailInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{invitation.email}</span>
                      <Badge variant="outline" className="text-xs">
                        Ожидает
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyInviteLink(invitation.token)}
                        disabled={isPending}
                      >
                        {copiedToken === invitation.token ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span className="sr-only">Копировать ссылку</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancelInvitation(invitation.id)}
                        disabled={isPending}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Отменить приглашение</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generated Link Modal */}
      <Dialog open={!!generatedLink} onOpenChange={() => setGeneratedLink(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ссылка-приглашение создана</DialogTitle>
            <DialogDescription>
              Скопируйте ссылку и отправьте её участнику
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={generatedLink || ""}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => generatedLink && copyToClipboard(generatedLink)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <Button
              className="w-full"
              onClick={() => {
                if (generatedLink) {
                  copyToClipboard(generatedLink);
                  setGeneratedLink(null);
                }
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Скопировать и закрыть
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

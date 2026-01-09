"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, X, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import { inviteMember, cancelInvitation } from "@/actions/projects";
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

type Invitation = {
  id: string;
  email: string;
  token: string;
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

  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmit(data: InviteMemberInput) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", data.email);

      const result = await inviteMember(projectId, formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Приглашение отправлено");
        form.reset();
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
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success("Ссылка скопирована");
    setTimeout(() => setCopiedToken(null), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Пригласить участника</DialogTitle>
          <DialogDescription>
            Отправьте приглашение по email. Участник получит ссылку для
            присоединения к проекту.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
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
                        <span className="ml-2">Пригласить</span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        {invitations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Ожидающие приглашения
            </h4>
            <div className="space-y-2">
              {invitations.map((invitation) => (
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
  );
}

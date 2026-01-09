"use client";

import { useTransition } from "react";
import { MoreHorizontal, Shield, ShieldCheck, Crown, UserMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateMemberRole, removeMember } from "@/actions/projects";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ProjectRole = "OWNER" | "ADMIN" | "MEMBER";

type Member = {
  id: string;
  role: ProjectRole;
  joinedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
};

type ProjectMembersListProps = {
  projectId: string;
  members: Member[];
  currentUserId: string;
  currentUserRole: ProjectRole;
};

const roleLabels: Record<ProjectRole, string> = {
  OWNER: "Владелец",
  ADMIN: "Администратор",
  MEMBER: "Участник",
};

const roleBadgeVariants: Record<ProjectRole, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  ADMIN: "secondary",
  MEMBER: "outline",
};

export function ProjectMembersList({
  projectId,
  members,
  currentUserId,
  currentUserRole,
}: ProjectMembersListProps) {
  const [isPending, startTransition] = useTransition();
  const canChangeRoles = currentUserRole === "OWNER";

  function handleRoleChange(memberId: string, newRole: "ADMIN" | "MEMBER") {
    startTransition(async () => {
      const result = await updateMemberRole(projectId, memberId, newRole);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Роль обновлена");
      }
    });
  }

  function handleRemoveMember(memberId: string) {
    startTransition(async () => {
      const result = await removeMember(projectId, memberId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Участник удалён из проекта");
      }
    });
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function canRemoveMember(member: Member): boolean {
    // Cannot remove owner
    if (member.role === "OWNER") return false;
    // Can always remove self
    if (member.user.id === currentUserId) return true;
    // Owner can remove anyone
    if (currentUserRole === "OWNER") return true;
    // Admin can remove members but not other admins
    if (currentUserRole === "ADMIN" && member.role === "MEMBER") return true;
    return false;
  }

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between rounded-lg border p-4"
        >
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.user.avatar ?? undefined} />
              <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{member.user.name}</span>
                {member.user.id === currentUserId && (
                  <Badge variant="outline" className="text-xs">
                    Вы
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{member.user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={roleBadgeVariants[member.role]}>
              {member.role === "OWNER" && <Crown className="mr-1 h-3 w-3" />}
              {member.role === "ADMIN" && <ShieldCheck className="mr-1 h-3 w-3" />}
              {member.role === "MEMBER" && <Shield className="mr-1 h-3 w-3" />}
              {roleLabels[member.role]}
            </Badge>

            {(canChangeRoles || canRemoveMember(member)) && member.role !== "OWNER" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={isPending}>
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="h-4 w-4" />
                    )}
                    <span className="sr-only">Действия</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canChangeRoles && member.user.id !== currentUserId && (
                    <>
                      {member.role === "MEMBER" && (
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(member.user.id, "ADMIN")}
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Сделать администратором
                        </DropdownMenuItem>
                      )}
                      {member.role === "ADMIN" && (
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(member.user.id, "MEMBER")}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Понизить до участника
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {canRemoveMember(member) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          className="text-destructive focus:text-destructive"
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          {member.user.id === currentUserId
                            ? "Покинуть проект"
                            : "Удалить из проекта"}
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {member.user.id === currentUserId
                              ? "Покинуть проект?"
                              : "Удалить участника?"}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {member.user.id === currentUserId
                              ? "Вы уверены, что хотите покинуть этот проект? Вы потеряете доступ ко всем задачам."
                              : `Вы уверены, что хотите удалить ${member.user.name} из проекта?`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveMember(member.user.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {member.user.id === currentUserId ? "Покинуть" : "Удалить"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

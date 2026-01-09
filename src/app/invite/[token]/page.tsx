import { Metadata } from "next";
import { notFound } from "next/navigation";

import { getInvitationByToken, getCurrentProfile } from "@/actions/projects";
import { InvitePageClient } from "./invite-client";

type Props = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return {
      title: "Приглашение не найдено | Task Manager",
    };
  }

  return {
    title: `Приглашение в ${invitation.project.name} | Task Manager`,
    description: `Вас пригласили присоединиться к проекту ${invitation.project.name}`,
  };
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const [invitation, profile] = await Promise.all([
    getInvitationByToken(token),
    getCurrentProfile(),
  ]);

  if (!invitation) {
    notFound();
  }

  return (
    <InvitePageClient
      token={token}
      invitation={{
        email: invitation.email,
        project: {
          name: invitation.project.name,
          description: invitation.project.description,
        },
        sender: {
          name: invitation.sender.name,
        },
      }}
      isLoggedIn={!!profile}
      userEmail={profile?.email}
    />
  );
}

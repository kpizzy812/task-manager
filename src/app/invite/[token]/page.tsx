import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getInvitationByToken, getCurrentProfile } from "@/actions/projects";
import { checkEmailExists } from "@/actions/auth";
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

  // If user is not logged in and this is an email-specific invite,
  // redirect to login or register with prefilled email
  if (!profile && invitation.email) {
    const emailExists = await checkEmailExists(invitation.email);
    const targetPath = emailExists ? "/login" : "/register";
    redirect(`${targetPath}?invite=${token}&email=${encodeURIComponent(invitation.email)}`);
  }

  return (
    <InvitePageClient
      token={token}
      invitation={{
        email: invitation.email,
        isPublic: invitation.isPublic,
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

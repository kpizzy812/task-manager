import { Metadata } from "next";
import { redirect } from "next/navigation";

import { getProfileDetails } from "@/actions/profile";
import { ProfileSettings } from "@/components/settings/profile-settings";

export const metadata: Metadata = {
  title: "Настройки | Task Manager",
  description: "Управление настройками профиля",
};

export default async function SettingsPage() {
  const profile = await getProfileDetails();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
        <p className="text-muted-foreground">
          Управление профилем и настройками аккаунта
        </p>
      </div>

      <ProfileSettings profile={profile} />
    </div>
  );
}

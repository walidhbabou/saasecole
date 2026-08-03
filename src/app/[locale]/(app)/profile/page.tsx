import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getProfileFull } from "@/lib/dal";
import { ProfileClient } from "./_client";

export default async function ProfilePage() {
  const locale = await getLocale();
  const profile = await getProfileFull();

  if (!profile) redirect(`/${locale}/login`);

  const school = (Array.isArray(profile.school) ? profile.school[0] : profile.school) as
    { name: string; name_ar?: string } | null;

  return (
    <ProfileClient
      locale={locale}
      profile={{
        id: profile.id,
        role: profile.role,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone ?? null,
        email: profile.email,
        school,
      }}
    />
  );
}

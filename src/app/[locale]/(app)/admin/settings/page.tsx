import { getLocale } from "next-intl/server";
import { getProfile, getSchool } from "@/lib/dal";
import { AdminSettingsClient } from "./_client";

export default async function AdminSettingsPage() {
  const locale = await getLocale();
  const profile = await getProfile();
  const school = profile?.school_id ? await getSchool(profile.school_id) : null;
  return <AdminSettingsClient locale={locale} school={school} />;
}

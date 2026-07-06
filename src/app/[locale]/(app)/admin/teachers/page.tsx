import { getLocale } from "next-intl/server";
import { getProfile, getTeachers, getClassList } from "@/lib/dal";
import { TeachersClient } from "./_client";

export default async function TeachersPage() {
  const locale = await getLocale();
  const profile = await getProfile();
  if (!profile?.school_id) return null;

  const [teachers, classes] = await Promise.all([
    getTeachers(profile.school_id),
    getClassList(profile.school_id),
  ]);

  return <TeachersClient teachers={teachers} classes={classes} locale={locale} />;
}

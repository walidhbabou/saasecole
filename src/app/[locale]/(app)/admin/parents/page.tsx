import { getLocale } from "next-intl/server";
import { getProfile, getParents, getStudentList } from "@/lib/dal";
import { ParentsClient } from "./_client";

export default async function ParentsPage() {
  const locale = await getLocale();
  const profile = await getProfile();
  if (!profile?.school_id) return null;

  const [parents, students] = await Promise.all([
    getParents(profile.school_id),
    getStudentList(profile.school_id),
  ]);

  return <ParentsClient parents={parents} students={students} locale={locale} />;
}

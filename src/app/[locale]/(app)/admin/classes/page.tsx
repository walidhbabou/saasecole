import { getLocale } from "next-intl/server";
import { getProfile, getClasses, getTeachers } from "@/lib/dal";
import { ClassesClient } from "./_client";

export default async function AdminClassesPage() {
  const locale = await getLocale();
  const profile = await getProfile();
  const schoolId = profile?.school_id ?? "";
  const [classes, teachers] = await Promise.all([
    getClasses(schoolId),
    getTeachers(schoolId),
  ]);
  return <ClassesClient classes={classes} teachers={teachers} locale={locale} />;
}

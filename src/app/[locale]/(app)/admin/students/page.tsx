import { getLocale } from "next-intl/server";
import { getProfile, getStudentsWithEnrollment, getClassList } from "@/lib/dal";
import { StudentsClient } from "./_client";

export default async function AdminStudentsPage() {
  const locale = await getLocale();
  const profile = await getProfile();
  const schoolId = profile?.school_id ?? "";

  const [enrollments, classes] = await Promise.all([
    getStudentsWithEnrollment(schoolId),
    getClassList(schoolId),
  ]);

  return <StudentsClient enrollments={enrollments} classes={classes} locale={locale} />;
}

import { getLocale } from "next-intl/server";
import { getProfile, getClassList, getStudentsInClass, getAttendanceForSession } from "@/lib/dal";
import { AttendanceClient } from "./_client";

export default async function AdminAttendancePage() {
  const locale = await getLocale();
  const profile = await getProfile();
  const schoolId = profile?.school_id ?? "";

  const classes = await getClassList(schoolId);
  const today = new Date().toISOString().split("T")[0];
  const firstClass = classes[0];

  const [students, existingRecords] = firstClass
    ? await Promise.all([
        getStudentsInClass(firstClass.id),
        getAttendanceForSession(firstClass.id, today, "morning"),
      ])
    : [[], {}];

  return (
    <AttendanceClient
      classes={classes}
      initialClassId={firstClass?.id ?? ""}
      initialStudents={students}
      initialRecords={existingRecords}
      today={today}
      locale={locale}
    />
  );
}

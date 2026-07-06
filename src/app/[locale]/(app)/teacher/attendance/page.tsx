import { getLocale } from "next-intl/server";
import { getProfile, getTeacherClassList, getStudentsInClass, getAttendanceForSession } from "@/lib/dal";
import { AttendanceClient } from "../../admin/attendance/_client";

export default async function TeacherAttendancePage() {
  const locale = await getLocale();
  const profile = await getProfile();
  const classes = await getTeacherClassList(profile?.id ?? "");
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

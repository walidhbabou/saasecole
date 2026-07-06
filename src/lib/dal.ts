// Data Access Layer — server-side only, imported by server components
import { createClient } from "@/lib/supabase/server";

const YEAR = "2025-2026";

function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

// ── Current user ───────────────────────────────────────────────────────────
export async function getProfile() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb
    .from("profiles")
    .select("id, school_id, role, first_name, last_name")
    .eq("id", user.id)
    .single();
  return data;
}

// ── Admin ──────────────────────────────────────────────────────────────────
export async function getAdminStats(schoolId: string) {
  const sb = await createClient();
  const [stuRes, tchRes, clsRes, feesRes, newRes] = await Promise.all([
    sb.from("students").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
    sb.from("profiles").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("role", "teacher"),
    sb.from("classes").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("academic_year", YEAR),
    sb.from("fees").select("amount, status").eq("school_id", schoolId).eq("academic_year", YEAR),
    sb.from("enrollments").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("academic_year", YEAR).eq("status", "active").gte("enrolled_at", firstDayOfMonth()),
  ]);
  const fees = feesRes.data ?? [];
  return {
    totalStudents: stuRes.count ?? 0,
    totalTeachers: tchRes.count ?? 0,
    totalClasses: clsRes.count ?? 0,
    monthlyRevenue: fees.filter(f => f.status === "paid").reduce((a: number, f: any) => a + Number(f.amount), 0),
    pendingFees: fees.filter(f => f.status === "pending" || f.status === "overdue").length,
    newStudentsThisMonth: newRes.count ?? 0,
  };
}

export async function getRecentEnrollments(schoolId: string, limit = 5) {
  const sb = await createClient();
  const { data } = await sb
    .from("enrollments")
    .select("id, enrolled_at, student:students(first_name, last_name), class:classes(name)")
    .eq("school_id", schoolId)
    .eq("academic_year", YEAR)
    .order("enrolled_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getClassAttendanceRates(schoolId: string) {
  const sb = await createClient();
  const { data: classes } = await sb
    .from("classes")
    .select("id, name, max_students")
    .eq("school_id", schoolId)
    .eq("academic_year", YEAR)
    .limit(6);
  if (!classes?.length) return [];

  return Promise.all(classes.map(async (cls) => {
    const { count: enrolled } = await sb
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("class_id", cls.id)
      .eq("status", "active");

    const { data: sessions } = await sb
      .from("attendance_sessions")
      .select("id")
      .eq("class_id", cls.id)
      .order("date", { ascending: false })
      .limit(10);

    let rate = 0;
    if (sessions?.length) {
      const ids = sessions.map(s => s.id);
      const [{ count: total }, { count: present }] = await Promise.all([
        sb.from("attendance_records").select("id", { count: "exact", head: true }).in("session_id", ids),
        sb.from("attendance_records").select("id", { count: "exact", head: true }).in("session_id", ids).eq("status", "present"),
      ]);
      rate = total ? Math.round(((present ?? 0) / total) * 100) : 0;
    }
    return { name: cls.name, students: enrolled ?? 0, rate };
  }));
}

export async function getStudentsWithEnrollment(schoolId: string) {
  const sb = await createClient();
  const { data } = await sb
    .from("enrollments")
    .select(`
      id, enrolled_at, status,
      student:students!inner(id, matricule, first_name, last_name, gender, birth_date),
      class:classes(id, name)
    `)
    .eq("school_id", schoolId)
    .eq("academic_year", YEAR)
    .eq("status", "active")
    .order("enrolled_at", { ascending: false });
  return data ?? [];
}

export async function getClasses(schoolId: string) {
  const sb = await createClient();
  const { data } = await sb
    .from("classes")
    .select("id, name, max_students, teacher:profiles(id, first_name, last_name)")
    .eq("school_id", schoolId)
    .eq("academic_year", YEAR)
    .order("name");
  if (!data) return [];

  return Promise.all(data.map(async (cls) => {
    const { count } = await sb
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("class_id", cls.id)
      .eq("status", "active");
    return { ...cls, students_count: count ?? 0 };
  }));
}

export async function getTeachers(schoolId: string) {
  const sb = await createClient();
  const [teachersRes, classesRes] = await Promise.all([
    sb.from("profiles")
      .select("id, first_name, last_name, phone, created_at")
      .eq("school_id", schoolId)
      .eq("role", "teacher")
      .order("first_name"),
    sb.from("classes")
      .select("id, name, teacher_id")
      .eq("school_id", schoolId)
      .eq("academic_year", YEAR),
  ]);
  const classes = classesRes.data ?? [];
  return (teachersRes.data ?? []).map(t => ({
    ...t,
    assigned_class: classes.find(c => c.teacher_id === t.id) ?? null,
  }));
}

export async function getClassList(schoolId: string) {
  const sb = await createClient();
  const { data } = await sb
    .from("classes")
    .select("id, name")
    .eq("school_id", schoolId)
    .eq("academic_year", YEAR)
    .order("name");
  return data ?? [];
}

export async function getStudentsInClass(classId: string) {
  const sb = await createClient();
  const { data } = await sb
    .from("enrollments")
    .select("student:students!inner(id, first_name, last_name, matricule)")
    .eq("class_id", classId)
    .eq("status", "active")
    .order("id");
  return (data ?? []).map(e => e.student as any);
}

export async function getAttendanceForSession(classId: string, date: string, period: string) {
  const sb = await createClient();
  const { data: session } = await sb
    .from("attendance_sessions")
    .select("id")
    .eq("class_id", classId)
    .eq("date", date)
    .eq("period", period)
    .maybeSingle();

  const records: Record<string, string> = {};
  if (session) {
    const { data: recs } = await sb
      .from("attendance_records")
      .select("student_id, status")
      .eq("session_id", session.id);
    (recs ?? []).forEach((r: any) => { records[r.student_id] = r.status; });
  }
  return records;
}

export async function getFees(schoolId: string) {
  const sb = await createClient();
  const { data } = await sb
    .from("fees")
    .select(`
      id, amount, due_date, paid_at, status,
      fee_type:fee_types(name, name_ar),
      student:students!inner(id, first_name, last_name, matricule)
    `)
    .eq("school_id", schoolId)
    .eq("academic_year", YEAR)
    .order("due_date", { ascending: false });
  return data ?? [];
}

export async function getEnrollments(schoolId: string) {
  const sb = await createClient();
  const { data } = await sb
    .from("enrollments")
    .select(`
      id, academic_year, enrolled_at, status,
      student:students!inner(id, first_name, last_name, matricule),
      class:classes(id, name)
    `)
    .eq("school_id", schoolId)
    .eq("academic_year", YEAR)
    .order("enrolled_at", { ascending: false });
  return data ?? [];
}

// ── Teacher ────────────────────────────────────────────────────────────────
export async function getTeacherDashboard(teacherId: string) {
  const sb = await createClient();
  const { data: classes } = await sb
    .from("classes")
    .select("id, name, max_students")
    .eq("teacher_id", teacherId)
    .eq("academic_year", YEAR);

  if (!classes?.length) return { classes: [], absences: [] };

  const today = new Date().toISOString().split("T")[0];

  const classStats = await Promise.all(classes.map(async (cls) => {
    const { count: enrolled } = await sb
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("class_id", cls.id)
      .eq("status", "active");

    const { data: todaySession } = await sb
      .from("attendance_sessions")
      .select("id")
      .eq("class_id", cls.id)
      .eq("date", today)
      .eq("period", "morning")
      .maybeSingle();

    let present = enrolled ?? 0;
    if (todaySession) {
      const { count: p } = await sb
        .from("attendance_records")
        .select("id", { count: "exact", head: true })
        .eq("session_id", todaySession.id)
        .eq("status", "present");
      present = p ?? 0;
    }
    const students = enrolled ?? 0;
    return { name: cls.name, students, present, rate: students ? Math.round((present / students) * 100) : 0 };
  }));

  // Recent absences (last 3 sessions)
  const classIds = classes.map(c => c.id);
  const { data: recentSessions } = await sb
    .from("attendance_sessions")
    .select("id, date, class:classes(name)")
    .in("class_id", classIds)
    .order("date", { ascending: false })
    .limit(6);

  const sessionIds = (recentSessions ?? []).map(s => s.id);
  let absences: any[] = [];
  if (sessionIds.length) {
    const { data: absRecs } = await sb
      .from("attendance_records")
      .select("session_id, student:students(first_name, last_name)")
      .in("session_id", sessionIds)
      .eq("status", "absent")
      .limit(5);

    absences = (absRecs ?? []).map(r => {
      const session = (recentSessions ?? []).find(s => s.id === r.session_id);
      return {
        name: `${(r.student as any)?.first_name} ${(r.student as any)?.last_name}`,
        class: (session?.class as any)?.name ?? "",
        date: session?.date ?? "",
      };
    });
  }

  return { classes: classStats, absences };
}

export async function getTeacherClassList(teacherId: string) {
  const sb = await createClient();
  const { data } = await sb
    .from("classes")
    .select("id, name")
    .eq("teacher_id", teacherId)
    .eq("academic_year", YEAR);
  return data ?? [];
}

export async function getTeacherStudents(teacherId: string) {
  const sb = await createClient();
  const { data: classes } = await sb
    .from("classes")
    .select("id, name")
    .eq("teacher_id", teacherId)
    .eq("academic_year", YEAR);

  if (!classes?.length) return [];

  const classIds = classes.map(c => c.id);
  const { data } = await sb
    .from("enrollments")
    .select("student:students!inner(id, first_name, last_name), class:classes(name)")
    .in("class_id", classIds)
    .eq("status", "active");

  // Compute absences per student
  return Promise.all((data ?? []).map(async (e: any) => {
    const { count } = await sb
      .from("attendance_records")
      .select("id", { count: "exact", head: true })
      .eq("student_id", e.student.id)
      .eq("status", "absent");
    return {
      id: e.student.id,
      firstName: e.student.first_name,
      lastName: e.student.last_name,
      class: (e.class as any)?.name ?? "",
      absences: count ?? 0,
    };
  }));
}

// ── Parent ─────────────────────────────────────────────────────────────────
export async function getParentDashboard(parentId: string) {
  const sb = await createClient();
  const { data: links } = await sb
    .from("student_parents")
    .select(`
      student:students!inner(
        id, first_name, last_name, first_name_ar, last_name_ar, matricule,
        enrollments(class:classes(name, teacher:profiles(first_name, last_name)))
      )
    `)
    .eq("parent_id", parentId);

  const child = (links?.[0]?.student) as any;
  if (!child) return null;

  const enrollment = child.enrollments?.[0];
  const cls = (enrollment?.class as any);

  // Attendance rate (last 30 days)
  const { data: recent } = await sb
    .from("attendance_records")
    .select("status, session:attendance_sessions!inner(date)")
    .eq("student_id", child.id)
    .order("attendance_sessions(date)", { ascending: false })
    .limit(30);

  const records = recent ?? [];
  const attendanceRate = records.length
    ? Math.round((records.filter((r: any) => r.status === "present").length / records.length) * 100)
    : 0;
  const absenceCount = records.filter((r: any) => r.status === "absent").length;

  // Next fee
  const { data: nextFee } = await sb
    .from("fees")
    .select("amount, due_date")
    .eq("student_id", child.id)
    .eq("status", "pending")
    .order("due_date")
    .limit(1)
    .maybeSingle();

  // Recent attendance (last 5)
  const recentAttendance = records.slice(0, 5).map((r: any) => ({
    date: (r.session as any)?.date ?? "",
    status: r.status,
  }));

  return {
    child: {
      id: child.id,
      name: `${child.first_name} ${child.last_name}`,
      nameAr: `${child.first_name_ar} ${child.last_name_ar}`,
      matricule: child.matricule,
      class: cls?.name ?? "",
      teacher: cls?.teacher ? `${(cls.teacher as any).first_name} ${(cls.teacher as any).last_name}` : "",
    },
    attendanceRate,
    absenceCount,
    nextFee,
    recentAttendance,
  };
}

export async function getChildAttendanceHistory(parentId: string) {
  const sb = await createClient();
  const { data: links } = await sb
    .from("student_parents")
    .select("student_id")
    .eq("parent_id", parentId);

  const studentId = links?.[0]?.student_id;
  if (!studentId) return { monthly: [], daily: [] };

  const { data: records } = await sb
    .from("attendance_records")
    .select("status, session:attendance_sessions!inner(date, period)")
    .eq("student_id", studentId)
    .order("attendance_sessions(date)", { ascending: false })
    .limit(60);

  const daily = (records ?? []).slice(0, 10).map((r: any) => ({
    date: (r.session as any)?.date ?? "",
    status: r.status,
  }));

  // Group by month
  const byMonth: Record<string, { present: number; absent: number; late: number }> = {};
  (records ?? []).forEach((r: any) => {
    const date: string = (r.session as any)?.date ?? "";
    if (!date) return;
    const [y, m] = date.split("-");
    const key = `${y}-${m}`;
    if (!byMonth[key]) byMonth[key] = { present: 0, absent: 0, late: 0 };
    if (r.status === "present") byMonth[key].present++;
    else if (r.status === "absent") byMonth[key].absent++;
    else if (r.status === "late") byMonth[key].late++;
  });

  const monthly = Object.entries(byMonth).slice(0, 4).map(([key, v]) => {
    const total = v.present + v.absent + v.late;
    return { month: key, ...v, rate: total ? Math.round((v.present / total) * 100) : 0 };
  });

  return { monthly, daily };
}

export async function getChildFees(parentId: string) {
  const sb = await createClient();
  const { data: links } = await sb
    .from("student_parents")
    .select("student_id")
    .eq("parent_id", parentId);

  const studentId = links?.[0]?.student_id;
  if (!studentId) return [];

  const { data } = await sb
    .from("fees")
    .select("id, amount, due_date, paid_at, status, fee_type:fee_types(name, name_ar)")
    .eq("student_id", studentId)
    .eq("academic_year", YEAR)
    .order("due_date");
  return data ?? [];
}

// ── School detail ──────────────────────────────────────────────────────────
export async function getSchool(schoolId: string) {
  const sb = await createClient();
  const { data } = await sb
    .from("schools")
    .select("id, name, name_ar, phone, email, address, city, plan, subscription_status, subscription_end_at, notification_prefs")
    .eq("id", schoolId)
    .single();
  return data;
}

// ── Super ──────────────────────────────────────────────────────────────────
export async function getAllSchools() {
  const sb = await createClient();
  const { data } = await sb
    .from("schools")
    .select("id, name, name_ar, city, plan, subscription_status, created_at")
    .order("name");
  return data ?? [];
}

export async function getSuperStats() {
  const sb = await createClient();
  const [schoolsRes, studentsRes, feesRes] = await Promise.all([
    sb.from("schools").select("id, subscription_status"),
    sb.from("students").select("id", { count: "exact", head: true }),
    sb.from("fees").select("amount").eq("status", "paid"),
  ]);
  const schools = schoolsRes.data ?? [];
  return {
    totalSchools: schools.length,
    activeSchools: schools.filter(s => s.subscription_status === "active").length,
    totalStudents: studentsRes.count ?? 0,
    totalRevenue: (feesRes.data ?? []).reduce((a: number, f: any) => a + Number(f.amount), 0),
  };
}

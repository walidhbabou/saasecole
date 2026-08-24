// Data Access Layer — server-side only, imported by server components
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

// ── Auth / login bootstrap ────────────────────────────────────────────────
type LoginDemoProfile = {
  role: "super" | "admin" | "teacher" | "parent";
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  school: { id: string; name: string }[] | null;
};

export async function getLoginDemoUsers() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, role, first_name, last_name, school:schools(id, name), email")
    .in("role", ["super", "admin", "teacher", "parent"])
    .order("first_name");

  const roleOrder = ["super", "admin", "teacher", "parent"];
  return (data ?? [])
    .map((profile) => {
      const typedProfile = profile as unknown as LoginDemoProfile;
      const school = typedProfile.school?.[0] ?? null;
      return {
        role: typedProfile.role,
        email: typedProfile.email ?? "",
        name: `${typedProfile.first_name ?? ""} ${typedProfile.last_name ?? ""}`.trim() || typedProfile.role,
        school: typedProfile.role === "super" ? "Console Plateforme" : school?.name ?? "",
        schoolId: school?.id ?? null,
        redirect: `/${typedProfile.role === "super" ? "super" : typedProfile.role}/dashboard`,
      };
    })
    .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));
}

export async function getLoginPlatformStats() {
  const admin = createAdminClient();
  const [schoolsRes, studentsRes] = await Promise.all([
    admin.from("schools").select("id", { count: "exact", head: true }),
    admin.from("students").select("id", { count: "exact", head: true }),
  ]);

  return {
    schools: schoolsRes.count ?? 0,
    students: studentsRes.count ?? 0,
  };
}

// ── Admin ──────────────────────────────────────────────────────────────────
export async function getAdminStats(schoolId: string) {
  const sb = await createClient();
  const admin = createAdminClient();
  const [stuRes, tchRes, clsRes, feesRes, newRes] = await Promise.all([
    sb.from("students").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("role", "teacher"),
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
  const admin = createAdminClient();
  const { data } = await admin
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
  const admin = createAdminClient();
  const [teachersRes, classesRes] = await Promise.all([
    admin.from("profiles")
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

export async function getStudentList(schoolId: string) {
  const sb = await createClient();
  const { data } = await sb
    .from("students")
    .select("id, first_name, last_name, matricule")
    .eq("school_id", schoolId)
    .order("first_name");
  return data ?? [];
}

export async function getParents(schoolId: string) {
  const admin = createAdminClient();
  const { data: parents } = await admin
    .from("profiles")
    .select("id, first_name, last_name, phone, created_at")
    .eq("school_id", schoolId)
    .eq("role", "parent")
    .order("first_name");
  if (!parents?.length) return [];

  const parentIds = parents.map(p => p.id);
  const { data: links } = await admin
    .from("student_parents")
    .select("parent_id, student:students(id, first_name, last_name, matricule)")
    .in("parent_id", parentIds);

  const linksMap: Record<string, any> = {};
  (links ?? []).forEach(l => { linksMap[l.parent_id] = l.student; });

  return parents.map(p => ({ ...p, student: linksMap[p.id] ?? null }));
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

// ── Profile (full) ────────────────────────────────────────────────────────
export async function getProfileFull() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb
    .from("profiles")
    .select("id, school_id, role, first_name, last_name, phone, school:schools(name, name_ar)")
    .eq("id", user.id)
    .single();
  if (!data) return null;
  return { ...data, email: user.email ?? "" };
}

// ── Notifications ──────────────────────────────────────────────────────────
export type NotifItem = {
  id: string;
  type: "absence" | "fee" | "enrollment" | "info";
  count: number;
  extra?: string;
};

function notificationKey(item: NotifItem) {
  return `${item.id}:${item.type}:${item.count}:${item.extra ?? ""}`;
}

export async function getNotificationsData(
  role: string,
  schoolId: string | null,
  userId: string,
): Promise<NotifItem[]> {
  const sb = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const items: NotifItem[] = [];

  if (role === "admin" && schoolId) {
    const [overdueRes, enrollRes] = await Promise.all([
      sb.from("fees").select("id", { count: "exact", head: true })
        .eq("school_id", schoolId).eq("status", "overdue"),
      sb.from("enrollments").select("id", { count: "exact", head: true })
        .eq("school_id", schoolId).gte("enrolled_at", weekAgo),
    ]);
    if ((overdueRes.count ?? 0) > 0)
      items.push({ id: "fees", type: "fee", count: overdueRes.count! });
    if ((enrollRes.count ?? 0) > 0)
      items.push({ id: "enr", type: "enrollment", count: enrollRes.count! });

    // Today absences via school classes
    const { data: classes } = await sb
      .from("classes").select("id").eq("school_id", schoolId);
    if (classes?.length) {
      const { data: sessions } = await sb
        .from("attendance_sessions").select("id")
        .in("class_id", classes.map(c => c.id)).eq("date", today);
      if (sessions?.length) {
        const { count: absCount } = await sb
          .from("attendance_records").select("id", { count: "exact", head: true })
          .in("session_id", sessions.map(s => s.id)).eq("status", "absent");
        if ((absCount ?? 0) > 0)
          items.push({ id: "abs", type: "absence", count: absCount!, extra: today });
      }
    }
  }

  if (role === "teacher") {
    const { data: classes } = await sb
      .from("classes").select("id").eq("teacher_id", userId);
    if (classes?.length) {
      const { data: sessions } = await sb
        .from("attendance_sessions").select("id")
        .in("class_id", classes.map(c => c.id)).eq("date", today);
      if (!sessions?.length) {
        items.push({ id: "att", type: "info", count: 0 });
      } else {
        const { count: absCount } = await sb
          .from("attendance_records").select("id", { count: "exact", head: true })
          .in("session_id", sessions.map(s => s.id)).eq("status", "absent");
        if ((absCount ?? 0) > 0)
          items.push({ id: "abs", type: "absence", count: absCount!, extra: today });
      }
    }
  }

  if (role === "parent") {
    const { data: links } = await sb
      .from("student_parents").select("student_id").eq("parent_id", userId);
    const studentId = links?.[0]?.student_id;
    if (studentId) {
      const [feesRes, absRes] = await Promise.all([
        sb.from("fees").select("id", { count: "exact", head: true })
          .eq("student_id", studentId).in("status", ["pending", "overdue"]),
        sb.from("attendance_records")
          .select("status, session:attendance_sessions!inner(date)")
          .eq("student_id", studentId).eq("status", "absent")
          .order("attendance_sessions(date)", { ascending: false }).limit(1),
      ]);
      if ((feesRes.count ?? 0) > 0)
        items.push({ id: "fees", type: "fee", count: feesRes.count! });
      if (absRes.data?.length)
        items.push({ id: "abs", type: "absence", count: 1, extra: (absRes.data[0].session as any)?.date ?? "" });
    }
  }

  if (role === "super") {
    const { data: schools } = await sb.from("schools").select("subscription_status");
    const inactive = (schools ?? []).filter(s => s.subscription_status !== "active").length;
    if (inactive > 0) items.push({ id: "sch", type: "info", count: inactive });
  }

  return items;
}

export async function getNotificationSnapshot(userId: string) {
  const sb = await createClient();
  const { data } = await sb
    .from("notification_snapshots")
    .select("snapshot")
    .eq("user_id", userId)
    .maybeSingle();

  const snapshot = data?.snapshot;
  return Array.isArray(snapshot) ? (snapshot as string[]) : [];
}

export async function saveNotificationSnapshot(userId: string, snapshot: string[]) {
  const sb = await createClient();
  const { error } = await sb
    .from("notification_snapshots")
    .upsert({ user_id: userId, snapshot, updated_at: new Date().toISOString() });

  return { error };
}

export function getNotificationItemKey(item: NotifItem) {
  return notificationKey(item);
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
  const admin = createAdminClient();
  const [schoolsRes, studentsRes, feesRes] = await Promise.all([
    admin.from("schools").select("id, subscription_status"),
    admin.from("students").select("id", { count: "exact", head: true }),
    admin.from("fees").select("amount").eq("status", "paid"),
  ]);
  const schools = schoolsRes.data ?? [];
  return {
    totalSchools: schools.length,
    activeSchools: schools.filter(s => s.subscription_status === "active").length,
    totalStudents: studentsRes.count ?? 0,
    totalRevenue: (feesRes.data ?? []).reduce((a: number, f: any) => a + Number(f.amount), 0),
  };
}

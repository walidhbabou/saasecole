"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { getProfile } from "./dal";

const YEAR = "2025-2026";

// ── Students ───────────────────────────────────────────────────────────────
export async function addStudent(formData: {
  first_name: string; last_name: string; matricule: string;
  gender: string; birth_date: string; class_id: string;
}) {
  const sb = await createClient();
  const profile = await getProfile();
  if (!profile?.school_id) return { error: "Profil introuvable" };

  const { class_id, ...studentFields } = formData;

  const { data: student, error } = await sb
    .from("students")
    .insert({ school_id: profile.school_id, ...studentFields, birth_date: studentFields.birth_date || null })
    .select()
    .single();

  if (error) return { error: error.message };

  await sb.from("enrollments").insert({
    school_id: profile.school_id,
    student_id: student.id,
    class_id: formData.class_id,
    academic_year: YEAR,
    status: "active",
  });

  revalidatePath("/fr/(app)/admin/students");
  revalidatePath("/ar/(app)/admin/students");
  return { data: student };
}

// ── Teachers (admin) ───────────────────────────────────────────────────────
export async function createTeacher(formData: {
  first_name: string; last_name: string; email: string; password: string; phone?: string;
}) {
  const sb = await createClient();
  const profile = await getProfile();
  if (!profile?.school_id || profile.role !== "admin") return { error: "Accès refusé" };

  const admin = createAdminClient();
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
    user_metadata: { role: "teacher", first_name: formData.first_name, last_name: formData.last_name },
  });
  if (authErr || !authData.user) return { error: authErr?.message ?? "Erreur création compte" };

  const { error: profileErr } = await admin
    .from("profiles")
    .update({
      school_id: profile.school_id,
      role: "teacher",
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone || null,
    })
    .eq("id", authData.user.id);

  if (profileErr) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: profileErr.message };
  }

  revalidatePath("/fr/(app)/admin/teachers");
  revalidatePath("/ar/(app)/admin/teachers");
  return { success: true };
}

export async function updateTeacher(teacherId: string, data: {
  first_name: string; last_name: string; phone?: string;
}) {
  const sb = await createClient();
  const profile = await getProfile();
  if (profile?.role !== "admin") return { error: "Accès refusé" };

  const { error } = await sb
    .from("profiles")
    .update(data)
    .eq("id", teacherId)
    .eq("school_id", profile.school_id!)
    .eq("role", "teacher");

  if (error) return { error: error.message };
  revalidatePath("/fr/(app)/admin/teachers");
  revalidatePath("/ar/(app)/admin/teachers");
  return { success: true };
}

export async function deleteTeacher(teacherId: string) {
  const sb = await createClient();
  const profile = await getProfile();
  if (profile?.role !== "admin") return { error: "Accès refusé" };

  await sb.from("classes").update({ teacher_id: null }).eq("teacher_id", teacherId);

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(teacherId);
  if (error) return { error: error.message };

  revalidatePath("/fr/(app)/admin/teachers");
  revalidatePath("/ar/(app)/admin/teachers");
  revalidatePath("/fr/(app)/admin/classes");
  revalidatePath("/ar/(app)/admin/classes");
  return { success: true };
}

export async function assignTeacherToClass(classId: string, teacherId: string | null) {
  const sb = await createClient();
  const profile = await getProfile();
  if (profile?.role !== "admin") return { error: "Accès refusé" };

  if (teacherId) {
    await sb.from("classes").update({ teacher_id: null })
      .eq("teacher_id", teacherId)
      .eq("school_id", profile.school_id!);
  }

  const { error } = await sb.from("classes").update({ teacher_id: teacherId }).eq("id", classId);
  if (error) return { error: error.message };

  revalidatePath("/fr/(app)/admin/teachers");
  revalidatePath("/ar/(app)/admin/teachers");
  revalidatePath("/fr/(app)/admin/classes");
  revalidatePath("/ar/(app)/admin/classes");
  return { success: true };
}

export async function deleteStudent(studentId: string) {
  const sb = await createClient();
  const { error } = await sb.from("students").delete().eq("id", studentId);
  if (error) return { error: error.message };
  revalidatePath("/fr/(app)/admin/students");
  revalidatePath("/ar/(app)/admin/students");
  return { success: true };
}

// ── Classes ────────────────────────────────────────────────────────────────
export async function addClass(formData: { name: string; max_students: number }) {
  const sb = await createClient();
  const profile = await getProfile();
  if (!profile?.school_id) return { error: "Profil introuvable" };

  const { error } = await sb.from("classes").insert({
    school_id: profile.school_id,
    name: formData.name,
    max_students: formData.max_students,
    academic_year: YEAR,
  });

  if (error) return { error: error.message };
  revalidatePath("/fr/(app)/admin/classes");
  revalidatePath("/ar/(app)/admin/classes");
  return { success: true };
}

export async function deleteClass(classId: string) {
  const sb = await createClient();
  const { error } = await sb.from("classes").delete().eq("id", classId);
  if (error) return { error: error.message };
  revalidatePath("/fr/(app)/admin/classes");
  revalidatePath("/ar/(app)/admin/classes");
  return { success: true };
}

// ── Attendance ─────────────────────────────────────────────────────────────
export async function saveAttendance(
  classId: string,
  date: string,
  period: string,
  records: Record<string, string>
) {
  const sb = await createClient();
  const profile = await getProfile();

  const { data: session, error: sessErr } = await sb
    .from("attendance_sessions")
    .upsert(
      { class_id: classId, date, period, teacher_id: profile?.id ?? null },
      { onConflict: "class_id,date,period" }
    )
    .select("id")
    .single();

  if (sessErr || !session) return { error: sessErr?.message ?? "Session introuvable" };

  const rows = Object.entries(records).map(([student_id, status]) => ({
    session_id: session.id,
    student_id,
    status,
  }));

  const { error } = await sb
    .from("attendance_records")
    .upsert(rows, { onConflict: "session_id,student_id" });

  if (error) return { error: error.message };
  return { success: true };
}

// ── Fees ───────────────────────────────────────────────────────────────────
export async function markFeePaid(feeId: string) {
  const sb = await createClient();
  const { error } = await sb
    .from("fees")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", feeId);
  if (error) return { error: error.message };
  revalidatePath("/fr/(app)/admin/fees");
  revalidatePath("/ar/(app)/admin/fees");
  return { success: true };
}

// ── School settings (admin) ────────────────────────────────────────────────
export async function updateSchool(formData: {
  name: string; name_ar?: string; phone?: string; email?: string; address?: string; city?: string;
}) {
  const sb = await createClient();
  const profile = await getProfile();
  if (!profile?.school_id) return { error: "Profil introuvable" };

  const { error } = await sb
    .from("schools")
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq("id", profile.school_id);

  if (error) return { error: error.message };
  revalidatePath("/fr/(app)/admin/settings");
  revalidatePath("/ar/(app)/admin/settings");
  return { success: true };
}

export async function updateNotificationPrefs(prefs: {
  absences: boolean; fees: boolean; enrollments: boolean;
}) {
  const sb = await createClient();
  const profile = await getProfile();
  if (!profile?.school_id) return { error: "Profil introuvable" };

  const { error } = await sb
    .from("schools")
    .update({ notification_prefs: prefs, updated_at: new Date().toISOString() })
    .eq("id", profile.school_id);

  if (error) return { error: error.message };
  revalidatePath("/fr/(app)/admin/settings");
  revalidatePath("/ar/(app)/admin/settings");
  return { success: true };
}

// ── Schools (super) ────────────────────────────────────────────────────────
export async function createSchoolWithAdmin(formData: {
  name: string; name_ar?: string; city?: string; plan: string;
  adminEmail: string; adminPassword: string; adminFirstName: string; adminLastName: string;
}) {
  const sb = await createClient();
  const profile = await getProfile();
  if (profile?.role !== "super") return { error: "Accès refusé" };

  const admin = createAdminClient();

  // 1. Create school
  const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const { data: school, error: schoolErr } = await sb
    .from("schools")
    .insert({
      name: formData.name,
      name_ar: formData.name_ar || null,
      slug: `${slug}-${Date.now()}`,
      city: formData.city || null,
      plan: formData.plan,
      subscription_status: "active",
    })
    .select("id")
    .single();

  if (schoolErr || !school) return { error: schoolErr?.message ?? "Erreur création école" };

  // 2. Create auth user via service role
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: formData.adminEmail,
    password: formData.adminPassword,
    email_confirm: true,
    user_metadata: { role: "admin" },
  });

  if (authErr || !authData.user) {
    await sb.from("schools").delete().eq("id", school.id);
    return { error: authErr?.message ?? "Erreur création utilisateur" };
  }

  // 3. Update profile auto-created by the trigger with school_id and correct details
  const { error: profileErr } = await admin
    .from("profiles")
    .update({
      school_id: school.id,
      role: "admin",
      first_name: formData.adminFirstName,
      last_name: formData.adminLastName,
    })
    .eq("id", authData.user.id);

  if (profileErr) {
    await admin.auth.admin.deleteUser(authData.user.id);
    await sb.from("schools").delete().eq("id", school.id);
    return { error: profileErr.message };
  }

  revalidatePath("/fr/(app)/super/schools");
  revalidatePath("/ar/(app)/super/schools");
  revalidatePath("/fr/(app)/super/dashboard");
  revalidatePath("/ar/(app)/super/dashboard");
  return { success: true, schoolId: school.id };
}

export async function toggleSchoolStatus(schoolId: string, currentStatus: string) {
  const sb = await createClient();
  const newStatus = currentStatus === "active" ? "cancelled" : "active";
  const { error } = await sb
    .from("schools")
    .update({ subscription_status: newStatus })
    .eq("id", schoolId);
  if (error) return { error: error.message };
  revalidatePath("/fr/(app)/super/schools");
  revalidatePath("/ar/(app)/super/schools");
  return { success: true, newStatus };
}

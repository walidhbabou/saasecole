"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { getProfile } from "./dal";
import permissions from "./permissions.js";
import { ACTION_MESSAGES } from "./action-messages";
import {
  attendanceSchema,
  classCreateSchema,
  schoolCreateSchema,
  notificationPrefsSchema,
  parentCreateSchema,
  parentLinkSchema,
  parentUpdateSchema,
  schoolUpdateSchema,
  studentCreateSchema,
  studentUpdateSchema,
  teacherCreateSchema,
  teacherUpdateSchema,
  validateActionInput,
} from "./validation";
import { logAuditEvent } from "./audit";

const YEAR = "2025-2026";

type StudentCreateInput = {
  first_name: string;
  last_name: string;
  matricule: string;
  gender: string;
  birth_date: string;
  class_id: string;
};

type TeacherCreateInput = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
};

type TeacherUpdateInput = {
  first_name: string;
  last_name: string;
  phone?: string;
};

type StudentUpdateInput = {
  first_name: string;
  last_name: string;
  matricule: string;
  gender: string;
  birth_date: string;
};

type ClassCreateInput = {
  name: string;
  max_students: number;
};

function asErrorMessage(error: { message?: string } | null | undefined, fallback: string) {
  return error?.message ?? fallback;
}

const { isSchoolAdmin, isSchoolStaff } = permissions;

// ── Students ───────────────────────────────────────────────────────────────
export async function addStudent(formData: {
  first_name: string; last_name: string; matricule: string;
  gender: string; birth_date: string; class_id: string;
}) {
  const sb = await createClient();
  const profile = await getProfile();
  if (!profile?.school_id) return { error: ACTION_MESSAGES.profileMissing };

  const parsed = validateActionInput(studentCreateSchema, formData) as { data: StudentCreateInput } | { error: string };
  if ("error" in parsed) return { error: parsed.error };

  const studentData = parsed.data;

  const { class_id, ...studentFields } = studentData;

  const { data: student, error } = await sb
    .from("students")
    .insert({ school_id: profile.school_id, ...studentFields, birth_date: studentFields.birth_date || null })
    .select()
    .single();

  if (error || !student) return { error: asErrorMessage(error, "Erreur création élève") };

  const { error: enrollmentErr } = await sb.from("enrollments").insert({
    school_id: profile.school_id,
    student_id: student.id,
    class_id,
    academic_year: YEAR,
    status: "active",
  });

  if (enrollmentErr) {
    await sb.from("students").delete().eq("id", student.id);
    return { error: asErrorMessage(enrollmentErr, "Erreur création inscription") };
  }

  await logAuditEvent({
    action: "create",
    entity_type: "student",
    entity_id: student.id,
    school_id: profile.school_id,
    actor_id: profile.id,
    actor_role: profile.role,
    metadata: { class_id: studentData.class_id, matricule: student.matricule },
  });

  revalidatePath("/fr/admin/students");
  revalidatePath("/ar/admin/students");
  return { data: student };
}

// ── Teachers (admin) ───────────────────────────────────────────────────────
export async function createTeacher(formData: {
  first_name: string; last_name: string; email: string; password: string; phone?: string;
}) {
  const profile = await getProfile();
  if (!isSchoolAdmin(profile)) return { error: ACTION_MESSAGES.accessDenied };

  const parsed = validateActionInput(teacherCreateSchema, formData) as { data: TeacherCreateInput } | { error: string };
  if ("error" in parsed) return { error: parsed.error };

  const teacherData = parsed.data;

  const currentProfile = profile!;

  const admin = createAdminClient();
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: teacherData.email,
    password: teacherData.password,
    email_confirm: true,
    user_metadata: { role: "teacher", first_name: teacherData.first_name, last_name: teacherData.last_name },
  });
  if (authErr || !authData.user) return { error: asErrorMessage(authErr, ACTION_MESSAGES.createTeacherAccount) };

  const { error: profileErr } = await admin
    .from("profiles")
    .upsert({
      id: authData.user.id,
      school_id: currentProfile.school_id,
      role: "teacher",
      first_name: teacherData.first_name,
      last_name: teacherData.last_name,
      phone: teacherData.phone || null,
    });

  if (profileErr) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: asErrorMessage(profileErr, ACTION_MESSAGES.createTeacherProfile) };
  }

  await logAuditEvent({
    action: "create",
    entity_type: "teacher",
    entity_id: authData.user.id,
    school_id: currentProfile.school_id,
    actor_id: currentProfile.id,
    actor_role: currentProfile.role,
    metadata: { email: teacherData.email },
  });

  revalidatePath("/fr/admin/teachers");
  revalidatePath("/ar/admin/teachers");
  return {
    success: true,
    teacher: {
      id: authData.user.id,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      phone: parsed.data.phone || null,
      created_at: new Date().toISOString(),
      assigned_class: null as null,
    },
  };
}

export async function updateTeacher(teacherId: string, data: {
  first_name: string; last_name: string; phone?: string;
}) {
  const sb = await createClient();
  const profile = await getProfile();
  if (!isSchoolAdmin(profile)) return { error: ACTION_MESSAGES.accessDenied };

  const parsed = validateActionInput(teacherUpdateSchema, data) as { data: TeacherUpdateInput } | { error: string };
  if ("error" in parsed) return { error: parsed.error };

  const teacherData = parsed.data;
  const currentProfile = profile!;

  const { error } = await sb
    .from("profiles")
    .update({
      first_name: teacherData.first_name,
      last_name: teacherData.last_name,
      phone: teacherData.phone || null,
    })
    .eq("id", teacherId)
    .eq("school_id", currentProfile.school_id!)
    .eq("role", "teacher");

  if (error) return { error: asErrorMessage(error, ACTION_MESSAGES.updateTeacher) };

  await logAuditEvent({
    action: "update",
    entity_type: "teacher",
    entity_id: teacherId,
    school_id: currentProfile.school_id,
    actor_id: currentProfile.id,
    actor_role: currentProfile.role,
  });

  revalidatePath("/fr/admin/teachers");
  revalidatePath("/ar/admin/teachers");
  return { success: true };
}

export async function deleteTeacher(teacherId: string) {
  const sb = await createClient();
  const profile = await getProfile();
  if (!isSchoolAdmin(profile)) return { error: ACTION_MESSAGES.accessDenied };

  const currentProfile = profile!;

  const { error: detachErr } = await sb.from("classes").update({ teacher_id: null }).eq("teacher_id", teacherId).eq("school_id", currentProfile.school_id!);
  if (detachErr) return { error: asErrorMessage(detachErr, ACTION_MESSAGES.deleteTeacherDetach) };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(teacherId);
  if (error) return { error: asErrorMessage(error, ACTION_MESSAGES.deleteTeacherAccount) };

  await logAuditEvent({
    action: "delete",
    entity_type: "teacher",
    entity_id: teacherId,
    school_id: currentProfile.school_id,
    actor_id: currentProfile.id,
    actor_role: currentProfile.role,
  });

  revalidatePath("/fr/admin/teachers");
  revalidatePath("/ar/admin/teachers");
  revalidatePath("/fr/admin/classes");
  revalidatePath("/ar/admin/classes");
  return { success: true };
}

export async function assignTeacherToClass(classId: string, teacherId: string | null) {
  const sb = await createClient();
  const profile = await getProfile();
  if (!isSchoolAdmin(profile)) return { error: ACTION_MESSAGES.accessDenied };

  const currentProfile = profile!;

  if (teacherId) {
    const { error: clearErr } = await sb.from("classes").update({ teacher_id: null })
      .eq("teacher_id", teacherId)
      .eq("school_id", currentProfile.school_id!);
    if (clearErr) return { error: asErrorMessage(clearErr, ACTION_MESSAGES.assignTeacher) };
  }

  const { error } = await sb.from("classes").update({ teacher_id: teacherId }).eq("id", classId).eq("school_id", currentProfile.school_id!);
  if (error) return { error: asErrorMessage(error, ACTION_MESSAGES.assignTeacher) };

  await logAuditEvent({
    action: teacherId ? "assign" : "unassign",
    entity_type: "class",
    entity_id: classId,
    school_id: currentProfile.school_id,
    actor_id: currentProfile.id,
    actor_role: currentProfile.role,
    metadata: { teacher_id: teacherId },
  });

  revalidatePath("/fr/admin/teachers");
  revalidatePath("/ar/admin/teachers");
  revalidatePath("/fr/admin/classes");
  revalidatePath("/ar/admin/classes");
  return { success: true };
}

export async function updateStudent(studentId: string, data: {
  first_name: string; last_name: string; matricule: string; gender: string; birth_date: string;
}) {
  const sb = await createClient();
  const profile = await getProfile();
  if (!isSchoolAdmin(profile)) return { error: ACTION_MESSAGES.accessDenied };

  const parsed = validateActionInput(studentUpdateSchema, data) as { data: StudentUpdateInput } | { error: string };
  if ("error" in parsed) return { error: parsed.error };

  const studentData = parsed.data;
  const currentProfile = profile!;

  const { error } = await sb.from("students").update({
    first_name: studentData.first_name,
    last_name: studentData.last_name,
    matricule: studentData.matricule,
    gender: studentData.gender,
    birth_date: studentData.birth_date || null,
  }).eq("id", studentId).eq("school_id", currentProfile.school_id!);
  if (error) return { error: asErrorMessage(error, ACTION_MESSAGES.updateStudent) };

  await logAuditEvent({
    action: "update",
    entity_type: "student",
    entity_id: studentId,
    school_id: currentProfile.school_id,
    actor_id: currentProfile.id,
    actor_role: currentProfile.role,
  });
  revalidatePath("/fr/admin/students");
  revalidatePath("/ar/admin/students");
  return { success: true };
}

export async function deleteStudent(studentId: string) {
  const sb = await createClient();
  const profile = await getProfile();
  if (!isSchoolAdmin(profile)) return { error: ACTION_MESSAGES.accessDenied };

  const currentProfile = profile!;

  const { error } = await sb.from("students").delete().eq("id", studentId).eq("school_id", currentProfile.school_id!);
  if (error) return { error: asErrorMessage(error, ACTION_MESSAGES.deleteStudent) };

  await logAuditEvent({
    action: "delete",
    entity_type: "student",
    entity_id: studentId,
    school_id: currentProfile.school_id,
    actor_id: currentProfile.id,
    actor_role: currentProfile.role,
  });
  revalidatePath("/fr/admin/students");
  revalidatePath("/ar/admin/students");
  return { success: true };
}

// ── Classes ────────────────────────────────────────────────────────────────
export async function addClass(formData: { name: string; max_students: number }) {
  const sb = await createClient();
  const profile = await getProfile();
  if (!profile?.school_id) return { error: ACTION_MESSAGES.profileMissing };

  const parsed = validateActionInput(classCreateSchema, formData) as { data: ClassCreateInput } | { error: string };
  if ("error" in parsed) return { error: parsed.error };

  const classData = parsed.data;
  const currentProfile = profile!;

  const { error } = await sb.from("classes").insert({
    school_id: currentProfile.school_id,
    name: classData.name,
    max_students: classData.max_students,
    academic_year: YEAR,
  });

  if (error) return { error: asErrorMessage(error, ACTION_MESSAGES.createClass) };

  await logAuditEvent({
    action: "create",
    entity_type: "class",
    school_id: currentProfile.school_id,
    actor_id: currentProfile.id,
    actor_role: currentProfile.role,
    metadata: { name: classData.name, max_students: classData.max_students },
  });
  revalidatePath("/fr/admin/classes");
  revalidatePath("/ar/admin/classes");
  return { success: true };
}

export async function deleteClass(classId: string) {
  const sb = await createClient();
  const profile = await getProfile();
  if (!isSchoolAdmin(profile)) return { error: ACTION_MESSAGES.accessDenied };
  const currentProfile = profile!;

  const { error } = await sb.from("classes").delete().eq("id", classId).eq("school_id", currentProfile.school_id!);
  if (error) return { error: asErrorMessage(error, ACTION_MESSAGES.deleteClass) };

  await logAuditEvent({
    action: "delete",
    entity_type: "class",
    entity_id: classId,
    school_id: currentProfile.school_id,
    actor_id: currentProfile.id,
    actor_role: currentProfile.role,
  });
  revalidatePath("/fr/admin/classes");
  revalidatePath("/ar/admin/classes");
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
  if (!isSchoolStaff(profile)) return { error: ACTION_MESSAGES.accessDenied };

  const parsed = validateActionInput(attendanceSchema, { classId, date, period, records });
  if ("error" in parsed) return { error: parsed.error };

  const { data: session, error: sessErr } = await sb
    .from("attendance_sessions")
    .upsert(
      { class_id: parsed.data.classId, date: parsed.data.date, period: parsed.data.period, teacher_id: profile?.id ?? null },
      { onConflict: "class_id,date,period" }
    )
    .select("id")
    .single();

  if (sessErr || !session) return { error: asErrorMessage(sessErr, ACTION_MESSAGES.attendanceSession) };

  const rows = Object.entries(parsed.data.records).map(([student_id, status]) => ({
    session_id: session.id,
    student_id,
    status,
  }));

  const { error } = await sb
    .from("attendance_records")
    .upsert(rows, { onConflict: "session_id,student_id" });

  if (error) return { error: asErrorMessage(error, ACTION_MESSAGES.saveAttendance) };

  await logAuditEvent({
    action: "upsert",
    entity_type: "attendance",
    entity_id: session.id,
    school_id: profile?.school_id,
    actor_id: profile?.id,
    actor_role: profile?.role,
    metadata: { class_id: parsed.data.classId, date: parsed.data.date, period: parsed.data.period },
  });

  revalidatePath("/fr/admin/attendance");
  revalidatePath("/ar/admin/attendance");
  revalidatePath("/fr/teacher/attendance");
  revalidatePath("/ar/teacher/attendance");

  return { success: true };
}

// ── Fees ───────────────────────────────────────────────────────────────────
export async function markFeePaid(feeId: string) {
  const sb = await createClient();
  const profile = await getProfile();
  if (!isSchoolAdmin(profile)) return { error: ACTION_MESSAGES.accessDenied };
  const currentProfile = profile!;

  const { error } = await sb
    .from("fees")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", feeId)
    .eq("school_id", currentProfile.school_id!);
  if (error) return { error: asErrorMessage(error, ACTION_MESSAGES.markFeePaid) };

  await logAuditEvent({
    action: "update",
    entity_type: "fee",
    entity_id: feeId,
    school_id: currentProfile.school_id,
    actor_id: currentProfile.id,
    actor_role: currentProfile.role,
    metadata: { status: "paid" },
  });
  revalidatePath("/fr/admin/fees");
  revalidatePath("/ar/admin/fees");
  return { success: true };
}

// ── School settings (admin) ────────────────────────────────────────────────
export async function updateSchool(formData: {
  name: string; name_ar?: string; phone?: string; email?: string; address?: string; city?: string;
}) {
  const sb = await createClient();
  const profile = await getProfile();
  if (!isSchoolAdmin(profile)) return { error: ACTION_MESSAGES.accessDenied };
  const currentProfile = profile!;

  const parsed = validateActionInput(schoolUpdateSchema, formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await sb
    .from("schools")
    .update({
      name: parsed.data.name,
      name_ar: parsed.data.name_ar || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      city: parsed.data.city || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", currentProfile.school_id);

  if (error) return { error: asErrorMessage(error, ACTION_MESSAGES.updateSchool) };

  await logAuditEvent({
    action: "update",
    entity_type: "school",
    entity_id: currentProfile.school_id,
    school_id: currentProfile.school_id,
    actor_id: currentProfile.id,
    actor_role: currentProfile.role,
  });
  revalidatePath("/fr/admin/settings");
  revalidatePath("/ar/admin/settings");
  return { success: true };
}

export async function updateNotificationPrefs(prefs: {
  absences: boolean; fees: boolean; enrollments: boolean;
}) {
  const sb = await createClient();
  const profile = await getProfile();
  if (!isSchoolAdmin(profile)) return { error: ACTION_MESSAGES.accessDenied };
  const currentProfile = profile!;

  const parsed = validateActionInput(notificationPrefsSchema, prefs);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await sb
    .from("schools")
    .update({ notification_prefs: parsed.data, updated_at: new Date().toISOString() })
    .eq("id", currentProfile.school_id);

  if (error) return { error: asErrorMessage(error, ACTION_MESSAGES.updateNotifications) };

  await logAuditEvent({
    action: "update",
    entity_type: "notification_prefs",
    entity_id: currentProfile.school_id,
    school_id: currentProfile.school_id,
    actor_id: currentProfile.id,
    actor_role: currentProfile.role,
    metadata: parsed.data,
  });
  revalidatePath("/fr/admin/settings");
  revalidatePath("/ar/admin/settings");
  return { success: true };
}

// ── Schools (super) ────────────────────────────────────────────────────────
export async function createSchoolWithAdmin(formData: {
  name: string; name_ar?: string; city?: string; plan: string;
  adminEmail: string; adminPassword: string; adminFirstName: string; adminLastName: string;
}) {
  const sb = await createClient();
  const profile = await getProfile();
  if (profile?.role !== "super") return { error: ACTION_MESSAGES.accessDenied };
  const currentProfile = profile!;

  const parsed = validateActionInput(schoolCreateSchema, formData);
  if ("error" in parsed) return { error: parsed.error };

  const admin = createAdminClient();

  // 1. Create school
  const slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const { data: school, error: schoolErr } = await sb
    .from("schools")
    .insert({
      name: parsed.data.name,
      name_ar: parsed.data.name_ar || null,
      slug: `${slug}-${Date.now()}`,
      city: parsed.data.city || null,
      plan: parsed.data.plan,
      subscription_status: "active",
    })
    .select("id")
    .single();

  if (schoolErr || !school) return { error: asErrorMessage(schoolErr, ACTION_MESSAGES.createSchool) };

  // 2. Create auth user via service role
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: parsed.data.adminEmail,
    password: parsed.data.adminPassword,
    email_confirm: true,
    user_metadata: { role: "admin" },
  });

  if (authErr || !authData.user) {
    await sb.from("schools").delete().eq("id", school.id);
    return { error: asErrorMessage(authErr, ACTION_MESSAGES.createSchoolUser) };
  }

  // 3. Upsert profile (trigger may not have run yet when Admin API creates user)
  const { error: profileErr } = await admin
    .from("profiles")
    .upsert({
      id: authData.user.id,
      school_id: school.id,
      role: "admin",
      first_name: parsed.data.adminFirstName,
      last_name: parsed.data.adminLastName,
    });

  if (profileErr) {
    await admin.auth.admin.deleteUser(authData.user.id);
    await sb.from("schools").delete().eq("id", school.id);
    return { error: asErrorMessage(profileErr, ACTION_MESSAGES.createSchoolProfile) };
  }

  await logAuditEvent({
    action: "create",
    entity_type: "school",
    entity_id: school.id,
    school_id: school.id,
    actor_id: currentProfile.id,
    actor_role: currentProfile.role,
    metadata: { plan: parsed.data.plan },
  });

  revalidatePath("/fr/super/schools");
  revalidatePath("/ar/super/schools");
  revalidatePath("/fr/super/dashboard");
  revalidatePath("/ar/super/dashboard");
  return { success: true, schoolId: school.id };
}

// ── Parents (admin) ───────────────────────────────────────────────────────
export async function createParent(formData: {
  first_name: string; last_name: string; email: string; password: string;
  phone?: string; student_id?: string;
}) {
  const profile = await getProfile();
  if (!isSchoolAdmin(profile)) return { error: ACTION_MESSAGES.accessDenied };
  const currentProfile = profile!;

  const parsed = validateActionInput(parentCreateSchema, formData);
  if ("error" in parsed) return { error: parsed.error };

  const admin = createAdminClient();
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { role: "parent", first_name: parsed.data.first_name, last_name: parsed.data.last_name },
  });
  if (authErr || !authData.user) return { error: asErrorMessage(authErr, ACTION_MESSAGES.createParentAccount) };

  const { error: profileErr } = await admin.from("profiles").upsert({
    id: authData.user.id,
    school_id: currentProfile.school_id,
    role: "parent",
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    phone: parsed.data.phone || null,
  });

  if (profileErr) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: asErrorMessage(profileErr, ACTION_MESSAGES.createParentProfile) };
  }

  let student: { id: string; first_name: string; last_name: string; matricule: string } | null = null;
  if (parsed.data.student_id) {
    const { data: s } = await admin
      .from("students")
      .select("id, first_name, last_name, matricule")
      .eq("id", parsed.data.student_id)
      .single();
    const { error: linkErr } = await admin.from("student_parents").insert({
      parent_id: authData.user.id,
      student_id: parsed.data.student_id,
      relation: "parent",
      is_primary: true,
    });
    if (linkErr) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return { error: asErrorMessage(linkErr, ACTION_MESSAGES.linkParentStudent) };
    }
    student = s ?? null;
  }

  await logAuditEvent({
    action: "create",
    entity_type: "parent",
    entity_id: authData.user.id,
    school_id: currentProfile.school_id,
    actor_id: currentProfile.id,
    actor_role: currentProfile.role,
    metadata: { linked_student_id: parsed.data.student_id || null },
  });

  revalidatePath("/fr/admin/parents");
  revalidatePath("/ar/admin/parents");
  return {
    success: true,
    parent: {
      id: authData.user.id,
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone || null,
      created_at: new Date().toISOString(),
      student,
    },
  };
}

export async function updateParent(parentId: string, data: {
  first_name: string; last_name: string; phone?: string;
}) {
  const profile = await getProfile();
  if (!isSchoolAdmin(profile)) return { error: ACTION_MESSAGES.accessDenied };
  const currentProfile = profile!;

  const parsed = validateActionInput(parentUpdateSchema, data);
  if ("error" in parsed) return { error: parsed.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ first_name: parsed.data.first_name, last_name: parsed.data.last_name, phone: parsed.data.phone || null })
    .eq("id", parentId)
    .eq("school_id", currentProfile.school_id!);

  if (error) return { error: asErrorMessage(error, ACTION_MESSAGES.updateParent) };

  await logAuditEvent({
    action: "update",
    entity_type: "parent",
    entity_id: parentId,
    school_id: currentProfile.school_id,
    actor_id: currentProfile.id,
    actor_role: currentProfile.role,
  });
  revalidatePath("/fr/admin/parents");
  revalidatePath("/ar/admin/parents");
  return { success: true };
}

export async function deleteParent(parentId: string) {
  const profile = await getProfile();
  if (!isSchoolAdmin(profile)) return { error: ACTION_MESSAGES.accessDenied };
  const currentProfile = profile!;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(parentId);
  if (error) return { error: asErrorMessage(error, ACTION_MESSAGES.deleteParent) };

  await logAuditEvent({
    action: "delete",
    entity_type: "parent",
    entity_id: parentId,
    school_id: currentProfile.school_id,
    actor_id: currentProfile.id,
    actor_role: currentProfile.role,
  });

  revalidatePath("/fr/admin/parents");
  revalidatePath("/ar/admin/parents");
  return { success: true };
}

export async function linkParentToStudent(parentId: string, studentId: string | null) {
  const profile = await getProfile();
  if (!isSchoolAdmin(profile)) return { error: ACTION_MESSAGES.accessDenied };
  const currentProfile = profile!;

  const parsed = validateActionInput(parentLinkSchema, { parentId, studentId });
  if ("error" in parsed) return { error: parsed.error };

  const admin = createAdminClient();
  const { error: unlinkErr } = await admin.from("student_parents").delete().eq("parent_id", parentId);
  if (unlinkErr) return { error: asErrorMessage(unlinkErr, ACTION_MESSAGES.linkParentStudent) };

  if (parsed.data.studentId) {
    const { error } = await admin.from("student_parents").insert({
      parent_id: parentId,
      student_id: parsed.data.studentId,
      relation: "parent",
      is_primary: true,
    });
    if (error) return { error: asErrorMessage(error, ACTION_MESSAGES.linkParentStudent) };
  }

  await logAuditEvent({
    action: "update",
    entity_type: "parent_student_link",
    entity_id: parentId,
    school_id: currentProfile.school_id,
    actor_id: currentProfile.id,
    actor_role: currentProfile.role,
    metadata: { student_id: parsed.data.studentId || null },
  });

  revalidatePath("/fr/admin/parents");
  revalidatePath("/ar/admin/parents");
  return { success: true };
}

// ── Profile ────────────────────────────────────────────────────────────────
export async function updateProfile(data: {
  first_name: string; last_name: string; phone?: string;
}) {
  const sb = await createClient();
  const profile = await getProfile();
  if (!profile) return { error: ACTION_MESSAGES.unauthenticated };

  const { error } = await sb
    .from("profiles")
    .update({ first_name: data.first_name, last_name: data.last_name, phone: data.phone || null })
    .eq("id", profile.id);

  if (error) return { error: asErrorMessage(error, ACTION_MESSAGES.updateProfile) };
  return { success: true };
}

// ── Notifications ──────────────────────────────────────────────────────────
export async function fetchNotifications() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];

  const { data: profile } = await sb
    .from("profiles")
    .select("id, role, school_id")
    .eq("id", user.id)
    .single();
  if (!profile) return [];

  const { getNotificationsData, getNotificationSnapshot } = await import("./dal");
  const [items, snapshot] = await Promise.all([
    getNotificationsData(profile.role, profile.school_id, profile.id),
    getNotificationSnapshot(profile.id),
  ]);
  const seen = new Set(snapshot);
  return items.filter((item) => !seen.has(`${item.id}:${item.type}:${item.count}:${item.extra ?? ""}`));
}

export async function markNotificationsAsRead() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: ACTION_MESSAGES.unauthenticated };

  const { data: profile } = await sb
    .from("profiles")
    .select("id, role, school_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: ACTION_MESSAGES.unauthenticated };

  const { getNotificationsData, saveNotificationSnapshot, getNotificationItemKey } = await import("./dal");
  const items = await getNotificationsData(profile.role, profile.school_id, profile.id);
  const snapshot = items.map(getNotificationItemKey);
  const { error } = await saveNotificationSnapshot(profile.id, snapshot);
  if (error) return { error: asErrorMessage(error, "Erreur sauvegarde notifications") };

  return { success: true };
}

export async function toggleSchoolStatus(schoolId: string, currentStatus: string) {
  const sb = await createClient();
  const profile = await getProfile();
  if (profile?.role !== "super") return { error: ACTION_MESSAGES.accessDenied };
  const newStatus = currentStatus === "active" ? "cancelled" : "active";
  const { error } = await sb
    .from("schools")
    .update({ subscription_status: newStatus })
    .eq("id", schoolId);
  if (error) return { error: asErrorMessage(error, ACTION_MESSAGES.toggleSchoolStatus) };

  await logAuditEvent({
    action: "update",
    entity_type: "school_status",
    entity_id: schoolId,
    school_id: schoolId,
    actor_id: profile.id,
    actor_role: profile.role,
    metadata: { status: newStatus },
  });
  revalidatePath("/fr/super/schools");
  revalidatePath("/ar/super/schools");
  return { success: true, newStatus };
}

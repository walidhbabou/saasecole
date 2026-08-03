import { z } from "zod";

const nameSchema = z.string().trim().min(1, "Ce champ est requis");

export const studentCreateSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  matricule: nameSchema,
  gender: z.enum(["M", "F"]),
  birth_date: z.string().optional().default(""),
  class_id: nameSchema,
});

export const studentUpdateSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  matricule: nameSchema,
  gender: z.enum(["M", "F"]),
  birth_date: z.string().optional().default(""),
});

export const teacherCreateSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  phone: z.string().trim().optional().default(""),
});

export const teacherUpdateSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  phone: z.string().trim().optional().default(""),
});

export const classCreateSchema = z.object({
  name: nameSchema,
  max_students: z.number().int().positive().max(100),
});

export const schoolUpdateSchema = z.object({
  name: nameSchema,
  name_ar: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
  email: z.string().trim().email("Email invalide").optional().or(z.literal("")),
  address: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default(""),
});

export const schoolCreateSchema = z.object({
  name: nameSchema,
  name_ar: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default(""),
  plan: z.enum(["free", "basic", "pro", "enterprise"]),
  adminEmail: z.string().trim().email("Email invalide"),
  adminPassword: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  adminFirstName: nameSchema,
  adminLastName: nameSchema,
});

export const notificationPrefsSchema = z.object({
  absences: z.boolean(),
  fees: z.boolean(),
  enrollments: z.boolean(),
});

export const attendanceSchema = z.object({
  classId: nameSchema,
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
  period: z.enum(["morning", "afternoon"]),
  records: z.record(z.string().trim().min(1), z.enum(["present", "absent", "late", "excused"])),
});

export const parentCreateSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  phone: z.string().trim().optional().default(""),
  student_id: z.string().trim().optional().default(""),
});

export const parentUpdateSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  phone: z.string().trim().optional().default(""),
});

export const parentLinkSchema = z.object({
  parentId: nameSchema,
  studentId: z.string().trim().nullable(),
});

export function validateActionInput(schema: z.ZodTypeAny, input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  return { data: parsed.data };
}
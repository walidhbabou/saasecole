export type Locale = "fr" | "ar" | "en";
export type Role = "super" | "admin" | "teacher" | "parent";
export type Gender = "M" | "F";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type FeeStatus = "pending" | "paid" | "overdue" | "cancelled";
export type EnrollmentStatus = "active" | "transferred" | "withdrawn";
export type SchoolPlan = "free" | "basic" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "cancelled";
export type Period = "morning" | "afternoon";

export interface School {
  id: string;
  name: string;
  name_ar?: string;
  slug: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country: string;
  plan: SchoolPlan;
  subscription_status: SubscriptionStatus;
  subscription_end_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  school_id?: string;
  role: Role;
  first_name: string;
  last_name: string;
  first_name_ar?: string;
  last_name_ar?: string;
  phone?: string;
  avatar_url?: string;
  email?: string;
  created_at: string;
}

export interface Level {
  id: string;
  school_id: string;
  name: string;
  name_ar?: string;
  order_index: number;
}

export interface Class {
  id: string;
  school_id: string;
  level_id?: string;
  name: string;
  name_ar?: string;
  teacher_id?: string;
  teacher?: Profile;
  level?: Level;
  academic_year: string;
  max_students: number;
  students_count?: number;
  created_at?: string;
}

export interface Student {
  id: string;
  school_id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  first_name_ar?: string;
  last_name_ar?: string;
  birth_date?: string;
  gender?: Gender;
  photo_url?: string;
  address?: string;
  class?: Class;
  parent?: Profile;
  created_at: string;
}

export interface Enrollment {
  id: string;
  school_id: string;
  student_id: string;
  student?: Student;
  class_id: string;
  class?: Class;
  academic_year: string;
  enrolled_at: string;
  status: EnrollmentStatus;
}

export interface AttendanceSession {
  id: string;
  class_id: string;
  class?: Class;
  teacher_id?: string;
  date: string;
  period: Period;
  records?: AttendanceRecord[];
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  student?: Student;
  status: AttendanceStatus;
  note?: string;
}

export interface FeeType {
  id: string;
  school_id: string;
  name: string;
  name_ar?: string;
  amount: number;
  frequency: "monthly" | "quarterly" | "annual" | "one-time";
}

export interface Fee {
  id: string;
  school_id: string;
  student_id: string;
  student?: Student;
  fee_type_id?: string;
  fee_type?: FeeType;
  amount: number;
  due_date?: string;
  paid_at?: string;
  status: FeeStatus;
  academic_year: string;
  created_at: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  monthlyRevenue: number;
  attendanceRate: number;
  pendingFees: number;
  newStudentsThisMonth: number;
}

export interface SuperDashboardStats {
  totalSchools: number;
  activeSchools: number;
  totalStudents: number;
  monthlyRevenue: number;
  growth: number;
}

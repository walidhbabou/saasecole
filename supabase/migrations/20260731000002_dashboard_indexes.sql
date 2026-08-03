-- Performance indexes for dashboard and CRUD-heavy queries

CREATE INDEX IF NOT EXISTS idx_profiles_school_role ON profiles (school_id, role);
CREATE INDEX IF NOT EXISTS idx_classes_school_year ON classes (school_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_students_school ON students (school_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_school_year_status_date ON enrollments (school_id, academic_year, status, enrolled_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_status ON enrollments (class_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_date_period ON attendance_sessions (class_id, date, period);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_status ON attendance_records (session_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_status ON attendance_records (student_id, status);
CREATE INDEX IF NOT EXISTS idx_fees_school_year_status_due ON fees (school_id, academic_year, status, due_date DESC);
CREATE INDEX IF NOT EXISTS idx_student_parents_parent_student ON student_parents (parent_id, student_id);
CREATE INDEX IF NOT EXISTS idx_fee_types_school ON fee_types (school_id);
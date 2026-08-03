-- Madrasati — Schéma initial
-- Ordre : tables → fonctions → policies → trigger

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- ============================================================
-- 1. TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  name_ar VARCHAR,
  slug VARCHAR UNIQUE NOT NULL,
  logo_url TEXT,
  phone VARCHAR,
  email VARCHAR,
  address TEXT,
  city VARCHAR,
  country VARCHAR DEFAULT 'MA',
  plan VARCHAR DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
  subscription_status VARCHAR DEFAULT 'active' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'cancelled')),
  subscription_end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  role VARCHAR NOT NULL CHECK (role IN ('super', 'admin', 'teacher', 'parent')),
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  first_name_ar VARCHAR,
  last_name_ar VARCHAR,
  phone VARCHAR,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  name_ar VARCHAR,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  level_id UUID REFERENCES levels(id),
  name VARCHAR NOT NULL,
  name_ar VARCHAR,
  teacher_id UUID REFERENCES profiles(id),
  academic_year VARCHAR NOT NULL,
  max_students INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  matricule VARCHAR NOT NULL,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  first_name_ar VARCHAR,
  last_name_ar VARCHAR,
  birth_date DATE,
  gender VARCHAR CHECK (gender IN ('M', 'F')),
  photo_url TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, matricule)
);

CREATE TABLE IF NOT EXISTS student_parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relation VARCHAR DEFAULT 'parent',
  is_primary BOOLEAN DEFAULT true,
  UNIQUE(student_id, parent_id)
);

CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  academic_year VARCHAR NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'withdrawn')),
  UNIQUE(student_id, class_id, academic_year)
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id),
  date DATE NOT NULL,
  period VARCHAR DEFAULT 'morning' CHECK (period IN ('morning', 'afternoon')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, date, period)
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  note TEXT,
  UNIQUE(session_id, student_id)
);

CREATE TABLE IF NOT EXISTS fee_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  name_ar VARCHAR,
  amount DECIMAL(10,2) NOT NULL,
  frequency VARCHAR DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly', 'annual', 'one-time')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_type_id UUID REFERENCES fee_types(id),
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  academic_year VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. ENABLE RLS

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role VARCHAR,
  action VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins view all audit logs" ON audit_logs
  FOR SELECT USING (get_user_role() = 'super');

CREATE POLICY "School admins view own audit logs" ON audit_logs
  FOR SELECT USING (school_id = get_user_school_id() AND get_user_role() = 'admin');
-- ============================================================
ALTER TABLE schools            ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels             ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE students           ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_parents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_types          ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees               ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. HELPER FUNCTIONS (profiles existe maintenant)
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_school_id()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT school_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS VARCHAR LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================

-- Schools
CREATE POLICY "School members see own school" ON schools
  FOR SELECT USING (id = get_user_school_id() OR get_user_role() = 'super');

CREATE POLICY "Admins update own school" ON schools
  FOR UPDATE USING (id = get_user_school_id() AND get_user_role() = 'admin');

CREATE POLICY "Super admins manage schools" ON schools
  FOR ALL USING (get_user_role() = 'super') WITH CHECK (get_user_role() = 'super');

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "School members view school profiles" ON profiles FOR SELECT USING (
  school_id IS NOT NULL AND school_id = get_user_school_id()
);
CREATE POLICY "Super admin views all profiles" ON profiles FOR SELECT USING (get_user_role() = 'super');

-- Levels
CREATE POLICY "School members see levels" ON levels FOR SELECT USING (school_id = get_user_school_id());

-- Classes
CREATE POLICY "School members see classes" ON classes FOR SELECT USING (school_id = get_user_school_id());
CREATE POLICY "Admin manages classes" ON classes FOR ALL USING (school_id = get_user_school_id() AND get_user_role() = 'admin');

-- Students
CREATE POLICY "Admin sees school students" ON students FOR SELECT USING (school_id = get_user_school_id() AND get_user_role() IN ('admin', 'teacher'));
CREATE POLICY "Parent sees own children" ON students FOR SELECT USING (id IN (SELECT student_id FROM student_parents WHERE parent_id = auth.uid()));
CREATE POLICY "Admin manages students" ON students FOR ALL USING (school_id = get_user_school_id() AND get_user_role() = 'admin');

-- Student parents
CREATE POLICY "Parent sees own links" ON student_parents FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "Admin manages school student_parents" ON student_parents FOR ALL USING (
  student_id IN (SELECT id FROM students WHERE school_id = get_user_school_id())
  AND get_user_role() = 'admin'
);

-- Enrollments
CREATE POLICY "School members see enrollments" ON enrollments FOR SELECT USING (school_id = get_user_school_id());
CREATE POLICY "Admin manages enrollments" ON enrollments FOR ALL USING (school_id = get_user_school_id() AND get_user_role() = 'admin');

-- Fee types
CREATE POLICY "School members see fee types" ON fee_types FOR SELECT USING (school_id = get_user_school_id());
CREATE POLICY "Admin manages fee types" ON fee_types FOR ALL USING (school_id = get_user_school_id() AND get_user_role() = 'admin');

-- Attendance sessions
CREATE POLICY "School members see attendance sessions" ON attendance_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM classes WHERE classes.id = attendance_sessions.class_id AND classes.school_id = get_user_school_id())
);
CREATE POLICY "Admins manage attendance sessions" ON attendance_sessions FOR ALL USING (
  get_user_role() = 'admin'
  AND EXISTS (SELECT 1 FROM classes WHERE classes.id = attendance_sessions.class_id AND classes.school_id = get_user_school_id())
) WITH CHECK (
  get_user_role() = 'admin'
  AND EXISTS (SELECT 1 FROM classes WHERE classes.id = attendance_sessions.class_id AND classes.school_id = get_user_school_id())
);
CREATE POLICY "Teachers manage own attendance sessions" ON attendance_sessions FOR ALL USING (
  get_user_role() = 'teacher'
  AND teacher_id = auth.uid()
  AND EXISTS (SELECT 1 FROM classes WHERE classes.id = attendance_sessions.class_id AND classes.school_id = get_user_school_id())
) WITH CHECK (
  get_user_role() = 'teacher'
  AND teacher_id = auth.uid()
  AND EXISTS (SELECT 1 FROM classes WHERE classes.id = attendance_sessions.class_id AND classes.school_id = get_user_school_id())
);

-- Attendance records
CREATE POLICY "School members see attendance records" ON attendance_records FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM attendance_sessions s
    JOIN classes c ON c.id = s.class_id
    WHERE s.id = attendance_records.session_id
      AND c.school_id = get_user_school_id()
  )
  OR student_id IN (SELECT student_id FROM student_parents WHERE parent_id = auth.uid())
);
CREATE POLICY "Admins manage attendance records" ON attendance_records FOR ALL USING (
  get_user_role() = 'admin'
  AND EXISTS (
    SELECT 1
    FROM attendance_sessions s
    JOIN classes c ON c.id = s.class_id
    WHERE s.id = attendance_records.session_id
      AND c.school_id = get_user_school_id()
  )
) WITH CHECK (
  get_user_role() = 'admin'
  AND EXISTS (
    SELECT 1
    FROM attendance_sessions s
    JOIN classes c ON c.id = s.class_id
    WHERE s.id = attendance_records.session_id
      AND c.school_id = get_user_school_id()
  )
);
CREATE POLICY "Teachers manage own attendance records" ON attendance_records FOR ALL USING (
  get_user_role() = 'teacher'
  AND EXISTS (
    SELECT 1
    FROM attendance_sessions s
    JOIN classes c ON c.id = s.class_id
    WHERE s.id = attendance_records.session_id
      AND s.teacher_id = auth.uid()
      AND c.school_id = get_user_school_id()
  )
) WITH CHECK (
  get_user_role() = 'teacher'
  AND EXISTS (
    SELECT 1
    FROM attendance_sessions s
    JOIN classes c ON c.id = s.class_id
    WHERE s.id = attendance_records.session_id
      AND s.teacher_id = auth.uid()
      AND c.school_id = get_user_school_id()
  )
);

-- Fees
CREATE POLICY "Admin sees school fees" ON fees FOR SELECT USING (school_id = get_user_school_id() AND get_user_role() = 'admin');
CREATE POLICY "Parent sees own fees" ON fees FOR SELECT USING (student_id IN (SELECT student_id FROM student_parents WHERE parent_id = auth.uid()));
CREATE POLICY "Admin manages fees" ON fees FOR ALL USING (school_id = get_user_school_id() AND get_user_role() = 'admin');

-- ============================================================
-- 5. TRIGGER: Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS and CRUD fixes for school operations

DROP POLICY IF EXISTS "School members see own school" ON schools;
DROP POLICY IF EXISTS "Admins update own school" ON schools;
DROP POLICY IF EXISTS "Super admins manage schools" ON schools;
CREATE POLICY "School members see own school" ON schools
  FOR SELECT USING (id = get_user_school_id() OR get_user_role() = 'super');
CREATE POLICY "Admins update own school" ON schools
  FOR UPDATE USING (id = get_user_school_id() AND get_user_role() = 'admin');
CREATE POLICY "Super admins manage schools" ON schools
  FOR ALL USING (get_user_role() = 'super') WITH CHECK (get_user_role() = 'super');

DROP POLICY IF EXISTS "School members view school profiles" ON profiles;
DROP POLICY IF EXISTS "Super admin views all profiles" ON profiles;
CREATE POLICY "School members view school profiles" ON profiles
  FOR SELECT USING (school_id IS NOT NULL AND school_id = get_user_school_id());
CREATE POLICY "Super admin views all profiles" ON profiles
  FOR SELECT USING (get_user_role() = 'super');

DROP POLICY IF EXISTS "School members see fee types" ON fee_types;
DROP POLICY IF EXISTS "Admin manages fee types" ON fee_types;
CREATE POLICY "School members see fee types" ON fee_types
  FOR SELECT USING (school_id = get_user_school_id());
CREATE POLICY "Admin manages fee types" ON fee_types
  FOR ALL USING (school_id = get_user_school_id() AND get_user_role() = 'admin');

DROP POLICY IF EXISTS "Parent sees own links" ON student_parents;
DROP POLICY IF EXISTS "Admin manages school student_parents" ON student_parents;
CREATE POLICY "Parent sees own links" ON student_parents
  FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "Admin manages school student_parents" ON student_parents
  FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE school_id = get_user_school_id())
    AND get_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "School members see enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admin manages enrollments" ON enrollments;
CREATE POLICY "School members see enrollments" ON enrollments
  FOR SELECT USING (school_id = get_user_school_id());
CREATE POLICY "Admin manages enrollments" ON enrollments
  FOR ALL USING (school_id = get_user_school_id() AND get_user_role() = 'admin');

DROP POLICY IF EXISTS "School members see attendance sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "Admins manage attendance sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "Teachers manage own attendance sessions" ON attendance_sessions;
CREATE POLICY "School members see attendance sessions" ON attendance_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM classes WHERE classes.id = attendance_sessions.class_id AND classes.school_id = get_user_school_id())
  );
CREATE POLICY "Admins manage attendance sessions" ON attendance_sessions
  FOR ALL USING (
    get_user_role() = 'admin'
    AND EXISTS (SELECT 1 FROM classes WHERE classes.id = attendance_sessions.class_id AND classes.school_id = get_user_school_id())
  ) WITH CHECK (
    get_user_role() = 'admin'
    AND EXISTS (SELECT 1 FROM classes WHERE classes.id = attendance_sessions.class_id AND classes.school_id = get_user_school_id())
  );
CREATE POLICY "Teachers manage own attendance sessions" ON attendance_sessions
  FOR ALL USING (
    get_user_role() = 'teacher'
    AND teacher_id = auth.uid()
    AND EXISTS (SELECT 1 FROM classes WHERE classes.id = attendance_sessions.class_id AND classes.school_id = get_user_school_id())
  ) WITH CHECK (
    get_user_role() = 'teacher'
    AND teacher_id = auth.uid()
    AND EXISTS (SELECT 1 FROM classes WHERE classes.id = attendance_sessions.class_id AND classes.school_id = get_user_school_id())
  );

DROP POLICY IF EXISTS "School members see attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Admins manage attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Teachers manage own attendance records" ON attendance_records;
CREATE POLICY "School members see attendance records" ON attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM attendance_sessions s
      JOIN classes c ON c.id = s.class_id
      WHERE s.id = attendance_records.session_id
        AND c.school_id = get_user_school_id()
    )
    OR student_id IN (SELECT student_id FROM student_parents WHERE parent_id = auth.uid())
  );
CREATE POLICY "Admins manage attendance records" ON attendance_records
  FOR ALL USING (
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
CREATE POLICY "Teachers manage own attendance records" ON attendance_records
  FOR ALL USING (
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

DROP POLICY IF EXISTS "Admin sees school fees" ON fees;
DROP POLICY IF EXISTS "Parent sees own fees" ON fees;
DROP POLICY IF EXISTS "Admin manages fees" ON fees;
CREATE POLICY "Admin sees school fees" ON fees FOR SELECT USING (school_id = get_user_school_id() AND get_user_role() = 'admin');
CREATE POLICY "Parent sees own fees" ON fees FOR SELECT USING (student_id IN (SELECT student_id FROM student_parents WHERE parent_id = auth.uid()));
CREATE POLICY "Admin manages fees" ON fees FOR ALL USING (school_id = get_user_school_id() AND get_user_role() = 'admin');
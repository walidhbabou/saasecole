-- Fix RLS policies on profiles table
-- Previously: users could only see their own profile
-- Now: school members can see all profiles in their school

-- Drop old restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Users can view their own profile (kept for self-access)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- School members (admin, teacher, parent) can view all profiles in their school
CREATE POLICY "School members view school profiles"
  ON profiles FOR SELECT
  USING (
    school_id IS NOT NULL
    AND school_id = get_user_school_id()
  );

-- Super admin can view all profiles
CREATE POLICY "Super admin views all profiles"
  ON profiles FOR SELECT
  USING (get_user_role() = 'super');

-- Allow INSERT for new profile creation (needed for upsert via service role)
-- Service role bypasses RLS, but add this for completeness
CREATE POLICY "Admin can insert profiles in school"
  ON profiles FOR INSERT
  WITH CHECK (
    school_id = get_user_school_id()
    AND get_user_role() = 'admin'
  );

-- Fix student_parents RLS: admin must be able to manage parent-student links
CREATE POLICY "Admin manages school student_parents"
  ON student_parents FOR ALL
  USING (
    student_id IN (
      SELECT id FROM students WHERE school_id = get_user_school_id()
    )
    AND get_user_role() = 'admin'
  );

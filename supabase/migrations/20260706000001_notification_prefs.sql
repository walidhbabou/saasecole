-- Add notification preferences column to schools
ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB
  DEFAULT '{"absences": true, "fees": true, "enrollments": false}'::jsonb;

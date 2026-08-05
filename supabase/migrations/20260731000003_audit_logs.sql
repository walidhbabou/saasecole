-- Audit log support

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

DROP POLICY IF EXISTS "Super admins view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "School admins view own audit logs" ON audit_logs;
CREATE POLICY "Super admins view all audit logs" ON audit_logs
  FOR SELECT USING (get_user_role() = 'super');
CREATE POLICY "School admins view own audit logs" ON audit_logs
  FOR SELECT USING (school_id = get_user_school_id() AND get_user_role() = 'admin');

CREATE INDEX IF NOT EXISTS idx_audit_logs_school_created ON audit_logs (school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);

-- Notification snapshots for "mark as read" state
CREATE TABLE IF NOT EXISTS notification_snapshots (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notification snapshots" ON notification_snapshots;
CREATE POLICY "Users manage own notification snapshots" ON notification_snapshots
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Table for Immutable Audit Logs (Medical Service V2)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_discord_id TEXT NOT NULL,
    actor_name TEXT,
    action TEXT NOT NULL,          -- e.g. "DUTY_EDIT", "LEAVE_APPROVE", "SALARY_FINALIZE", "ROLE_CHANGE", "USER_DELETE"
    target_type TEXT NOT NULL,     -- e.g. "duty_log", "leave_request", "user", "salary"
    target_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient querying by date and actor
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_discord_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated admins only
CREATE POLICY "Admins can view audit logs" 
ON audit_logs FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.discord_id = auth.uid()::text 
    AND users.role IN ('admin', 'director', 'deputy_director')
  )
);

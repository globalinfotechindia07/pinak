-- ============================================================
-- V6: Audit Logs (security event trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id           UUID         PRIMARY KEY,
    user_id      UUID         REFERENCES users(id) ON DELETE SET NULL,
    event_type   VARCHAR(50)  NOT NULL,
    ip_address   VARCHAR(45),
    user_agent   VARCHAR(512),
    request_id   VARCHAR(100),
    metadata     TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);

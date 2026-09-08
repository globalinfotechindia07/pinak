-- ============================================================
-- V3: User Sessions (device + IP tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id             UUID PRIMARY KEY,
    user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id      VARCHAR(255),
    device_name    VARCHAR(255),
    ip_address     VARCHAR(45),
    user_agent     VARCHAR(512),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at     TIMESTAMPTZ  NOT NULL,
    revoked_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_revoked_at ON user_sessions(revoked_at);

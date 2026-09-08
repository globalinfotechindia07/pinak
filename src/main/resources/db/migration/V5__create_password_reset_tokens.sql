-- ============================================================
-- V5: Password Reset Tokens (OTP-based, rate-limited)
-- ============================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         UUID         PRIMARY KEY,
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_hash   VARCHAR(255) NOT NULL,
    attempts   INT          NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ  NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pwd_reset_user_id    ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_pwd_reset_expires_at ON password_reset_tokens(expires_at);

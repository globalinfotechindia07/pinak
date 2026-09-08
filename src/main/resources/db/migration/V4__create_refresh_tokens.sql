-- ============================================================
-- V4: Refresh Tokens (hashed, with rotation family tracking)
-- ============================================================
-- family_id groups a chain of rotated tokens together.
-- If a revoked token in a family is re-used, the entire family
-- is revoked and the user is forced to re-authenticate.
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID         PRIMARY KEY,
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id  UUID         REFERENCES user_sessions(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    family_id   UUID         NOT NULL,
    issued_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ  NOT NULL,
    revoked_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id   ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family_id ON refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash      ON refresh_tokens(token_hash);

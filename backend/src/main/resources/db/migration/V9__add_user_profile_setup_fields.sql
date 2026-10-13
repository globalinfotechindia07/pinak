-- ============================================================
-- V9: Add State, Address, and Gender to Users Table for Mobile Profile Setup
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_users_state ON users(state);
CREATE INDEX IF NOT EXISTS idx_users_primary_city ON users(primary_city);

-- ============================================================
-- V12: Add User Profile Management Fields & Constraints
-- ============================================================

-- Add phone column (synced with mobile for backward compatibility)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Backfill phone from existing mobile numbers
UPDATE users SET phone = mobile WHERE phone IS NULL AND mobile IS NOT NULL;

-- Unique constraint on phone
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_unique') THEN
        ALTER TABLE users ADD CONSTRAINT users_phone_unique UNIQUE (phone);
    END IF;
END $$;

-- Index on phone for fast lookup
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Update status check constraint to support SUSPENDED status
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_status_check') THEN
        ALTER TABLE users DROP CONSTRAINT users_status_check;
    END IF;
    ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED'));
END $$;

-- Add profile completion flag and audit fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

-- Backfill profile_completed for existing users
UPDATE users
SET profile_completed = (
    first_name IS NOT NULL AND TRIM(first_name) <> ''
    AND last_name IS NOT NULL AND TRIM(last_name) <> ''
    AND email IS NOT NULL AND TRIM(email) <> ''
    AND ((phone IS NOT NULL AND TRIM(phone) <> '') OR (mobile IS NOT NULL AND TRIM(mobile) <> ''))
);

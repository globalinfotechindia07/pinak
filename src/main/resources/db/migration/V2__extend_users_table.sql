-- ============================================================
-- V2: Extend users table with new required fields
-- ============================================================

-- Add 'name' as display name (full name)
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Update existing rows: combine first_name + last_name into name
UPDATE users SET name = TRIM(first_name || ' ' || last_name) WHERE name IS NULL;

-- Make name NOT NULL after backfill
ALTER TABLE users ALTER COLUMN name SET NOT NULL;

-- Add mobile number (optional at registration)
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);

-- Account status: ACTIVE | INACTIVE | BLOCKED
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_mobile_unique') THEN
        ALTER TABLE users ADD CONSTRAINT users_mobile_unique UNIQUE (mobile);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_status_check') THEN
        ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED'));
    END IF;
END $$;

-- Email and mobile verification flags
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

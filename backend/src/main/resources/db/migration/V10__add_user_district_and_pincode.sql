-- ==============================================================================
-- V10: Add District and Pincode columns to Users table for Profile Setup
-- ==============================================================================

ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS district VARCHAR(100),
    ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_users_pincode ON users(pincode);
CREATE INDEX IF NOT EXISTS idx_users_district ON users(district);

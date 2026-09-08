-- ============================================================
-- V9: Add profile_picture_url column to users table
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(1024);

-- Seed default avatars for existing demo accounts
UPDATE users
SET profile_picture_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
WHERE email = 'customer@superapp.com' AND profile_picture_url IS NULL;

UPDATE users
SET profile_picture_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
WHERE email = 'merchant@superapp.com' AND profile_picture_url IS NULL;

UPDATE users
SET profile_picture_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
WHERE email = 'admin@superapp.com' AND profile_picture_url IS NULL;

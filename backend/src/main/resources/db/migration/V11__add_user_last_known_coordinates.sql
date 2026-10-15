-- ============================================================
-- V11: Add Last Known Latitude & Longitude to Users Table
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_known_latitude NUMERIC(10, 7);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_known_longitude NUMERIC(10, 7);

-- ============================================================
-- V23: Add approved_at to merchants table
-- ============================================================

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

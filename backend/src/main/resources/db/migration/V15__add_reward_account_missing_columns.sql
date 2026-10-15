-- V15: Add missing columns to reward_accounts to align with RewardAccount JPA entity
ALTER TABLE reward_accounts ADD COLUMN IF NOT EXISTS pending_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE reward_accounts ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'INR';
ALTER TABLE reward_accounts ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

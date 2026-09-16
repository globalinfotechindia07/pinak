-- ============================================================
-- V20: Create Reward Ledger and Enhance Reward Accounts
-- ============================================================

-- 1. Enhance reward_accounts table for financial precision and optimistic concurrency
ALTER TABLE reward_accounts
    ADD COLUMN IF NOT EXISTS available_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS pending_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- Convert existing columns if needed and set defaults
ALTER TABLE reward_accounts
    ALTER COLUMN lifetime_earned TYPE NUMERIC(12, 2) USING lifetime_earned::NUMERIC(12, 2),
    ALTER COLUMN lifetime_redeemed TYPE NUMERIC(12, 2) USING lifetime_redeemed::NUMERIC(12, 2);

ALTER TABLE reward_accounts
    ALTER COLUMN lifetime_earned SET DEFAULT 0.00,
    ALTER COLUMN lifetime_redeemed SET DEFAULT 0.00;

-- Sync available_balance from existing points_balance if present
UPDATE reward_accounts
SET available_balance = points_balance::NUMERIC(12, 2)
WHERE available_balance = 0.00 AND points_balance > 0;

-- 2. Create immutable reward_ledger_entries table
CREATE TABLE IF NOT EXISTS reward_ledger_entries (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reward_account_id UUID NOT NULL REFERENCES reward_accounts(id) ON DELETE RESTRICT,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    redemption_id UUID REFERENCES redemptions(id) ON DELETE SET NULL,
    type VARCHAR(32) NOT NULL, -- CREDIT, DEBIT, REVERSAL, ADJUSTMENT
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'POSTED', -- POSTED, REVERSED
    reference_id VARCHAR(128) NOT NULL,
    description VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_reward_ledger_redemption_type UNIQUE (redemption_id, type),
    CONSTRAINT uq_reward_ledger_reference_type UNIQUE (reference_id, type)
);

-- 3. Indexes for reward ledger entries
CREATE INDEX IF NOT EXISTS idx_reward_ledger_customer ON reward_ledger_entries(customer_id);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_account ON reward_ledger_entries(reward_account_id);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_transaction ON reward_ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_redemption ON reward_ledger_entries(redemption_id);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_reference ON reward_ledger_entries(reference_id);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_status ON reward_ledger_entries(status);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_type ON reward_ledger_entries(type);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_created_at ON reward_ledger_entries(created_at);

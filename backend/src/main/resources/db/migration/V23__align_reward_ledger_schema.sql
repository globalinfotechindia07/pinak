-- Align reward_ledger_entries with RewardLedgerEntry entity
ALTER TABLE reward_ledger_entries ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE reward_ledger_entries ADD COLUMN IF NOT EXISTS reward_account_id UUID;
ALTER TABLE reward_ledger_entries ADD COLUMN IF NOT EXISTS transaction_id UUID;
ALTER TABLE reward_ledger_entries ADD COLUMN IF NOT EXISTS redemption_id UUID;
ALTER TABLE reward_ledger_entries ADD COLUMN IF NOT EXISTS type VARCHAR(32);
ALTER TABLE reward_ledger_entries ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'POSTED';

UPDATE reward_ledger_entries SET reward_account_id = account_id WHERE reward_account_id IS NULL AND account_id IS NOT NULL;
UPDATE reward_ledger_entries SET type = entry_type WHERE type IS NULL AND entry_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reward_ledger_customer ON reward_ledger_entries(customer_id);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_account_fk ON reward_ledger_entries(reward_account_id);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_transaction ON reward_ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_redemption ON reward_ledger_entries(redemption_id);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_status ON reward_ledger_entries(status);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_type ON reward_ledger_entries(type);

ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS payment_notifications BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS reward_notifications BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS offer_notifications BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS system_notifications BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE reward_ledger_entries ALTER COLUMN account_id DROP NOT NULL;
ALTER TABLE reward_ledger_entries ALTER COLUMN entry_type DROP NOT NULL;
ALTER TABLE reward_ledger_entries ALTER COLUMN running_balance DROP NOT NULL;
ALTER TABLE reward_ledger_entries ALTER COLUMN reference_type DROP NOT NULL;

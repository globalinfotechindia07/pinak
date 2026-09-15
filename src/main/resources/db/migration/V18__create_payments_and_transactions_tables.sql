-- ============================================================
-- V18: Payment Integration & Transaction Processing Tables
-- ============================================================

-- 1. Enhance payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider VARCHAR(64);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_order_id VARCHAR(128);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_payment_id VARCHAR(128);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(12, 2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payable_amount NUMERIC(12, 2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS failure_code VARCHAR(64);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

-- Backfill existing payments data
UPDATE payments SET gross_amount = amount WHERE gross_amount IS NULL;
UPDATE payments SET payable_amount = amount WHERE payable_amount IS NULL;
UPDATE payments SET discount_amount = 0.00 WHERE discount_amount IS NULL;
UPDATE payments SET version = 0 WHERE version IS NULL;

-- Unique constraint for customer-level idempotency
ALTER TABLE payments ADD CONSTRAINT uq_payments_customer_idempotency UNIQUE (customer_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_payments_provider_order ON payments(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);

-- 2. Enhance transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS offer_id UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(12, 2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payable_amount NUMERIC(12, 2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

-- Backfill existing transactions data
UPDATE transactions SET gross_amount = amount WHERE gross_amount IS NULL;
UPDATE transactions SET payable_amount = amount WHERE payable_amount IS NULL;
UPDATE transactions SET discount_amount = 0.00 WHERE discount_amount IS NULL;
UPDATE transactions SET version = 0 WHERE version IS NULL;
UPDATE transactions SET updated_at = created_at WHERE updated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_store ON transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment ON transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- 3. Webhook events table for replay protection and idempotency
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY,
    provider VARCHAR(64) NOT NULL,
    provider_event_id VARCHAR(128) NOT NULL,
    event_type VARCHAR(64),
    payment_id UUID,
    payload TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'PROCESSED',
    processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_webhook_provider_event UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_payment ON webhook_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed_at);

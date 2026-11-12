-- ==============================================================================
-- V25: Align payments and webhook_events tables with JPA entities
-- Matches com.superapp.transaction.payment.entity.Payment and WebhookEventLog
-- ==============================================================================

-- Align payments table
ALTER TABLE payments ALTER COLUMN order_id DROP NOT NULL;
ALTER TABLE payments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE payments ALTER COLUMN gateway DROP NOT NULL;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(64);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES offers(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider VARCHAR(64);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_order_id VARCHAR(128);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_payment_id VARCHAR(128);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(12, 2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payable_amount NUMERIC(12, 2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS failure_code VARCHAR(64);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(512);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_reference ON payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_merchant ON payments(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payments_store ON payments(store_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_order ON payments(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_customer_idempotency ON payments(customer_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Align webhook_events table
ALTER TABLE webhook_events ALTER COLUMN gateway DROP NOT NULL;
ALTER TABLE webhook_events ALTER COLUMN event_id DROP NOT NULL;

ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS provider VARCHAR(64);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS provider_event_id VARCHAR(128);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_webhook_provider_event ON webhook_events(provider, provider_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_payment ON webhook_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed_at);

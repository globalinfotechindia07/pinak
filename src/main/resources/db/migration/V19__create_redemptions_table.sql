-- ============================================================
-- V19: Create Redemptions Table and Enhance Offers Usage Count
-- ============================================================

-- 1. Add current_usage_count column to offers table
ALTER TABLE offers
    ADD COLUMN IF NOT EXISTS current_usage_count INTEGER NOT NULL DEFAULT 0;

-- 2. Create redemptions table
CREATE TABLE IF NOT EXISTS redemptions (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE RESTRICT,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    redeemed_amount NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    reward_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    idempotency_key VARCHAR(128),
    redeemed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uq_redemptions_customer_payment_offer UNIQUE (customer_id, payment_id, offer_id),
    CONSTRAINT uq_redemptions_customer_idempotency UNIQUE (customer_id, idempotency_key)
);

-- 3. Create indexes for redemptions table
CREATE INDEX IF NOT EXISTS idx_redemptions_customer ON redemptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_merchant ON redemptions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_store ON redemptions(store_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_offer ON redemptions(offer_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_payment ON redemptions(payment_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_transaction ON redemptions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);
CREATE INDEX IF NOT EXISTS idx_redemptions_redeemed_at ON redemptions(redeemed_at);
CREATE INDEX IF NOT EXISTS idx_redemptions_created_at ON redemptions(created_at);

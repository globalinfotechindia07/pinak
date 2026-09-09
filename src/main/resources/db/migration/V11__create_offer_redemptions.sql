-- ============================================================
-- V11: Offer Redemptions Table
-- ============================================================

CREATE TABLE IF NOT EXISTS offer_redemptions (
    id UUID PRIMARY KEY,
    offer_id UUID NOT NULL,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    bill_amount NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) NOT NULL,
    payable_amount NUMERIC(12, 2) NOT NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'INITIATED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_redemptions_customer ON offer_redemptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_offer ON offer_redemptions(offer_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_store ON offer_redemptions(store_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_payment ON offer_redemptions(payment_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON offer_redemptions(status);

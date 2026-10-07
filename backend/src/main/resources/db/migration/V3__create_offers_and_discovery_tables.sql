-- ==============================================================================
-- V3: Offers, Deal Discovery, and In-Store Redemptions
-- Tables: offers, offer_redemptions, redemptions
-- ==============================================================================

-- 1. Offers Table (Commercial Deals & Campaigns)
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    terms_and_conditions TEXT,
    type VARCHAR(32) NOT NULL DEFAULT 'PERCENTAGE_DISCOUNT',
    value NUMERIC(10, 2) NOT NULL,
    min_transaction_amount NUMERIC(10, 2) DEFAULT 0.00,
    max_discount_amount NUMERIC(10, 2),
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE NOT NULL,
    usage_limit INTEGER,
    per_customer_limit INTEGER DEFAULT 1,
    current_usage_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    approval_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_APPROVAL',
    rejection_reason TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_offers_merchant ON offers(merchant_id);
CREATE INDEX IF NOT EXISTS idx_offers_store ON offers(store_id);
CREATE INDEX IF NOT EXISTS idx_offers_category ON offers(category_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_approval ON offers(approval_status);
CREATE INDEX IF NOT EXISTS idx_offers_validity ON offers(valid_from, valid_to);

-- 2. Offer Redemptions Table (Audit record of discount redemption per user)
CREATE TABLE IF NOT EXISTS offer_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    redeemed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    transaction_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

CREATE INDEX IF NOT EXISTS idx_offer_redemptions_user ON offer_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_offer_redemptions_offer ON offer_redemptions(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_redemptions_store ON offer_redemptions(store_id);

-- 3. Redemptions Table (Voucher / QR Code Ledger)
CREATE TABLE IF NOT EXISTS redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    voucher_code VARCHAR(64) NOT NULL UNIQUE,
    qr_payload TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'CLAIMED',
    claimed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITHOUT TIME ZONE,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    bill_amount NUMERIC(10, 2),
    final_amount NUMERIC(10, 2),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_redemptions_user ON redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_offer ON redemptions(offer_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_store ON redemptions(store_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_voucher ON redemptions(voucher_code);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);



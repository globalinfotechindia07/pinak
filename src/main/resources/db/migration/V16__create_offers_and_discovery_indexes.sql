-- ============================================================
-- V16: Create Offers Table, Discovery Indexes, and PostGIS Prep
-- ============================================================

-- 1. Create Offers Table
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(32) NOT NULL DEFAULT 'CASHBACK',
    value NUMERIC(10, 2) NOT NULL,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes for Offers
CREATE INDEX IF NOT EXISTS idx_offers_merchant ON offers(merchant_id);
CREATE INDEX IF NOT EXISTS idx_offers_store ON offers(store_id);
CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(status, valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_offers_store_active ON offers(store_id, status, valid_from, valid_to);

-- 2. Ensure Store Discovery Indexes
CREATE INDEX IF NOT EXISTS idx_stores_discovery_status ON stores(approval_status, status);
CREATE INDEX IF NOT EXISTS idx_stores_discovery_merchant ON stores(merchant_id, approval_status, status);
CREATE INDEX IF NOT EXISTS idx_stores_lat_lng ON stores(latitude, longitude);

-- 3. Seed Sample Offers for Existing Seeded Merchants/Stores
DO $$
DECLARE
    m_id UUID;
    s_id UUID;
BEGIN
    SELECT id INTO m_id FROM merchants LIMIT 1;
    IF m_id IS NOT NULL THEN
        SELECT id INTO s_id FROM stores WHERE merchant_id = m_id LIMIT 1;
        INSERT INTO offers (id, merchant_id, store_id, title, description, type, value, valid_from, valid_to, status, created_at, updated_at)
        VALUES
            ('22222222-2222-2222-2222-222222222201', m_id, s_id, '10% Cashback on All Items', 'Get 10% cashback on eligible purchases at this branch', 'CASHBACK', 10.00, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '30 days', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('22222222-2222-2222-2222-222222222202', m_id, NULL, 'Flat ₹100 Off on Minimum ₹500', 'Valid across all store branches', 'FLAT', 100.00, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '60 days', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

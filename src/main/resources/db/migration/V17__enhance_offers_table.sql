-- ============================================================
-- V17: Enhance Offers Table with Lifecycle, Limits, and Approvals
-- ============================================================

-- 1. Add approval, audit, and limit columns to offers
ALTER TABLE offers
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS min_transaction_amount NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS max_discount_amount NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS usage_limit INTEGER,
    ADD COLUMN IF NOT EXISTS per_customer_limit INTEGER,
    ADD COLUMN IF NOT EXISTS approval_status VARCHAR(32) NOT NULL DEFAULT 'APPROVED',
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS approved_by UUID,
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(64),
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(64);

-- 2. Performance indexes for offer lifecycle and store/merchant filtering
CREATE INDEX IF NOT EXISTS idx_offers_approval_lifecycle ON offers(approval_status, status, valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_offers_store_approval ON offers(store_id, approval_status, status);
CREATE INDEX IF NOT EXISTS idx_offers_merchant_approval ON offers(merchant_id, approval_status, status);

-- 3. Update any existing seeded records to ensure consistent approval status and type
UPDATE offers
SET approval_status = 'APPROVED',
    status = 'ACTIVE'
WHERE approval_status IS NULL OR approval_status = 'APPROVED';

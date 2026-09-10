-- ============================================================
-- V13: Extend merchants table with profile, status, and approval fields
-- ============================================================

-- Add legal_name, description, phone, email, website
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255);
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS website VARCHAR(255);

-- Add approval_status (defaulting to PENDING_APPROVAL)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS approval_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_APPROVAL';

-- Migrate existing data:
-- Map status values 'APPROVED', 'REJECTED', 'PENDING' to approval_status
UPDATE merchants SET approval_status = 'APPROVED' WHERE status = 'APPROVED';
UPDATE merchants SET approval_status = 'REJECTED' WHERE status = 'REJECTED';
UPDATE merchants SET approval_status = 'PENDING_APPROVAL' WHERE status = 'PENDING' OR status IS NULL;

-- Normalize operational status to ACTIVE or SUSPENDED
UPDATE merchants SET status = 'SUSPENDED' WHERE status = 'SUSPENDED';
UPDATE merchants SET status = 'ACTIVE' WHERE status <> 'SUSPENDED' OR status IS NULL;

-- Enforce constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchants_status_check') THEN
        ALTER TABLE merchants ADD CONSTRAINT merchants_status_check CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchants_approval_status_check') THEN
        ALTER TABLE merchants ADD CONSTRAINT merchants_approval_status_check CHECK (approval_status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'));
    END IF;
END $$;

-- Add rejection and suspension audit fields
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

-- Indexes for performance & query patterns
CREATE INDEX IF NOT EXISTS idx_merchants_owner ON merchants(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_merchants_status ON merchants(status);
CREATE INDEX IF NOT EXISTS idx_merchants_approval_status ON merchants(approval_status);
CREATE INDEX IF NOT EXISTS idx_merchants_category ON merchants(category_id);
CREATE INDEX IF NOT EXISTS idx_merchants_phone ON merchants(phone);
CREATE INDEX IF NOT EXISTS idx_merchants_email ON merchants(email);

-- KYC Documents Table
CREATE TABLE IF NOT EXISTS merchant_kyc (
    id UUID PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    document_type VARCHAR(64) NOT NULL,
    document_number VARCHAR(128) NOT NULL,
    business_registration_number VARCHAR(128),
    tax_id VARCHAR(128),
    document_url VARCHAR(1024),
    status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
    verified_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_merchant_kyc_merchant_id ON merchant_kyc(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_kyc_status ON merchant_kyc(status);

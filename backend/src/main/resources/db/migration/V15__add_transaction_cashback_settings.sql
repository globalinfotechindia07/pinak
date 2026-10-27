-- ==============================================================================
-- Migration V15: Add Transaction Cashback Settings for Stores and Platform
-- Enables Super Admin to configure platform-wide and store-level transaction cashbacks
-- ==============================================================================

-- 1. Add cashback columns to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS cashback_percentage NUMERIC(5,2) DEFAULT 5.00;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS max_cashback_amount NUMERIC(10,2) DEFAULT 150.00;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS min_transaction_for_cashback NUMERIC(10,2) DEFAULT 100.00;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_cashback_enabled BOOLEAN DEFAULT true;

-- Update existing stores with default cashback values
UPDATE stores
SET cashback_percentage = COALESCE(cashback_percentage, 5.00),
    max_cashback_amount = COALESCE(max_cashback_amount, 150.00),
    min_transaction_for_cashback = COALESCE(min_transaction_for_cashback, 100.00),
    is_cashback_enabled = COALESCE(is_cashback_enabled, true);

-- 2. Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description VARCHAR(500),
    updated_by VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Seed default TRANSACTION_CASHBACK configuration
INSERT INTO platform_settings (setting_key, setting_value, description, updated_by)
VALUES (
    'TRANSACTION_CASHBACK',
    '{
        "enabled": true,
        "defaultPercentage": 5.00,
        "maxCashbackPerTransaction": 150.00,
        "minTransactionAmount": 100.00,
        "rewardMode": "COINS",
        "cashbackName": "PINAK Instant Transaction Cashback"
    }'::jsonb,
    'Global transaction cashback policy managed by Super Admin',
    'SYSTEM'
)
ON CONFLICT (setting_key) DO NOTHING;

-- ==============================================================================
-- Migration V15: Platform Settings & Transaction Cashback Configuration
-- (Store cashback columns integrated into V2 base schema)
-- ==============================================================================

-- 1. Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description VARCHAR(500),
    updated_by VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Seed default TRANSACTION_CASHBACK configuration
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

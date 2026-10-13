-- ============================================================
-- V8: Add PINAK Mobile Onboarding, Referral & Permission Fields
--     + Mobile OTP Database Storage Table
-- ============================================================

-- 1. Mobile Onboarding Fields on Users Table
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_zone VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_alerts_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS soundbox_stay_signed_in BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS category_preferences VARCHAR(1000);
ALTER TABLE users ADD COLUMN IF NOT EXISTS precise_location_granted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS flash_alerts_granted BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- 2. Dedicated Mobile OTP Ledger Table (for DB-backed OTP storage)
CREATE TABLE IF NOT EXISTS mobile_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    session_id VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'SMS',
    attempts INT NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_consumed BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    cooldown_until TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mobile_otps_phone_active ON mobile_otps(phone, is_consumed, expires_at);
CREATE INDEX IF NOT EXISTS idx_mobile_otps_session ON mobile_otps(session_id);
CREATE INDEX IF NOT EXISTS idx_mobile_otps_cooldown ON mobile_otps(phone, cooldown_until);
CREATE UNIQUE INDEX IF NOT EXISTS uq_mobile_otps_phone ON mobile_otps(phone);

-- ==============================================================================
-- V1: Core Identity, Authentication, Mobile OTPs, and Audit Infrastructure
-- Tables: users, user_sessions, refresh_tokens, password_reset_tokens, mobile_otps, audit_logs
-- ==============================================================================

-- 1. Users Table (Unified Human Identity with All Profile & Preferences Fields)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED')),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    mobile_verified BOOLEAN NOT NULL DEFAULT FALSE,
    profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
    birthday DATE,
    primary_city VARCHAR(100),
    state VARCHAR(100),
    district VARCHAR(100),
    pincode VARCHAR(20),
    address VARCHAR(500),
    gender VARCHAR(20),
    primary_zone VARCHAR(255),
    referral_code VARCHAR(50),
    referred_by_code VARCHAR(50),
    whatsapp_alerts_enabled BOOLEAN DEFAULT TRUE,
    soundbox_stay_signed_in BOOLEAN DEFAULT FALSE,
    category_preferences VARCHAR(1000),
    precise_location_granted BOOLEAN DEFAULT FALSE,
    flash_alerts_granted BOOLEAN DEFAULT FALSE,
    last_known_latitude NUMERIC(10, 7),
    last_known_longitude NUMERIC(10, 7),
    profile_picture_url VARCHAR(1024),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_pincode ON users(pincode);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(primary_city);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- 2. User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(100),
    device_name VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITHOUT TIME ZONE,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_id ON user_sessions(user_id, device_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- 3. Refresh Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    family_id UUID NOT NULL DEFAULT gen_random_uuid(),
    issued_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITHOUT TIME ZONE,
    device_id VARCHAR(100),
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    replaced_by_token_hash VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked ON refresh_tokens(revoked_at);

-- 4. Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);

-- 5. Mobile OTPs Table (DB-backed secure OTP storage)
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

-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent VARCHAR(512),
    request_id VARCHAR(100),
    metadata TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

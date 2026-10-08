-- 1. Merchant Wallets (Auto-created upon Merchant Onboarding)
CREATE TABLE IF NOT EXISTS merchant_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL UNIQUE REFERENCES merchants(id) ON DELETE CASCADE,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    available_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    pending_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_withdrawn NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    lifetime_volume NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, FROZEN, SUSPENDED
    version BIGINT NOT NULL DEFAULT 0, -- Optimistic locking for concurrency safety
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_merchant_wallets_merchant ON merchant_wallets(merchant_id);

-- 2. Merchant Wallet Ledger (Immutable Double-Entry Financial Bookkeeping)
CREATE TABLE IF NOT EXISTS merchant_wallet_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES merchant_wallets(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL, -- Track which branch generated the revenue
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    payout_id UUID, -- References merchant_payout_requests(id)
    entry_type VARCHAR(16) NOT NULL, -- CREDIT, DEBIT, HOLD, RELEASE, REVERSAL
    amount NUMERIC(14, 2) NOT NULL,
    fee_deducted NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    net_amount NUMERIC(14, 2) NOT NULL,
    running_balance NUMERIC(14, 2) NOT NULL,
    description VARCHAR(500) NOT NULL,
    source_reference VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_ledger_wallet ON merchant_wallet_ledger(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_store ON merchant_wallet_ledger(store_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_created ON merchant_wallet_ledger(created_at DESC);

-- 3. Merchant Bank Accounts (Collected in Onboarding & Profile)
CREATE TABLE IF NOT EXISTS merchant_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    account_holder_name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(128) NOT NULL,
    account_number_encrypted VARCHAR(512) NOT NULL, -- AES-256 encrypted
    account_number_last4 VARCHAR(4) NOT NULL,
    ifsc_code VARCHAR(16) NOT NULL,
    upi_vpa VARCHAR(100),
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, VERIFIED, REJECTED
    penny_drop_reference VARCHAR(128),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_merchant ON merchant_bank_accounts(merchant_id);

-- 4. Merchant Payout Requests (Bank Transfer Tracking)
CREATE TABLE IF NOT EXISTS merchant_payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES merchant_wallets(id) ON DELETE CASCADE,
    bank_account_id UUID NOT NULL REFERENCES merchant_bank_accounts(id),
    amount NUMERIC(14, 2) NOT NULL,
    payout_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    net_payout NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    mode VARCHAR(16) NOT NULL DEFAULT 'IMPS', -- IMPS, NEFT, RTGS, UPI
    status VARCHAR(32) NOT NULL DEFAULT 'INITIATED', -- INITIATED, PROCESSING, SUCCESS, FAILED, REVERSED, HELD
    provider VARCHAR(64) NOT NULL, -- RAZORPAYX, CASHFREE, DECENTRO, ICICI
    provider_payout_id VARCHAR(128),
    bank_utr VARCHAR(64),
    idempotency_key UUID NOT NULL UNIQUE,
    failure_reason TEXT,
    requested_by UUID NOT NULL REFERENCES users(id),
    processed_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payouts_merchant ON merchant_payout_requests(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON merchant_payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payouts_idempotency ON merchant_payout_requests(idempotency_key);

-- ============================================================
-- V8: Transaction Platform Tables: Payments, Transactions, Rewards
-- ============================================================

-- 1. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    payment_reference VARCHAR(64) NOT NULL UNIQUE,
    gateway_transaction_id VARCHAR(128),
    customer_id UUID NOT NULL,
    merchant_id UUID NOT NULL,
    store_id UUID,
    offer_id UUID,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    payment_method VARCHAR(32) NOT NULL DEFAULT 'UPI',
    status VARCHAR(32) NOT NULL DEFAULT 'INITIATED',
    failure_reason VARCHAR(512),
    notes VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_merchant ON payments(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 2. Transactions (Ledger / History) Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY,
    transaction_reference VARCHAR(64) NOT NULL UNIQUE,
    payment_id UUID,
    customer_id UUID NOT NULL,
    merchant_id UUID NOT NULL,
    store_id UUID,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
    description VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);

-- 3. Reward Accounts Table
CREATE TABLE IF NOT EXISTS reward_accounts (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL UNIQUE,
    points_balance BIGINT NOT NULL DEFAULT 0,
    lifetime_earned BIGINT NOT NULL DEFAULT 0,
    lifetime_redeemed BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reward_accounts_customer ON reward_accounts(customer_id);

-- 4. Reward Transactions Table
CREATE TABLE IF NOT EXISTS reward_transactions (
    id UUID PRIMARY KEY,
    reward_account_id UUID NOT NULL REFERENCES reward_accounts(id) ON DELETE CASCADE,
    points BIGINT NOT NULL,
    type VARCHAR(32) NOT NULL,
    reference_type VARCHAR(64),
    reference_id VARCHAR(64),
    description VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reward_tx_account ON reward_transactions(reward_account_id);
CREATE INDEX IF NOT EXISTS idx_reward_tx_created ON reward_transactions(created_at);

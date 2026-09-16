-- ============================================================
-- V22: Enhance Transactions Table for Transaction History Module
-- ============================================================

-- 1. Add missing fields to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS redemption_id UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(32) DEFAULT 'UPI';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS provider_transaction_id VARCHAR(128);

-- Backfill default payment method if null
UPDATE transactions SET payment_method = 'UPI' WHERE payment_method IS NULL;

-- 2. Performance indexes for Customer, Merchant, and Admin queries
CREATE INDEX IF NOT EXISTS idx_transactions_redemption ON transactions(redemption_id);
CREATE INDEX IF NOT EXISTS idx_transactions_provider_tx ON transactions(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_offer ON transactions(offer_id);

-- Composite indexes for range and sorting queries
CREATE INDEX IF NOT EXISTS idx_transactions_customer_created ON transactions(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_created ON transactions(merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_store_created ON transactions(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status_created ON transactions(status, created_at DESC);

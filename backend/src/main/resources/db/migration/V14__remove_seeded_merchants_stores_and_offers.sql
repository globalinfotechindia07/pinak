-- ==============================================================================
-- Migration V14: Remove All Seeded Merchants, Stores, Products, and Offers
-- Retains only the Super Admin account (riya.admin@pinak.app) and platform taxonomy
-- ==============================================================================

-- 1. Unlink any references in discovery curation config
UPDATE discovery_curation_config
SET hero_offer_id = NULL,
    featured_store_ids = '[]'::jsonb
WHERE config_key = 'GLOBAL_MOBILE_DISCOVERY';

-- 2. Clear transactional and redemption records referencing offers/stores/merchants
DELETE FROM offer_redemptions;
DELETE FROM redemptions;
DELETE FROM transactions;

-- 3. Clear products (flash deals, store menu items)
DELETE FROM products;

-- 4. Clear all seeded offers
DELETE FROM offers;

-- 5. Clear merchant wallets and financials (if any)
DELETE FROM merchant_wallet_ledger;
DELETE FROM merchant_wallets;
DELETE FROM merchant_payout_requests;
DELETE FROM merchant_bank_accounts;
DELETE FROM merchant_kyc;

-- 6. Clear merchant-scoped staff members (retain platform SUPERADMIN staff)
DELETE FROM staff_members
WHERE scope != 'PLATFORM' OR merchant_id IS NOT NULL OR store_id IS NOT NULL;

-- 7. Clear all seeded stores
DELETE FROM stores;

-- 8. Clear all seeded merchants
DELETE FROM merchants;

-- 9. Ensure Super Admin user remains intact and verified
UPDATE users
SET status = 'ACTIVE'
WHERE email = 'riya.admin@pinak.app' AND role = 'SUPER_ADMIN';

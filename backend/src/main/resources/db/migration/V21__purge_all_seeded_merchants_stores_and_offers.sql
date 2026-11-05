-- ==============================================================================
-- Migration V21: Purge All Seeded Merchants, Stores, Offers, Products, and Staff
-- Retains ONLY the Super Admin account (riya.admin@pinak.app), Master Cities,
-- Platform Categories, and Platform RBAC configurations.
-- ==============================================================================

-- 1. Reset discovery curation references
UPDATE discovery_curation_config
SET hero_offer_id = NULL,
    featured_store_ids = '[]'::jsonb
WHERE config_key = 'GLOBAL_MOBILE_DISCOVERY';

-- 2. Clear table bookings
DELETE FROM table_bookings;

-- 3. Clear offer redemptions, redemptions, and transactions
DELETE FROM offer_redemptions;
DELETE FROM redemptions;
DELETE FROM transactions;

-- 4. Clear products
DELETE FROM products;

-- 5. Clear all offers
DELETE FROM offers;

-- 6. Clear merchant wallets and financials
DELETE FROM merchant_wallet_ledger;
DELETE FROM merchant_wallets;
DELETE FROM merchant_payout_requests;
DELETE FROM merchant_bank_accounts;
DELETE FROM merchant_kyc;

-- 7. Clear non-platform staff members (retain platform SUPERADMIN staff)
DELETE FROM staff_members
WHERE scope != 'PLATFORM' OR merchant_id IS NOT NULL OR store_id IS NOT NULL;

-- 8. Clear all stores
DELETE FROM stores;

-- 9. Clear all merchants
DELETE FROM merchants;

-- 10. Remove non-super-admin users (retain super admin user riya.admin@pinak.app)
DELETE FROM users
WHERE email != 'riya.admin@pinak.app';

-- 11. Ensure Super Admin user remains intact and active
UPDATE users
SET status = 'ACTIVE'
WHERE email = 'riya.admin@pinak.app' AND role = 'SUPER_ADMIN';

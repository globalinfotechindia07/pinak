-- ==============================================================================
-- V5: Unified Hierarchical Scoped RBAC System
-- Serves:
-- 1. Super Admin Panel (Scope: PLATFORM)
-- 2. Merchant Web Portal (Scope: MERCHANT)
-- 3. Branch / Store Portal & POS Counter (Scope: STORE)
-- 4. Consumer Mobile App (Unified users identity with reward_accounts wallet)
-- ==============================================================================

-- 1. Unified Roles Catalog Table
CREATE TABLE IF NOT EXISTS roles (
    id              VARCHAR(64) PRIMARY KEY,
    scope           VARCHAR(20) NOT NULL CHECK (scope IN ('PLATFORM', 'MERCHANT', 'STORE')),
    scope_id        UUID,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    badge_cls       VARCHAR(255),
    is_system       BOOLEAN NOT NULL DEFAULT FALSE,
    permissions     JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roles_scope ON roles(scope, scope_id);
CREATE INDEX IF NOT EXISTS idx_roles_is_system ON roles(is_system);

-- 2. Unified Staff Assignment Table
CREATE TABLE IF NOT EXISTS staff_members (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id             VARCHAR(64) NOT NULL REFERENCES roles(id),
    scope               VARCHAR(20) NOT NULL CHECK (scope IN ('PLATFORM', 'MERCHANT', 'STORE')),
    merchant_id         UUID REFERENCES merchants(id) ON DELETE CASCADE,
    store_id            UUID REFERENCES stores(id) ON DELETE CASCADE,
    pos_pin             VARCHAR(255),
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' 
                        CHECK (status IN ('ACTIVE', 'INVITED', 'SUSPENDED')),
    custom_permissions  JSONB DEFAULT '{}'::jsonb,
    invited_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    last_login_at       TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_staff_user ON staff_members(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff_members(role_id);
CREATE INDEX IF NOT EXISTS idx_staff_merchant ON staff_members(merchant_id) WHERE merchant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_store ON staff_members(store_id) WHERE store_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_scope ON staff_members(scope, status);

CREATE UNIQUE INDEX IF NOT EXISTS uk_staff_platform ON staff_members(user_id) 
    WHERE scope = 'PLATFORM';

CREATE UNIQUE INDEX IF NOT EXISTS uk_staff_merchant ON staff_members(user_id, merchant_id) 
    WHERE scope = 'MERCHANT' AND store_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_staff_store ON staff_members(user_id, store_id) 
    WHERE scope = 'STORE';

-- 3. Backward-Compatible Views
CREATE OR REPLACE VIEW platform_roles AS 
    SELECT id, name, description, badge_cls, is_system, permissions, created_at, updated_at 
    FROM roles 
    WHERE scope = 'PLATFORM';

CREATE OR REPLACE VIEW admin_staff AS 
    SELECT id, user_id, role_id, status, custom_permissions, invited_by, last_login_at, created_at, updated_at 
    FROM staff_members 
    WHERE scope = 'PLATFORM';

-- ==============================================================================
-- 4. Seed Standard Roles Across All 3 Tiers
-- ==============================================================================

-- A) Platform Level Roles (Super Admin Console)
INSERT INTO roles (id, scope, scope_id, name, description, badge_cls, is_system, permissions)
VALUES
(
    'SUPERADMIN',
    'PLATFORM',
    NULL,
    'Super Admin',
    'Unrestricted platform & cluster administration with full authority over merchants, settlements & system settings.',
    'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    TRUE,
    '{"canManageMerchants": true, "canVerifyKYC": true, "canModerateOffers": true, "canViewFinancials": true, "canManageTaxonomy": true, "canConfigurePlatform": true, "canManageStaff": true}'::jsonb
),
(
    'REGIONAL_OPS',
    'PLATFORM',
    NULL,
    'Regional Ops Lead',
    'Manages regional merchant onboarding, store locations, and discount campaign moderation.',
    'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    TRUE,
    '{"canManageMerchants": true, "canVerifyKYC": true, "canModerateOffers": true, "canViewFinancials": false, "canManageTaxonomy": false, "canConfigurePlatform": false, "canManageStaff": false}'::jsonb
),
(
    'COMPLIANCE_KYC',
    'PLATFORM',
    NULL,
    'Compliance & KYC',
    'Verifies government identity, GSTIN, PAN, bank account validation, and business licences.',
    'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
    TRUE,
    '{"canManageMerchants": true, "canVerifyKYC": true, "canModerateOffers": false, "canViewFinancials": false, "canManageTaxonomy": false, "canConfigurePlatform": false, "canManageStaff": false}'::jsonb
),
(
    'FINANCE_AUDITOR',
    'PLATFORM',
    NULL,
    'Finance Auditor',
    'Monitors platform GMV, UPI transaction reconciliation, and merchant payout batches.',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    TRUE,
    '{"canManageMerchants": false, "canVerifyKYC": false, "canModerateOffers": false, "canViewFinancials": true, "canManageTaxonomy": false, "canConfigurePlatform": false, "canManageStaff": false}'::jsonb
),
(
    'CATALOG_LEAD',
    'PLATFORM',
    NULL,
    'Catalog Lead',
    'Curates categories, subcategories, tags, attributes, and discovery classifications.',
    'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
    TRUE,
    '{"canManageMerchants": false, "canVerifyKYC": false, "canModerateOffers": false, "canViewFinancials": false, "canManageTaxonomy": true, "canConfigurePlatform": false, "canManageStaff": false}'::jsonb
),
(
    'SUPPORT_LEAD',
    'PLATFORM',
    NULL,
    'Support Lead',
    'Assists merchants and consumers, reviews customer tickets, and resolves transaction disputes.',
    'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    TRUE,
    '{"canManageMerchants": false, "canVerifyKYC": false, "canModerateOffers": false, "canViewFinancials": false, "canManageTaxonomy": false, "canConfigurePlatform": false, "canManageStaff": false}'::jsonb
),

-- B) Merchant Brand Level Roles (Merchant Web Portal)
(
    'MARKETING_LEAD',
    'MERCHANT',
    NULL,
    'Marketing & Growth Lead',
    'Creates flash deals, analyzes offer traction, and coordinates regional festive campaigns across all branch stores.',
    'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    TRUE,
    '{"canViewQR": true, "canViewBilling": false, "canApplyDiscounts": false, "canManageOffers": true, "canEditTimings": false, "canViewAnalytics": true, "canManageStaff": false, "canEditBankDetails": false, "canUploadKYC": false}'::jsonb
),
(
    'MERCHANT_FINANCE',
    'MERCHANT',
    NULL,
    'Merchant Finance Lead',
    'Views brand-level GMV, store settlement reports, bank reconciliation, and tax invoices.',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    TRUE,
    '{"canViewQR": false, "canViewBilling": true, "canApplyDiscounts": false, "canManageOffers": false, "canEditTimings": false, "canViewAnalytics": true, "canManageStaff": false, "canEditBankDetails": true, "canUploadKYC": true}'::jsonb
),

-- C) Branch / Store Level Roles (Store Portal & POS Terminal)
(
    'STORE_MANAGER',
    'STORE',
    NULL,
    'Store Manager',
    'Branch in-charge with full operational control over desk redemptions, branch operating hours, and staff shifts.',
    'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    TRUE,
    '{"canViewQR": true, "canViewBilling": true, "canApplyDiscounts": true, "canManageOffers": true, "canEditTimings": true, "canViewAnalytics": true, "canManageStaff": true}'::jsonb
),
(
    'CASHIER',
    'STORE',
    NULL,
    'Cashier / POS Operator',
    'Front-desk operator who verifies customer QR scans, applies loyalty discounts, and confirms bills.',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    TRUE,
    '{"canViewQR": true, "canViewBilling": true, "canApplyDiscounts": true, "canManageOffers": false, "canEditTimings": false, "canViewAnalytics": false, "canManageStaff": false}'::jsonb
),
(
    'BILLING_STAFF',
    'STORE',
    NULL,
    'Billing Staff',
    'Monitors real-time live redemptions feed and prints checkout summaries for customers.',
    'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    TRUE,
    '{"canViewQR": true, "canViewBilling": true, "canApplyDiscounts": false, "canManageOffers": false, "canEditTimings": false, "canViewAnalytics": false, "canManageStaff": false}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    badge_cls = EXCLUDED.badge_cls,
    is_system = EXCLUDED.is_system,
    permissions = EXCLUDED.permissions,
    updated_at = CURRENT_TIMESTAMP;

-- ==============================================================================
-- 5. Seed Platform Staff Users & Staff Members
-- ==============================================================================

-- Seed Users for Platform Staff
INSERT INTO users (id, email, password, first_name, last_name, name, role, status, email_verified, mobile_verified, profile_completed, phone, mobile)
VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'riya.admin@pinak.app',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Riya',
    'Shah',
    'Riya Shah',
    'SUPER_ADMIN',
    'ACTIVE',
    TRUE,
    TRUE,
    TRUE,
    '+91 98200 00001',
    '9820000001'
),
(
    'd0000000-0000-0000-0000-000000000021',
    'siddharth@pinak.app',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Siddharth',
    'Verma',
    'Siddharth Verma',
    'ADMIN',
    'ACTIVE',
    TRUE,
    TRUE,
    TRUE,
    '+91 98201 23456',
    '9820123456'
),
(
    'd0000000-0000-0000-0000-000000000022',
    'ananya.ops@pinak.app',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Ananya',
    'Deshpande',
    'Ananya Deshpande',
    'ADMIN',
    'ACTIVE',
    TRUE,
    TRUE,
    TRUE,
    '+91 97654 11223',
    '9765411223'
),
(
    'd0000000-0000-0000-0000-000000000023',
    'rohan.kyc@pinak.app',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Rohan',
    'Kulkarni',
    'Rohan Kulkarni',
    'ADMIN',
    'ACTIVE',
    TRUE,
    TRUE,
    TRUE,
    '+91 91234 44556',
    '9123444556'
),
(
    'd0000000-0000-0000-0000-000000000024',
    'meera.audit@pinak.app',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Meera',
    'Sen',
    'Meera Sen',
    'ADMIN',
    'ACTIVE',
    TRUE,
    TRUE,
    TRUE,
    '+91 98888 77665',
    '9888877665'
),
(
    'd0000000-0000-0000-0000-000000000025',
    'neha.support@pinak.app',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Neha',
    'Joshi',
    'Neha Joshi',
    'ADMIN',
    'INACTIVE',
    FALSE,
    TRUE,
    TRUE,
    '+91 93210 99887',
    '9321099887'
),
-- Store Staff User (Vikram Joshi)
(
    'd0000000-0000-0000-0000-000000000031',
    'vikram.desk@curryleaf.in',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Vikram',
    'Joshi',
    'Vikram Joshi',
    'MERCHANT',
    'ACTIVE',
    TRUE,
    TRUE,
    TRUE,
    '+91 98220 11223',
    '9822011223'
)
ON CONFLICT (email) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    phone = EXCLUDED.phone,
    mobile = EXCLUDED.mobile;

-- Staff Assignments
INSERT INTO staff_members (id, user_id, role_id, scope, merchant_id, store_id, status, last_login_at)
VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'SUPERADMIN',
    'PLATFORM',
    NULL,
    NULL,
    'ACTIVE',
    CURRENT_TIMESTAMP
),
(
    'e0000000-0000-0000-0000-000000000021',
    'd0000000-0000-0000-0000-000000000021',
    'SUPERADMIN',
    'PLATFORM',
    NULL,
    NULL,
    'ACTIVE',
    CURRENT_TIMESTAMP
),
(
    'e0000000-0000-0000-0000-000000000022',
    'd0000000-0000-0000-0000-000000000022',
    'REGIONAL_OPS',
    'PLATFORM',
    NULL,
    NULL,
    'ACTIVE',
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
),
(
    'e0000000-0000-0000-0000-000000000023',
    'd0000000-0000-0000-0000-000000000023',
    'COMPLIANCE_KYC',
    'PLATFORM',
    NULL,
    NULL,
    'ACTIVE',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    'e0000000-0000-0000-0000-000000000024',
    'd0000000-0000-0000-0000-000000000024',
    'FINANCE_AUDITOR',
    'PLATFORM',
    NULL,
    NULL,
    'ACTIVE',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    'e0000000-0000-0000-0000-000000000025',
    'd0000000-0000-0000-0000-000000000025',
    'SUPPORT_LEAD',
    'PLATFORM',
    NULL,
    NULL,
    'INVITED',
    NULL
),
-- Store Staff Assignment for Vikram Joshi at The Curry Leaf Dharampeth Flagship
(
    'e0000000-0000-0000-0000-000000000031',
    'd0000000-0000-0000-0000-000000000031',
    'STORE_MANAGER',
    'STORE',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'ACTIVE',
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    status = EXCLUDED.status,
    last_login_at = EXCLUDED.last_login_at,
    updated_at = CURRENT_TIMESTAMP;

-- ==============================================================================
-- 6. Ensure ALL Staff (Platform & Store) have Consumer Reward Wallets for Mobile App
-- ==============================================================================
INSERT INTO reward_accounts (id, customer_id, points_balance, available_balance, lifetime_earned, lifetime_redeemed, status, created_at, updated_at)
SELECT gen_random_uuid(), u.id, 500, 500.00, 500.00, 0.00, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u
WHERE u.email IN (
    'riya.admin@pinak.app',
    'siddharth@pinak.app',
    'ananya.ops@pinak.app',
    'rohan.kyc@pinak.app',
    'meera.audit@pinak.app',
    'neha.support@pinak.app',
    'vikram.desk@curryleaf.in'
)
ON CONFLICT (customer_id) DO NOTHING;

-- ==============================================================================
-- Migration V17: Platform Infrastructure Baseline
-- Ensures target cities exist and Super Admin account is verified.
-- All demo/seeded merchants, stores, and offers have been removed.
-- ==============================================================================

-- 1. Ensure Target Cities Exist
INSERT INTO cities (id, name, slug, state, country, status, created_at, updated_at)
VALUES
    ('nagpur', 'Nagpur', 'nagpur', 'Maharashtra', 'India', 'ACTIVE', NOW(), NOW()),
    ('hinganghat', 'Hinganghat', 'hinganghat', 'Maharashtra', 'India', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET status = 'ACTIVE',
    updated_at = NOW();

-- 2. Ensure Super Admin User Remains Active
INSERT INTO users (
    id, email, password, name, first_name, last_name, phone, role, status,
    email_verified, mobile_verified, profile_completed, primary_city, state, created_at, updated_at
)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'riya.admin@pinak.app', '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
     'Riya Shah', 'Riya', 'Shah', '+919820000001', 'SUPER_ADMIN', 'ACTIVE', TRUE, TRUE, TRUE, 'Nagpur', 'Maharashtra', NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET status = 'ACTIVE',
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    name = EXCLUDED.name,
    updated_at = NOW();

-- 3. Discovery Curation Config Linkage (Empty baseline)
INSERT INTO discovery_curation_config (id, config_key, ranking_weights, hero_offer_id, featured_store_ids, updated_by, updated_at)
VALUES (
    'd15c0000-0000-0000-0000-000000000001',
    'GLOBAL_MOBILE_DISCOVERY',
    '{"rating": 15, "distance": 45, "popularity": 10, "discountValue": 30}'::jsonb,
    NULL,
    '[]'::jsonb,
    'SYSTEM',
    NOW()
)
ON CONFLICT (config_key) DO UPDATE
SET hero_offer_id = NULL,
    featured_store_ids = '[]'::jsonb,
    updated_at = NOW();

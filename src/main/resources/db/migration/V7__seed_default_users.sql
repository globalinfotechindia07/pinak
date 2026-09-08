-- ============================================================
-- V7: Seed default users (idempotent)
-- Passwords are BCrypt-hashed. Plain-text values:
--   superadmin@superapp.com  →  SuperAdmin@123
--   vendor@superapp.com      →  Vendor@1234
--   customer@superapp.com    →  Customer@123
-- IMPORTANT: Change these passwords immediately in production.
-- ============================================================

-- Super Admin
INSERT INTO users (id, email, name, password, first_name, last_name, role, status, email_verified)
VALUES (
    gen_random_uuid(),
    'superadmin@superapp.com',
    'Super Admin',
    '$2a$12$K5t5ETFrfDWGNnPBtMlkuOPVfEFB.I4tAR.0IVPS7wm6u2.9L7L66',
    'Super',
    'Admin',
    'SUPER_ADMIN',
    'ACTIVE',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Vendor demo account
INSERT INTO users (id, email, name, password, first_name, last_name, role, status, email_verified)
VALUES (
    gen_random_uuid(),
    'vendor@superapp.com',
    'Demo Vendor',
    '$2a$12$3kAMoU0XT8nQwKKa6EVjcuZ.9dFUCcV0Y5c6FPB3WmBqhx/Ke9CKK',
    'Demo',
    'Vendor',
    'VENDOR',
    'ACTIVE',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Customer demo account (Password: Customer@123456)
INSERT INTO users (id, email, name, password, first_name, last_name, role, status, email_verified)
VALUES (
    gen_random_uuid(),
    'customer@superapp.com',
    'Demo Customer',
    '$2a$12$2ZTpvxpcdx0kSx8vG4xMcuoj/ZuERqKcGtHCRQ7eBaR/m.EjhE29m',
    'Demo',
    'Customer',
    'CUSTOMER',
    'ACTIVE',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Admin account (Role: ADMIN, Password: Admin@123456)
INSERT INTO users (id, email, name, password, first_name, last_name, role, status, email_verified)
VALUES (
    gen_random_uuid(),
    'admin@superapp.com',
    'Platform Admin',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Platform',
    'Admin',
    'ADMIN',
    'ACTIVE',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Merchant account (Role: MERCHANT, Password: Merchant@123456)
INSERT INTO users (id, email, name, password, first_name, last_name, role, status, email_verified)
VALUES (
    gen_random_uuid(),
    'merchant@superapp.com',
    'Demo Merchant',
    '$2a$12$XCvOsW7ZfKs/vOANOizQpuM9LyBsagNj.XYvciPFarWoKZhs8Cqya',
    'Demo',
    'Merchant',
    'MERCHANT',
    'ACTIVE',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

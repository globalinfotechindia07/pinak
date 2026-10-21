-- ==============================================================================
-- V8: Master Data Seeder (Super Admin, Taxonomy Categories & Master Cities)
-- Clean production-ready baseline: NO demo merchants, stores, offers, or products.
-- ==============================================================================

-- 1. Seed Core Master User (Super Admin Only)
INSERT INTO users (
    id, email, password, first_name, last_name, name, role, status,
    email_verified, mobile_verified, profile_completed, phone,
    birthday, primary_city, state, district, pincode, address, gender,
    profile_picture_url
) VALUES
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
    '+919820000001',
    '1995-08-15',
    'Bangalore',
    'Karnataka',
    'Bengaluru Urban',
    '560038',
    '100ft Rd, Indiranagar, Bengaluru, Karnataka',
    'FEMALE',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
)
ON CONFLICT (email) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    phone = EXCLUDED.phone,
    birthday = EXCLUDED.birthday,
    primary_city = EXCLUDED.primary_city,
    state = EXCLUDED.state,
    district = EXCLUDED.district,
    pincode = EXCLUDED.pincode,
    address = EXCLUDED.address,
    gender = EXCLUDED.gender,
    profile_picture_url = EXCLUDED.profile_picture_url;

-- 2. Staff Assignments (Super Admin Only)
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
)
ON CONFLICT (id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    status = EXCLUDED.status,
    last_login_at = EXCLUDED.last_login_at,
    updated_at = CURRENT_TIMESTAMP;

-- 3. Seed Taxonomy Categories
INSERT INTO categories (id, name, slug, description, icon, display_order, status)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'Dining', 'dining', 'Restaurants, bistros, gourmet dining & buffets', 'utensils', 1, 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111102', 'Cafes', 'cafes', 'Artisan cafes, manual brews & bakeries', 'coffee', 2, 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111103', 'Supermarket', 'supermarket', 'Large supermarkets, FMCG & household staples', 'shopping-cart', 3, 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111104', 'Kirana', 'kirana', 'Local grocery stores & daily essentials', 'store', 4, 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111105', 'Fashion', 'fashion', 'Apparel, footwear & fashion accessories', 'shirt', 5, 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111106', 'Electronics', 'electronics', 'Smartphones, audio, appliances & gadgets', 'laptop', 6, 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111107', 'Hardware', 'hardware', 'Tools, paints, sanitaryware & hardware', 'wrench', 7, 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111108', 'Salons', 'salons', 'Hair styling, beauty parlors & grooming', 'scissors', 8, 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111109', 'Gyms', 'gyms', 'Fitness centers, pilates, boxing & crossfit', 'dumbbell', 9, 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111110', 'Automotive', 'automotive', 'Car care, bike servicing & detailing spas', 'car', 10, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Discovery Curation Formula
INSERT INTO discovery_curation_config (id, config_key, ranking_weights, featured_store_ids, updated_by)
VALUES (
    'd15c0000-0000-0000-0000-000000000001',
    'GLOBAL_MOBILE_DISCOVERY',
    '{"distance": 45, "discountValue": 30, "rating": 15, "popularity": 10}'::jsonb,
    '{}'::jsonb,
    'SYSTEM'
)
ON CONFLICT (config_key) DO NOTHING;

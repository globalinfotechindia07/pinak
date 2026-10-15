-- ==============================================================================
-- V8: Dedicated Master & Showcase Seeder (Single Source of Truth)
-- All UUIDs are guaranteed unique across all tables with no collisions.
-- ==============================================================================

-- 1. Seed Core Master Users (Super Admin, Merchant Owner, Demo Customer)
INSERT INTO users (
    id, email, password, first_name, last_name, name, role, status,
    email_verified, mobile_verified, profile_completed, phone, mobile,
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
    '+919820000001',
    '1995-08-15',
    'Bangalore',
    'Karnataka',
    'Bengaluru Urban',
    '560038',
    '100ft Rd, Indiranagar, Bengaluru, Karnataka',
    'FEMALE',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
),
(
    '00000000-0000-0000-0000-000000000002',
    'merchant.owner@pinak.com',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Vikram',
    'Malhotra',
    'Vikram Malhotra',
    'MERCHANT_ADMIN',
    'ACTIVE',
    TRUE,
    TRUE,
    TRUE,
    '+919820000002',
    '+919820000002',
    '1988-03-22',
    'Bangalore',
    'Karnataka',
    'Bengaluru Urban',
    '560038',
    '12th Main Rd, Indiranagar, Bangalore',
    'MALE',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
),
(
    '00000000-0000-0000-0000-000000000003',
    'customer@pinak.app',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Rahul',
    'Verma',
    'Rahul Verma',
    'CUSTOMER',
    'ACTIVE',
    TRUE,
    TRUE,
    TRUE,
    '+919820000003',
    '+919820000003',
    '1998-11-05',
    'Bangalore',
    'Karnataka',
    'Bengaluru Urban',
    '560038',
    '100ft Rd, Indiranagar, Bengaluru, Karnataka',
    'MALE',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBYWCJJ94gPHqaZZGFHU9lOwqJt2Hq8wMHW7a30v2hyRyfBbsBwV_ZRA7griNeI42eg_O8VJsbvG2d82mv2ACPz357BSE7Z114u1jd1jYTDBnVaqKAceHqpXqOWNvZrNnnyQec69sHPi0vVIXebEYNPxNTkrtvlXhqmfByC9zi-RCq1q8gi8107mHcKzsdzSkmPB6R1irz_7N3Co8FPM7XRobdy56VH59zirDqxScCBMLHldmhcimy-'
)
ON CONFLICT (email) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    phone = EXCLUDED.phone,
    mobile = EXCLUDED.mobile,
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

-- 3. Seed Consumer Reward Accounts
INSERT INTO reward_accounts (
    id, customer_id, points_balance, available_balance, pending_balance,
    lifetime_earned, lifetime_redeemed, currency, tier, status, version
) VALUES 
(
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000003',
    480,
    48.00,
    0.00,
    600.00,
    120.00,
    'INR',
    'SILVER',
    'ACTIVE',
    0
),
(
    '00000000-0000-0000-0000-000000000011',
    'd0000000-0000-0000-0000-000000000001',
    500,
    500.00,
    0.00,
    500.00,
    0.00,
    'INR',
    'GOLD',
    'ACTIVE',
    0
)
ON CONFLICT (customer_id) DO UPDATE SET
    points_balance = EXCLUDED.points_balance,
    available_balance = EXCLUDED.available_balance;

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

-- 4. Seed Master Cities
INSERT INTO cities (id, name, slug, state, country, status)
VALUES
    ('blr', 'Bengaluru', 'bengaluru', 'Karnataka', 'India', 'ACTIVE'),
    ('mum', 'Mumbai', 'mumbai', 'Maharashtra', 'India', 'ACTIVE'),
    ('del', 'Delhi NCR', 'delhi-ncr', 'Delhi', 'India', 'ACTIVE'),
    ('hyd', 'Hyderabad', 'hyderabad', 'Telangana', 'India', 'ACTIVE'),
    ('pun', 'Pune', 'pune', 'Maharashtra', 'India', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Discovery Curation Formula
INSERT INTO discovery_curation_config (id, config_key, ranking_weights, featured_store_ids, updated_by)
VALUES (
    'd15c0000-0000-0000-0000-000000000001',
    'GLOBAL_MOBILE_DISCOVERY',
    '{"distance": 45, "discountValue": 30, "rating": 15, "popularity": 10}'::jsonb,
    '{}'::jsonb,
    'SYSTEM'
)
ON CONFLICT (config_key) DO NOTHING;

-- 6. Seed Showcase Hero Banners (Weekend Super Fest)
INSERT INTO home_banners (
    id, badge_text, countdown_end_time, title, subtitle, cta_text,
    cta_action, theme_style, image_url, display_order, is_active
) VALUES
(
    'ba000000-0000-0000-0000-000000000001',
    'Weekend Super Fest',
    CURRENT_TIMESTAMP + INTERVAL '16 hours',
    'Flat 50% Cashback + 200 Extra Coins',
    'On dining, groceries, salons, electronics & more',
    'Explore Offers',
    'EXPLORE_DEALS',
    'PRIMARY_GRADIENT',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCkGR2hF8uzUYloZKOcjeG2RYE9ShGFlgBwykv483-1YSeSw05tpXtMeKUdX162SLNI7UMlaJ3YjDPoPt-CdTn9oQod1XpnEicNTg0OFeLv149RB8ry7HTO_70WkKZ_jB99t6Ka7yW7V-ZaXM0SLOoB5IBLknYGY1k8qO-R_EG8UIMdwZfCuJmIOMQYyg1PyY1h4piF6vSKKyGAmH23oNF5z9fITK67dilp-pkh0mhRXsGxh20ULIKB',
    1,
    TRUE
),
(
    'ba000000-0000-0000-0000-000000000002',
    'Dining Carnival',
    CURRENT_TIMESTAMP + INTERVAL '2 days',
    'Buy 1 Get 1 Free on Craft Brews & Gourmet Bakes',
    'Exclusive perks at Third Wave, Glen''s Bakehouse & Brik Oven.',
    'Explore Spots',
    'EXPLORE_CATEGORY',
    'SECONDARY_GRADIENT',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&q=80',
    2,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 7. Seed Verified Merchants (Brand Level)
INSERT INTO merchants (
    id, owner_user_id, business_name, legal_name, description, category_id,
    phone, email, status, approval_status, kyc_status, is_featured
) VALUES
    ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'The Smokehouse Grill', 'Smokehouse Grill Hospitality LLP', 'American steaks, smoked meats & burgers', '11111111-1111-1111-1111-111111111101', '+918041234501', 'smokehouse@pinak.com', 'ACTIVE', 'APPROVED', 'VERIFIED', FALSE),
    ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Toni & Guy Salon', 'Toni & Guy India Private Limited', 'Global hair styling & luxury wellness salon', '11111111-1111-1111-1111-111111111108', '+918041234502', 'toniguy@pinak.com', 'ACTIVE', 'APPROVED', 'VERIFIED', FALSE),
    ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Third Wave Coffee', 'Third Wave Coffee Roasters Pvt Ltd', 'Specialty artisan coffee and handcrafted brunch', '11111111-1111-1111-1111-111111111102', '+918041234503', 'thirdwave@pinak.com', 'ACTIVE', 'APPROVED', 'VERIFIED', FALSE),
    ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Toscano Trattoria', 'Toscano Food & Beverage Pvt Ltd', 'Authentic Italian fine dining, wines & pizzas', '11111111-1111-1111-1111-111111111101', '+918041234504', 'toscano@pinak.com', 'ACTIVE', 'APPROVED', 'VERIFIED', FALSE),
    ('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'Cult.Fit Pro', 'Curefit Healthcare Pvt Ltd', 'Premium fitness conditioning studio', '11111111-1111-1111-1111-111111111109', '+918041234505', 'cultfit@pinak.com', 'ACTIVE', 'APPROVED', 'VERIFIED', FALSE),
    ('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'Glen''s Bakehouse', 'Glen''s Hospitality LLP', 'Artisanal sourdough, cheesecakes and bakes', '11111111-1111-1111-1111-111111111102', '+918041234506', 'glens@pinak.com', 'ACTIVE', 'APPROVED', 'VERIFIED', FALSE),
    ('a0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'Truffles Burgers', 'Truffles Hospitality India Ltd', 'American craft burgers, shakes & steaks', '11111111-1111-1111-1111-111111111101', '+918041234507', 'truffles@pinak.com', 'ACTIVE', 'APPROVED', 'VERIFIED', FALSE),
    ('a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000002', 'Bodycraft Spa', 'Bodycraft Salon & Spa Pvt Ltd', 'Luxury spa, skin aesthetics & wellness therapy', '11111111-1111-1111-1111-111111111108', '+918041234508', 'bodycraft@pinak.com', 'ACTIVE', 'APPROVED', 'VERIFIED', FALSE),
    ('a0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000002', 'SpeedWash Auto Spa', 'SpeedWash Services LLP', 'Professional automated car wash and bike detailing', '11111111-1111-1111-1111-111111111110', '+918041234509', 'speedwash@pinak.com', 'ACTIVE', 'APPROVED', 'VERIFIED', FALSE),
    ('a0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 'BigBasket', 'Innovative Retail Concepts Private Limited', 'India''s premier online and local supermarket network', '11111111-1111-1111-1111-111111111103', '+918041234510', 'contact@bigbasket.com', 'ACTIVE', 'APPROVED', 'VERIFIED', TRUE),
    ('a0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002', 'Reliance Fresh', 'Reliance Retail Limited', 'Neighborhood fresh foods and daily supermarket staples', '11111111-1111-1111-1111-111111111103', '+918041234511', 'support@reliancefresh.com', 'ACTIVE', 'APPROVED', 'VERIFIED', TRUE),
    ('a0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002', 'Sharma Kirana Store', 'Sharma Daily Needs Enterprise', 'Trusted neighborhood kirana & daily essentials store', '11111111-1111-1111-1111-111111111104', '+918041234512', 'sharmakirana@pinak.com', 'ACTIVE', 'APPROVED', 'VERIFIED', TRUE),
    ('a0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000002', 'More Supermarket', 'More Retail Private Limited', 'Quality groceries, kitchenware, fresh produce and essentials', '11111111-1111-1111-1111-111111111103', '+918041234513', 'care@moreretail.in', 'ACTIVE', 'APPROVED', 'VERIFIED', TRUE),
    ('a0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000002', 'boAt Lifestyle', 'Imagine Marketing Limited', 'True wireless earphones, smartwatches & accessories', '11111111-1111-1111-1111-111111111106', '+918041234514', 'boat@pinak.com', 'ACTIVE', 'APPROVED', 'VERIFIED', FALSE),
    ('a0000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000002', 'Prestige Smart Kitchen', 'TTK Prestige Limited', 'Kitchen appliances, cookware sets and gas stoves', '11111111-1111-1111-1111-111111111107', '+918041234515', 'prestige@pinak.com', 'ACTIVE', 'APPROVED', 'VERIFIED', FALSE),
    ('a0000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000002', 'Campus Activewear', 'Campus Activewear Limited', 'Sports sneakers, running shoes and athleisure footwear', '11111111-1111-1111-1111-111111111105', '+918041234516', 'campus@pinak.com', 'ACTIVE', 'APPROVED', 'VERIFIED', FALSE)
ON CONFLICT (id) DO UPDATE SET
    is_featured = EXCLUDED.is_featured,
    business_name = EXCLUDED.business_name;

-- 8. Seed Physical Store Branches in Indiranagar, Bangalore
INSERT INTO stores (
    id, merchant_id, store_name, description, address_line1, address_line2,
    address, city_id, state, pincode, latitude, longitude, status, approval_status,
    rating, review_count_text, cuisine_or_category, opening_offer, image_url
) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'The Smokehouse Grill', 'Signature barbecue steaks & burgers', '100ft Rd', 'Indiranagar', '12, 100ft Rd, Indiranagar, Bangalore', 'blr', 'Karnataka', '560038', 12.9735000, 77.6425000, 'ACTIVE', 'APPROVED', 4.8, '(1.8k)', 'Barbecue & Grill', 'Flat 40% Off on Dinners', 'https://lh3.googleusercontent.com/aida-public/AB6AXuChrnSq1Yaf94yJfSJ5ur4cBX9zPgxfzaFFDsPdDhCidTKabd60P9K39f623JQ_oGlV5eiPB1fOJvpvCiApK6ms2dmLCzM0kWM-hM4syELjd460EHe4HKYxTHeKU9v_s5udHMvZbhsO7YeyXiZtWd7ZysQwu1cyKdgW-chLu0Pxq8BfiMm3e_rwX5FwNfcWIBNP6BnAwIYjFnu4UaiC3oo6P3pAkkIos5JeSEHTqIWbGSCOVYLS2_6A'),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Toni & Guy Salon', 'Elite haircuts, color & styling', '12th Main Rd', 'Indiranagar', '45, 12th Main Rd, Indiranagar, Bangalore', 'blr', 'Karnataka', '560038', 12.9752000, 77.6450000, 'ACTIVE', 'APPROVED', 4.7, '(950)', 'Salon & Styling', 'Buy 1 Get 1 Free Styling', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAehSDVlzhdQ16LCD3SUe6-wxhHUsmZUUY-JmmKUaqH4ghRz4GRc5y8SKK-KUlwsumUiEhYY5_oBm0qvi0z_25GMG_Ia1eCvVn_8hAAo0SfaqVIM6ylnv46yGbRKidvcQpsUTRzx76zmddVa4cgq7k5M1oOaDI5Inq7GIUwpYx8Qa6Fm6b6MiRi7svrYl3zVvUkBWfwCJdaynuQOq__J_hcLaWDaNmNdxHAtrpv9uoxzGBOCof7iUZB'),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Third Wave Coffee', 'Artisan manual brews and brunch', '80ft Rd', 'Indiranagar', '101, 80ft Rd, Indiranagar, Bangalore', 'blr', 'Karnataka', '560038', 12.9710000, 77.6400000, 'ACTIVE', 'APPROVED', 4.9, '(2.4k)', 'Specialty Coffee', 'Flat ₹150 Cashback', 'https://lh3.googleusercontent.com/aida-public/AB6AXuClpqS39UuLowTW3Hh-y9Tt5My-4zYZMJ3FYAg9S_V091zs2kZoz4YfYCFBZ9zbIQZj7MtacljzmCmkYPAXX3cD013fNOHUyVBehRTd5kHMDg0jUfPa3Ciy54ForaHAL0MxrnJDA1ItPq9sqMAwgYdDNxdlh0CFmQZAokEFziCj4MY3PRcK2wiwapuMQqFn9w9UUmQ5Pj5aJasCGB1Hy4UTNbEE0X9LhaIc6dZhoIMxkAgXIR6B_wtU'),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'Toscano Trattoria', 'Gourmet handmade pasta & wood-fired pizza', 'HAL 2nd Stage', 'Indiranagar', '354, 100ft Rd, Indiranagar, Bangalore', 'blr', 'Karnataka', '560038', 12.9740000, 77.6430000, 'ACTIVE', 'APPROVED', 4.8, '(1.4k)', 'Italian & Wine', '20% Off on Table Reservation', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80'),
    ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'Cult.Fit Pro', 'High-energy fitness and strength studio', '100ft Rd', 'Indiranagar', '502, 100ft Rd, Indiranagar, Bangalore', 'blr', 'Karnataka', '560038', 12.9760000, 77.6460000, 'ACTIVE', 'APPROVED', 4.9, '(2.1k)', 'Fitness & Boxing', '3-Day Pass + 25% Off', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAPF7nqQbm0sCbVW2LHPauye1ipsfVDS4mWNvDclJS_1YTH56g-pAlUbVg8eVHveT2czNkeEssn0ylzRKh2lE0yRBQKdBkZZY7WtDU-5Aio_DW5qhmx27ndpkUmFQqDylI7CACtvC0lkrBDKqce6hWHTmWfl265XymEkX1IZBlOUIeSIom5CY2IrVNLETtJgsiPLA-ThyJRE211fiVvYgtLnZo4ab5P8UqFQI64v_JBZoRBl7iZBEh'),
    ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006', 'Glen''s Bakehouse', 'Artisanal cakes, pastries & sourdough', 'Lavelle Rd', 'Indiranagar', '24, 2nd Main Rd, Indiranagar, Bangalore', 'blr', 'Karnataka', '560038', 12.9780000, 77.6475000, 'ACTIVE', 'APPROVED', 4.7, '(3.8k)', 'Bakery & Desserts', 'Free Cupcake on ₹300+', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80'),
    ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000007', 'Truffles Burgers', 'Legendary American burgers and shakes', 'Koramangala/Indiranagar', 'Indiranagar', '80ft Rd, HAL 3rd Stage, Indiranagar, Bangalore', 'blr', 'Karnataka', '560038', 12.9690000, 77.6390000, 'ACTIVE', 'APPROVED', 4.7, '(4.2k)', 'Burgers & Shakes', 'Flat 25% OFF', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcQ6yo-UlptTXMC1ZgJc7hzg7i2kJi0aq51wlapezX3go7pXLpHBd2K9ID3IlqNyKHpUVeQJwwZi0CyX2y88MhTwn91rZBqSlvs1ohhREGDsl9A0wTmG-Mn944GPpAkIiTBRZHTN-7xpZzfJlfsvCfx6i_H_ogkun3JgU5gv-Xf0gndDNOPPpxiZWaZqpYGhR1ZFNCmz-1ekyF9Dj7hhEEAZ4hM_9P5a8XAkZbItSGLuNmq3paGSf8'),
    ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000008', 'Bodycraft Spa', 'Luxury spa therapy and rejuvenation', '12th Main', 'Indiranagar', '12th Main Rd, Indiranagar, Bangalore', 'blr', 'Karnataka', '560038', 12.9810000, 77.6490000, 'ACTIVE', 'APPROVED', 4.8, '(1.6k)', 'Salon & Wellness', 'Flat 30% Off Mon-Thu', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfT45o6_G73TaXK_SHKiFckXQlmqa39zYZirk-zH-YMAN_sJLP5kWGJnJsgwX6jI3n_Yg75yIA1U4RqnO7s1KLF4bWr0-xrQyHoAGV4LZZTshdZGJ_EcSHZG7oQXzDB9G2bJXoE4JZ3KyOhsk6ihz9JwnXOwp7EyEd65us_X9RyfAZmLAcVaiZlDcO75PfGKC3zL0_hg0-kJB1Y5i-v6LGfOgVtfzB742B8je0OiAolc6PDUAZHRC7'),
    ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000009', 'SpeedWash Auto Spa', 'High-pressure foam wash and ceramic coating', 'HAL 2nd Stage', 'Indiranagar', '18, 100ft Rd, Indiranagar, Bangalore', 'blr', 'Karnataka', '560038', 12.9730000, 77.6410000, 'ACTIVE', 'APPROVED', 4.6, '(850)', 'Auto Spa & Care', 'Free Wax Coat on Full Wash', 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=500&q=80'),
    ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000010', 'BigBasket Store', 'Supermarket & Groceries', '100ft Rd', 'Indiranagar', '100ft Rd, Indiranagar, Bangalore', 'blr', 'Karnataka', '560038', 12.9725000, 77.6420000, 'ACTIVE', 'APPROVED', 4.6, '(4.5k)', 'Supermarket', '10% off on select items', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpywPVartWEpSPnrIqJ1fh271avfu6p7sqwKBxw3XBO_XZVFOrecXycpjLxoKWgLURGtfURISdqZldiRMsfNWNjiEGrdOxsnV9AUV8gLIB2giL2oXuL2lvzqEtpAWgK2gpPvUjNuz-hIC617u_1JLe65ZjEhCwKHSZSGqaA3655Cnw2cW8v6ZptHiJhETagFmz92tlrfQ_QnLwt6ax9cdOq8ALs-kbrCFP9MXzRpHqxsPtyJqUbcYn'),
    ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000011', 'Reliance Fresh', 'Supermarket & Fresh Produce', 'CMH Road', 'Indiranagar', 'CMH Road, Indiranagar, Bangalore', 'blr', 'Karnataka', '560038', 12.9790000, 77.6440000, 'ACTIVE', 'APPROVED', 4.4, '(3.8k)', 'Supermarket', 'Flat ₹100 off on ₹1,000+', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCO5gXpRpjf8te01togUL-QPKYmCCQR71RnYMfy9GTE5Fd7MS4J1ZCiBy9ANigvj8tSWYe_rDg113vvdk7_kIPfeRjFypYicZ4D7JbNrw0uQJ9vidqFXPQoS0kmv6QNlNZiiSxnMn475kBBcV55qLV6ObkKUEq-ll_Xr1Mj47HSQaG1WlZh4iU8wcYhhdlE4og04O0iW_noithDS6cmsWUWlAzsyyPSkFf7-grB6uVCwc9j-qK-nvin'),
    ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000012', 'Sharma Kirana Store', 'Kirana & Daily Needs', '12th Main', 'Indiranagar', '12th Main, Indiranagar, Bangalore', 'blr', 'Karnataka', '560038', 12.9745000, 77.6445000, 'ACTIVE', 'APPROVED', 4.5, '(1.9k)', 'Kirana & Daily Needs', 'Free delivery above ₹299', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAY5mmetrbn8RyNFJem02htY14un3y2sTrwETInC-zBXecoT0uMNmktEE2eMtjDBn1C0qbUYBsqdTYKhwy2taVrUWzH40IvG6f5Ie68eUfgrhjs4JfY6gdh199RSbCQP79r_BCiGR0HKDpKvksLp-Z4a7vtHkqPKBSb_OqXXKLK_p_783yGo-dlGgSgYlE0ynS6pHfb5_-gIh_RDQe5pcvwMzllgxTqtAi-G-FEYoc3V9SwWXiUoG5O'),
    ('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000013', 'More Supermarket', 'Supermarket & Groceries', 'Old Airport Rd', 'Indiranagar', 'Old Airport Rd, Indiranagar, Bangalore', 'blr', 'Karnataka', '560038', 12.9650000, 77.6480000, 'ACTIVE', 'APPROVED', 4.3, '(2.8k)', 'Supermarket', 'Up to 20% off', 'https://lh3.googleusercontent.com/aida-public/AB6AXuANYyKD7SnBu1JTaFAPSa6XnxWAZDVFZoLpeEKcjj3tdXQoyCzuuiWJj7INQSTeLK8fsWArMDPHN4d6i97-G2CasE1ufVtrBKW7MfDoRJtPWhyQQvi2JR8hklyw-wrLP7oesvK37V_M-kzV5HpV5zV16wdRcH46bRnHzSoTAWaD8_fr50wooKq1hko3H1hMZil584XQam6XP5cXRTRKIb4DojxpA7aM0A9anaEffgdlwHfTaw9f7aVW'),
    ('b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000014', 'boAt Lifestyle Store', 'Electronics & Audio Experience Store', '100ft Rd', 'Indiranagar', '100ft Rd, Indiranagar, Bangalore', 'blr', 'Karnataka', '560038', 12.9730000, 77.6430000, 'ACTIVE', 'APPROVED', 4.7, '(3.1k)', 'Electronics', 'Flat 40% Off on Headphones', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBone4Rlp_687WxFKSp7G1F8zEQpIjfBYEwolwDrM2GRTUO9Yx7EV80BzNh1fvURcV7hwnKJQx2-1NMrHUVU_2SryC15cgJnWLOvwWXU7Ijfc6a3ndVO7VHN8nn8WuYFMCB4SEl35q_OSbXamRpng3p4kqKZ8QdFwWMbyAzfutb9326yi-LY4PiZLN0g4jOzhjAgnlq6-t4IEZNM4Svsb_VpeouWOxOA0BInFE-Wcus-qqkR7v4NA9U'),
    ('b0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000015', 'Prestige Smart Kitchen', 'Kitchenware & Cookware', '80ft Rd', 'Indiranagar', '80ft Rd, Indiranagar, Bangalore', 'blr', 'Karnataka', '560038', 12.9720000, 77.6410000, 'ACTIVE', 'APPROVED', 4.6, '(2.2k)', 'Hardware & Kitchen', 'Flat 50% Off Flash Deal', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJngDcoXZVelf4U2TKVqtssmHPI4mBBK4UM3nFApzoFDWGSinmeshlU1VoxMRoqBZDBOciuQs0oWNZig80E5v1-n5Vtcj27ueTtoHu35fwcyGIankEHnN4ly_HXDMRxg_b2rKl-X3KjZaAbpYk_ciq-ESC3z27ub_VKehSZPsiZtpYpOljueq1FtS75Oq5moJ0cWskovmLZdCRDSnUXKV8KI4_JkxLsgEJSQbxkxktviKlZ3Z_-tJ1'),
    ('b0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000016', 'Campus Activewear Store', 'Footwear & Athleisure', 'CMH Rd', 'Indiranagar', 'CMH Rd, Indiranagar, Bangalore', 'blr', 'Karnataka', '560038', 12.9770000, 77.6450000, 'ACTIVE', 'APPROVED', 4.5, '(1.7k)', 'Fashion & Footwear', 'Flat 35% Off Flash Deal', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCes1-_AkPP-2gstYY3c2SOglKbNDMCrPM70HXEUiL62UzqMt3gxO_HeE1Ti89JYSDg2W5uZd2v94JLatuqCZhnpz4L1r_T3xrfaLpw-I2RcMGZQjJPAKh0DQxdpXyeqiF1OsK5Thb9FyS-dl54vv97GLnhXs9nNq_S3cyVw2FbVNbYk7NpqlAcPfOJBjtedEHCO3-4weKD8qFuNnvx4qoPLuRAeZqnTyZ9jj3T8WSrgyuThkjSVWKm')
ON CONFLICT (id) DO NOTHING;

-- 9. Seed Service Offers & Recommendations
INSERT INTO offers (
    id, merchant_id, store_id, category_id, title, description, type, value,
    min_transaction_amount, max_discount_amount, valid_from, valid_to,
    status, approval_status, bonus_coins, badge_text, recommendation_reason,
    estimated_savings, image_url, offer_scope, is_flash, remaining_quantity,
    cta_text, original_mrp, flash_selling_price
) VALUES
    (
        'c0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111101',
        'FLAT 40% OFF',
        'Up to ₹500 • On bills above ₹1,000',
        'PERCENTAGE_DISCOUNT',
        40.00,
        1000.00,
        500.00,
        CURRENT_TIMESTAMP - INTERVAL '1 day',
        CURRENT_TIMESTAMP + INTERVAL '30 days',
        'ACTIVE',
        'APPROVED',
        150,
        '45m left',
        'Top trending grill nearby',
        400.00,
        'https://lh3.googleusercontent.com/aida-public/AB6AXuChrnSq1Yaf94yJfSJ5ur4cBX9zPgxfzaFFDsPdDhCidTKabd60P9K39f623JQ_oGlV5eiPB1fOJvpvCiApK6ms2dmLCzM0kWM-hM4syELjd460EHe4HKYxTHeKU9v_s5udHMvZbhsO7YeyXiZtWd7ZysQwu1cyKdgW-chLu0Pxq8BfiMm3e_rwX5FwNfcWIBNP6BnAwIYjFnu4UaiC3oo6P3pAkkIos5JeSEHTqIWbGSCOVYLS2_6A',
        'SERVICE',
        FALSE,
        100,
        'Book & Pay',
        NULL,
        NULL
    ),
    (
        'c0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000002',
        'b0000000-0000-0000-0000-000000000002',
        '11111111-1111-1111-1111-111111111108',
        'BUY 1 GET 1 FREE',
        'On all hair styling, cuts & blowouts',
        'FIXED_DISCOUNT',
        500.00,
        800.00,
        500.00,
        CURRENT_TIMESTAMP - INTERVAL '1 day',
        CURRENT_TIMESTAMP + INTERVAL '30 days',
        'ACTIVE',
        'APPROVED',
        0,
        'Till Sun',
        'Trending salon service',
        500.00,
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAehSDVlzhdQ16LCD3SUe6-wxhHUsmZUUY-JmmKUaqH4ghRz4GRc5y8SKK-KUlwsumUiEhYY5_oBm0qvi0z_25GMG_Ia1eCvVn_8hAAo0SfaqVIM6ylnv46yGbRKidvcQpsUTRzx76zmddVa4cgq7k5M1oOaDI5Inq7GIUwpYx8Qa6Fm6b6MiRi7svrYl3zVvUkBWfwCJdaynuQOq__J_hcLaWDaNmNdxHAtrpv9uoxzGBOCof7iUZB',
        'SERVICE',
        FALSE,
        50,
        'Claim Offer',
        NULL,
        NULL
    ),
    (
        'c0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000003',
        'b0000000-0000-0000-0000-000000000003',
        '11111111-1111-1111-1111-111111111102',
        'FLAT ₹150 CASHBACK',
        '+ 2X Coins on PINAK UPI scan',
        'CASHBACK',
        150.00,
        400.00,
        150.00,
        CURRENT_TIMESTAMP - INTERVAL '1 day',
        CURRENT_TIMESTAMP + INTERVAL '30 days',
        'ACTIVE',
        'APPROVED',
        100,
        'Instant',
        'Instant cashback on QR',
        150.00,
        'https://lh3.googleusercontent.com/aida-public/AB6AXuClpqS39UuLowTW3Hh-y9Tt5My-4zYZMJ3FYAg9S_V091zs2kZoz4YfYCFBZ9zbIQZj7MtacljzmCmkYPAXX3cD013fNOHUyVBehRTd5kHMDg0jUfPa3Ciy54ForaHAL0MxrnJDA1ItPq9sqMAwgYdDNxdlh0CFmQZAokEFziCj4MY3PRcK2wiwapuMQqFn9w9UUmQ5Pj5aJasCGB1Hy4UTNbEE0X9LhaIc6dZhoIMxkAgXIR6B_wtU',
        'SERVICE',
        FALSE,
        200,
        'Claim Offer',
        NULL,
        NULL
    ),
    (
        'c0000000-0000-0000-0000-000000000004',
        'a0000000-0000-0000-0000-000000000007',
        'b0000000-0000-0000-0000-000000000007',
        '11111111-1111-1111-1111-111111111101',
        'Flat 25% OFF',
        'Burgers & Shakes combo special',
        'PERCENTAGE_DISCOUNT',
        25.00,
        350.00,
        150.00,
        CURRENT_TIMESTAMP - INTERVAL '1 day',
        CURRENT_TIMESTAMP + INTERVAL '30 days',
        'ACTIVE',
        'APPROVED',
        80,
        'Based on your dining visits',
        'Based on your dining visits',
        120.00,
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAcQ6yo-UlptTXMC1ZgJc7hzg7i2kJi0aq51wlapezX3go7pXLpHBd2K9ID3IlqNyKHpUVeQJwwZi0CyX2y88MhTwn91rZBqSlvs1ohhREGDsl9A0wTmG-Mn944GPpAkIiTBRZHTN-7xpZzfJlfsvCfx6i_H_ogkun3JgU5gv-Xf0gndDNOPPpxiZWaZqpYGhR1ZFNCmz-1ekyF9Dj7hhEEAZ4hM_9P5a8XAkZbItSGLuNmq3paGSf8',
        'SERVICE',
        FALSE,
        150,
        'Claim Offer',
        NULL,
        NULL
    ),
    (
        'c0000000-0000-0000-0000-000000000005',
        'a0000000-0000-0000-0000-000000000005',
        'b0000000-0000-0000-0000-000000000005',
        '11111111-1111-1111-1111-111111111109',
        '3-Day Pass + 25% Off',
        'Unlimited access to gym and workout sessions',
        'PERCENTAGE_DISCOUNT',
        25.00,
        1200.00,
        500.00,
        CURRENT_TIMESTAMP - INTERVAL '1 day',
        CURRENT_TIMESTAMP + INTERVAL '30 days',
        'ACTIVE',
        'APPROVED',
        120,
        'Trending near you',
        'Trending near you',
        300.00,
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCAPF7nqQbm0sCbVW2LHPauye1ipsfVDS4mWNvDclJS_1YTH56g-pAlUbVg8eVHveT2czNkeEssn0ylzRKh2lE0yRBQKdBkZZY7WtDU-5Aio_DW5qhmx27ndpkUmFQqDylI7CACtvC0lkrBDKqce6hWHTmWfl265XymEkX1IZBlOUIeSIom5CY2IrVNLETtJgsiPLA-ThyJRE211fiVvYgtLnZo4ab5P8UqFQI64v_JBZoRBl7iZBEh',
        'SERVICE',
        FALSE,
        50,
        'Claim Pass',
        NULL,
        NULL
    ),
    (
        'c0000000-0000-0000-0000-000000000006',
        'a0000000-0000-0000-0000-000000000008',
        'b0000000-0000-0000-0000-000000000008',
        '11111111-1111-1111-1111-111111111108',
        'Flat 30% Off Mon-Thu',
        'Luxury relaxation and wellness retreat',
        'PERCENTAGE_DISCOUNT',
        30.00,
        1500.00,
        800.00,
        CURRENT_TIMESTAMP - INTERVAL '1 day',
        CURRENT_TIMESTAMP + INTERVAL '30 days',
        'ACTIVE',
        'APPROVED',
        250,
        'Similar to your interests',
        'Similar to your interests',
        600.00,
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCfT45o6_G73TaXK_SHKiFckXQlmqa39zYZirk-zH-YMAN_sJLP5kWGJnJsgwX6jI3n_Yg75yIA1U4RqnO7s1KLF4bWr0-xrQyHoAGV4LZZTshdZGJ_EcSHZG7oQXzDB9G2bJXoE4JZ3KyOhsk6ihz9JwnXOwp7EyEd65us_X9RyfAZmLAcVaiZlDcO75PfGKC3zL0_hg0-kJB1Y5i-v6LGfOgVtfzB742B8je0OiAolc6PDUAZHRC7',
        'SERVICE',
        FALSE,
        40,
        'Book Now',
        NULL,
        NULL
    ),
    -- Flash Deals (Section 11)
    (
        'c0000000-0000-0000-0000-000000000021',
        'a0000000-0000-0000-0000-000000000010',
        'b0000000-0000-0000-0000-000000000010',
        '11111111-1111-1111-1111-111111111103',
        'India Gate Rice 5kg',
        'Premium Aged Rozana Basmati Rice 5kg Saver Pack',
        'PERCENTAGE_DISCOUNT',
        45.00,
        500.00,
        450.00,
        CURRENT_TIMESTAMP - INTERVAL '1 hour',
        CURRENT_TIMESTAMP + INTERVAL '4 hours 32 minutes',
        'ACTIVE',
        'APPROVED',
        100,
        '45% OFF',
        'Flash Sale ending soon',
        450.00,
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC_RQ-V8jmArWx0IQcdX5-uoFOjRCOUpLuH3vO_bMjfoZ-Gn1tAskkUp_QpZGxIodLOthsX7qfSyaTPZKpZ3MdiLV3y4wIQaU2iOnFujqAfCSXqe-ZmtsxzrUSdmhvu4-GNOxP7GTGmCa4Lm2u_tUp4qPh_gBevEYE4KGsuNbCNWnvlmeetS2JiESJ2gyxyhuWUbEKy2ljLUCj9wWdrP-ke9zlE1-5s1hgzZ9xfCaBrHRwbWwZm1FYf',
        'FLASH',
        TRUE,
        25,
        'Grab Deal',
        990.00,
        540.00
    ),
    (
        'c0000000-0000-0000-0000-000000000022',
        'a0000000-0000-0000-0000-000000000014',
        'b0000000-0000-0000-0000-000000000014',
        '11111111-1111-1111-1111-111111111106',
        'boAt Headphones',
        'Wireless Bluetooth On-Ear Headphones with 40H Playtime',
        'PERCENTAGE_DISCOUNT',
        40.00,
        1000.00,
        800.00,
        CURRENT_TIMESTAMP - INTERVAL '1 hour',
        CURRENT_TIMESTAMP + INTERVAL '4 hours 32 minutes',
        'ACTIVE',
        'APPROVED',
        150,
        '40% OFF',
        'Flash Sale ending soon',
        800.00,
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBone4Rlp_687WxFKSp7G1F8zEQpIjfBYEwolwDrM2GRTUO9Yx7EV80BzNh1fvURcV7hwnKJQx2-1NMrHUVU_2SryC15cgJnWLOvwWXU7Ijfc6a3ndVO7VHN8nn8WuYFMCB4SEl35q_OSbXamRpng3p4kqKZ8QdFwWMbyAzfutb9326yi-LY4PiZLN0g4jOzhjAgnlq6-t4IEZNM4Svsb_VpeouWOxOA0BInFE-Wcus-qqkR7v4NA9U',
        'FLASH',
        TRUE,
        18,
        'Grab Deal',
        1999.00,
        1199.00
    ),
    (
        'c0000000-0000-0000-0000-000000000023',
        'a0000000-0000-0000-0000-000000000015',
        'b0000000-0000-0000-0000-000000000015',
        '11111111-1111-1111-1111-111111111107',
        'Prestige Cookware',
        'Hard Anodized Non-Stick Induction Base Frying Pan Set',
        'PERCENTAGE_DISCOUNT',
        50.00,
        800.00,
        1000.00,
        CURRENT_TIMESTAMP - INTERVAL '1 hour',
        CURRENT_TIMESTAMP + INTERVAL '4 hours 32 minutes',
        'ACTIVE',
        'APPROVED',
        120,
        '50% OFF',
        'Flash Sale ending soon',
        1000.00,
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBJngDcoXZVelf4U2TKVqtssmHPI4mBBK4UM3nFApzoFDWGSinmeshlU1VoxMRoqBZDBOciuQs0oWNZig80E5v1-n5Vtcj27ueTtoHu35fwcyGIankEHnN4ly_HXDMRxg_b2rKl-X3KjZaAbpYk_ciq-ESC3z27ub_VKehSZPsiZtpYpOljueq1FtS75Oq5moJ0cWskovmLZdCRDSnUXKV8KI4_JkxLsgEJSQbxkxktviKlZ3Z_-tJ1',
        'FLASH',
        TRUE,
        14,
        'Grab Deal',
        1999.00,
        999.00
    ),
    (
        'c0000000-0000-0000-0000-000000000024',
        'a0000000-0000-0000-0000-000000000016',
        'b0000000-0000-0000-0000-000000000016',
        '11111111-1111-1111-1111-111111111105',
        'Campus Sneakers',
        'Men Active Running Lifestyle Sneakers',
        'PERCENTAGE_DISCOUNT',
        35.00,
        1000.00,
        700.00,
        CURRENT_TIMESTAMP - INTERVAL '1 hour',
        CURRENT_TIMESTAMP + INTERVAL '4 hours 32 minutes',
        'ACTIVE',
        'APPROVED',
        90,
        '35% OFF',
        'Flash Sale ending soon',
        700.00,
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCes1-_AkPP-2gstYY3c2SOglKbNDMCrPM70HXEUiL62UzqMt3gxO_HeE1Ti89JYSDg2W5uZd2v94JLatuqCZhnpz4L1r_T3xrfaLpw-I2RcMGZQjJPAKh0DQxdpXyeqiF1OsK5Thb9FyS-dl54vv97GLnhXs9nNq_S3cyVw2FbVNbYk7NpqlAcPfOJBjtedEHCO3-4weKD8qFuNnvx4qoPLuRAeZqnTyZ9jj3T8WSrgyuThkjSVWKm',
        'FLASH',
        TRUE,
        20,
        'Grab Deal',
        1999.00,
        1299.00
    )
ON CONFLICT (id) DO NOTHING;

-- 10. Seed Retail Products (Section 08 Top Product Deals)
INSERT INTO products (
    id, merchant_id, store_id, category_id, name, brand, unit,
    description, image_url, mrp, selling_price, discount_percent,
    currency, stock_quantity, in_stock, is_active
) VALUES
    (
        'd0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000010',
        'b0000000-0000-0000-0000-000000000010',
        '11111111-1111-1111-1111-111111111103',
        'Amul Fresh Milk',
        'Amul',
        '1 Litre',
        'Pasteurized homogenized toned milk packed with natural nutrients',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDs3waAQbgzW6ulcWgCbnSxbpZN_13ZJXWzm4X2qAl0vMuum2WR04QFvNkO8dtZdx7jm6Hx-4Yv-UOTJvm_T1_zP-BjcNgu-n36fI1NJbiNiDN6iATJvnTI3PZFH9s3mrPOOkbC6anaq1aeOnanPe9Jc7mJ3mhPvignPOty3w2-rM7g19DmmRog4WK1HSwTg6I3iNANpsvacjgVB8XlD2SaJ5lauRM86etGCZnk70_yZwEM-f1ui0Vd',
        65.00,
        52.00,
        20,
        'INR',
        150,
        TRUE,
        TRUE
    ),
    (
        'd0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000011',
        'b0000000-0000-0000-0000-000000000011',
        '11111111-1111-1111-1111-111111111103',
        'India Gate Basmati Rice',
        'India Gate',
        '5 kg',
        'Aged long grain aromatic premium basmati rice',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAz3pTi8RkZpVw-Mr8tM5TAVW9Dl52lt8OT816AYoIq9TJciz5RZiVqam6VcVx6sW0eHkx1AIsMU_2cJQnOVUCV_IsPb5ebrpge7RJgrt7_UolSuNwhci2MERrxPmWqzsSDf9lIz1ejVVwqN1p2Tqt7z2H8zJcBLccInJxlWFHuXUO9pdnl62dGbzHOHafQcu5_8dty0RVNA6-oxEzRekQ_W5lhkTuggAod0xEPnSZqWT2hebkFAl3V',
        600.00,
        540.00,
        10,
        'INR',
        80,
        TRUE,
        TRUE
    ),
    (
        'd0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000012',
        'b0000000-0000-0000-0000-000000000012',
        '11111111-1111-1111-1111-111111111104',
        'Maggi 2-Min Noodles',
        'Nestle',
        '70 g',
        'Delicious instant masala noodles packed with favorite spices',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD85STcU1nutJDJ0krl4bTkoIPmaJ4PD8EjDXxLt-3Wn97ov26ZRK_SgQz8XHHhygaSlXOwxm0aLDFgmOu9U2WwN_95PeXogGINTBsN7dXzUQy2oBGxucmNu9hQEbQmEHzwp5jNKXMetSnvoYnYlLJefb5wPnXog5WI-ZbK496lXs2rlF6L_D7_gM36Sat4HKXCWbX4zLOgCJftTO1Y9PBzQcX7uXfvPaYD0tsmT6Klx91ng021rARr',
        32.00,
        28.00,
        12,
        'INR',
        300,
        TRUE,
        TRUE
    ),
    (
        'd0000000-0000-0000-0000-000000000004',
        'a0000000-0000-0000-0000-000000000013',
        'b0000000-0000-0000-0000-000000000013',
        '11111111-1111-1111-1111-111111111103',
        'Dettol Handwash',
        'Dettol',
        '200 ml',
        'Germ protection liquid handwash pump bottle with skin moisturizer',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCT4YsSGn2-d3Ilg8GHUkjkbinPLHR9X7q1_ktSZMPpciUeZoEQEfzw0LYfSquH_5RyfBDIkaosS0Je6owvBIo-sDrn7OO0OBVdhRUVGkPxJJ0k1ju-EDmtXI5ajKvspfNIgdQctKkkZbXNRLJGJcSayNJgveLO7508KddEnkITFslKiMq3BsawnrhljZliemhFYYh4ImVZE-DuRIrI932ZwijmQEMqdv9LeTOwdA4KGdN488AuFMeH',
        140.00,
        98.00,
        30,
        'INR',
        120,
        TRUE,
        TRUE
    ),
    (
        'd0000000-0000-0000-0000-000000000005',
        'a0000000-0000-0000-0000-000000000015',
        'b0000000-0000-0000-0000-000000000015',
        '11111111-1111-1111-1111-111111111107',
        'Stanley Hammer',
        'Stanley',
        '500 g',
        'Fiberglass curved claw hammer with anti-slip ergonomic grip',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBdLPvNB0gngUt-ujV1sfzj6KGKpuoYJ5Zy68KjG0y1lOvGHx8a_FqXWold9KzYAkdgq4NHXMBc8sSqBiejzd4WpS-SB76zcwbkGXEq9Pe3ntKM4Vmo1XR8LZLgVbm9JfSa7-E-lEf0xB2X--imbz0tIZH0LMxoQ654s5_py6rGYrbv2tE5lRD-qpawWz8Qd3Tv6xjcd2VcEeGziNoRZ-Xyfjp6WeLK6bRSxWanjCq5stC_t_0Cb6kM',
        400.00,
        340.00,
        15,
        'INR',
        45,
        TRUE,
        TRUE
    )
ON CONFLICT (id) DO NOTHING;

-- 11. Seed Popular Collections (Section 08)
INSERT INTO popular_collections (
    id, title, subtitle, cover_image_url, badge_text, display_order, target_type, target_id, is_active
) VALUES
    ('e0000000-0000-0000-0000-000000000001', 'Daily Essentials', 'Milk, rice, atta & groceries', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwxb4yoTp4inhUWFPhjwcnRfvvIvCK3cfYo6negPLVw08cXTpofVKfVJTNdXMXKB3gvaN8Ld078C_KzuKN9YL5tYjKGwGYJR_MB3-g-pP98ykHC3UBZwu-4dSWW2LWj-npi0uRWjAP125xZp2qujzZtQIs5vmWaln5h5mMtDSaTH5ljgFB0ZvwU1gOWDtI-v38Z9U6HDZBiDW7TPAbxUMdwwc5etY3O-nX8pWbiSDC2PqMfBH8usZB', 'Up to 30% OFF', 1, 'CATEGORY', '11111111-1111-1111-1111-111111111103', TRUE),
    ('e0000000-0000-0000-0000-000000000002', 'Electronics', 'Headphones, gadgets & wearables', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOll9WS5xUfdM-yrgAc2B4Az4D7jkYerus-hpZK4YlNUNUf72BEPcygvJXJzgBx8-2yV8HMnOjAUuzV1mKU4zuMx-mXBoXOYDFSriEYjKmgymG2PR0mNbL2Iy_d0SDXtk7jKlMP4S_h8Z-hDw3Hn5pxlzAerft01DRI_z6i9kJTemPrJbGFva2WEbyNDx2qZcEum_iHTp9mIbjx94VlImGJU87Sto0xDJe6job274CVdNQj9ISdtSw', 'Up to 40% OFF', 2, 'CATEGORY', '11111111-1111-1111-1111-111111111106', TRUE),
    ('e0000000-0000-0000-0000-000000000003', 'Home Improvement', 'Tools, cookware & home decor', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEtIx1LS4u6yGZjzaAqAwj9bNwLb4SdP75-Qt9BimkyRY5yPEutmP3A1f7SlokzQ5C-P8yekwfNeZeJ0dxA68rI4paBJmBES02IN8wEv1a8t9xCJoGSfChiT8_X6D3TdQXdikmTcbnIRaO9wBn3LdUBM_ZFPewpVC8hJIzfG0yDWBO7sgyr2mB7pAOOE_DgKXk3pwZxEve4g7yTJnFa4oXF4Ms2gH8pEK8xn8qeFLtlPFTVEMULJps', 'Up to 35% OFF', 3, 'CATEGORY', '11111111-1111-1111-1111-111111111107', TRUE),
    ('e0000000-0000-0000-0000-000000000004', 'Beauty & Personal Care', 'Skincare, hair styling & wellness', 'https://lh3.googleusercontent.com/aida-public/AB6AXuATlCB8kaxPq9Wafj44_s5MRlvBBXGoQPESbWL7C8fpha-4HDZmtLnvQM2TqrKRhbTHGf4gDHacSHA0e5oiloLLsMmGSWZDJmx_uToVgCpwntV1CsqPkUBNtHsx5ALQ2-tnW_7vKge_E0YsN-FjXaWftEqtZkkPeDznL08KFbRFwYX42izuPu0169SromBUmFCCAnbMoodH2ku6lNQPh9bg3R-Y3HGdQojcPp4_7oBVAVqTECN5e-8W', 'Up to 50% OFF', 4, 'CATEGORY', '11111111-1111-1111-1111-111111111108', TRUE),
    ('e0000000-0000-0000-0000-000000000005', 'Fashion Essentials', 'Sneakers, tees & apparel', 'https://lh3.googleusercontent.com/aida-public/AB6AXuARMKpFU8w-tvWbP0Jazv5wM-tNHQtiopId5phzFjpzrl2ZtJ8sEbmMEe9nSYbN_smZ0-GAAnp4psfuE7X0h5k2SVrQ2-erF7qMIcBTgu17qnx0hVKCppsHXRLZW6xDNH-d1kLPvfroyW-h043OWiU7hhcdGgry4OQobIUHPIXPb_4Wevg9-_lG4qZCLnpKXwFNy5SPC9hVPOJ94vSoXIfTxZFlD0Q7PtmiW3h7hRdNkXaJbmMyw9jW', 'Up to 60% OFF', 5, 'CATEGORY', '11111111-1111-1111-1111-111111111105', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 12. Seed Platform Trust Badges & Benefits ("Why Shop on PINAK?")
INSERT INTO discover_benefits (
    id, title, subtitle, icon_name, display_order, is_active
) VALUES
    ('f0000000-0000-0000-0000-000000000001', 'Verified Stores', 'Only trusted partners', 'shield-check', 1, TRUE),
    ('f0000000-0000-0000-0000-000000000002', 'Earn PINAK Coins', 'On every purchase', 'coins', 2, TRUE),
    ('f0000000-0000-0000-0000-000000000003', 'Exclusive Offers', 'Local deals & discounts', 'percent', 3, TRUE),
    ('f0000000-0000-0000-0000-000000000004', 'Fast & Easy Payments', 'UPI, Cards & Wallets', 'credit-card', 4, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 13. Seed User Recently Viewed Items
INSERT INTO user_recently_viewed (
    id, user_id, item_type, item_id, branch_id, viewed_at
) VALUES
    ('fe000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'PRODUCT', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000010', CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
    ('fe000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'PRODUCT', 'd0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000012', CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
    ('fe000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'PRODUCT', 'd0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000013', CURRENT_TIMESTAMP - INTERVAL '25 minutes'),
    ('fe000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'PRODUCT', 'd0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000015', CURRENT_TIMESTAMP - INTERVAL '35 minutes'),
    ('fe000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 'PRODUCT', 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000011', CURRENT_TIMESTAMP - INTERVAL '45 minutes')
ON CONFLICT (id) DO NOTHING;

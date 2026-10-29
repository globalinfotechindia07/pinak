-- ==============================================================================
-- Migration V17: Production Seeding for Merchants, Outlets, Wallets, and Offers
-- Provides ready-to-use production data for Haldiram's, Fabindia, and Apollo Pharmacy
-- ==============================================================================

-- 1. Ensure Target Cities Exist
INSERT INTO cities (id, name, slug, state, country, status, created_at, updated_at)
VALUES
    ('nagpur', 'Nagpur', 'nagpur', 'Maharashtra', 'India', 'ACTIVE', NOW(), NOW()),
    ('hinganghat', 'Hinganghat', 'hinganghat', 'Maharashtra', 'India', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET status = 'ACTIVE',
    updated_at = NOW();

-- 2. Seed / Update Essential Platform & Merchant Users
-- Password for all seeded users is set to standard bcrypt hash (matches local demo & test login)
INSERT INTO users (
    id, email, password, name, first_name, last_name, phone, role, status,
    email_verified, mobile_verified, profile_completed, primary_city, state, created_at, updated_at
)
VALUES
    -- Super Admin
    ('d0000000-0000-0000-0000-000000000001', 'riya.admin@pinak.app', '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
     'Riya Shah', 'Riya', 'Shah', '+919820000001', 'SUPER_ADMIN', 'ACTIVE', TRUE, TRUE, TRUE, 'Nagpur', 'Maharashtra', NOW(), NOW()),

    -- Haldiram's Owner
    ('90bbc85f-7661-4a38-88ce-0bd72acc5e61', 'rohanitu@gmail.com', '$2a$12$P1j/nIqyPRzzH8A4GpEGb.iWotAcdnZllfZfTQhJNCVG/F.cPhFn6',
     'Haldiram Foods International Pvt Ltd', 'Rohan', 'Tiwari', '9145776682', 'MERCHANT', 'ACTIVE', TRUE, TRUE, TRUE, 'Nagpur', 'Maharashtra', NOW(), NOW()),

    -- Haldiram's Store Manager
    ('7474823d-8030-47d7-a236-a5f0d6d05789', 'haldirams.nagpur@haldiramssweetssnacks.com', '$2a$12$P1j/nIqyPRzzH8A4GpEGb.iWotAcdnZllfZfTQhJNCVG/F.cPhFn6',
     'Haldiram Store Manager', 'Haldiram', 'Manager', '91457766834', 'STORE', 'ACTIVE', TRUE, TRUE, TRUE, 'Nagpur', 'Maharashtra', NOW(), NOW()),

    -- Fabindia Owner
    ('236714f2-91b8-4429-8622-4d2dcbcf8a3a', 'william.bissell401@fabindia.net', '$2a$12$VVZDs82a.rz6AAyt9DDrWOuEQi0JKgOq2FEnEs9dk3Kc5i9Ii3bD.',
     'Fabindia Overseas Pvt Ltd', 'William', 'Bissell', '9810182112', 'MERCHANT', 'ACTIVE', TRUE, TRUE, TRUE, 'Nagpur', 'Maharashtra', NOW(), NOW()),

    -- Fabindia Store Manager
    ('e3b8a1c9-7d4f-4e2b-9a8c-1f5e2d3c4b5a', 'fabindia.nagpur@fabindialiving.com', '$2a$12$VVZDs82a.rz6AAyt9DDrWOuEQi0JKgOq2FEnEs9dk3Kc5i9Ii3bD.',
     'Fabindia Store Manager', 'Fabindia', 'Manager', '9810182119', 'STORE', 'ACTIVE', TRUE, TRUE, TRUE, 'Nagpur', 'Maharashtra', NOW(), NOW()),

    -- Apollo Pharmacy Owner
    ('689ede03-ca7d-4585-9129-b07814880eb5', 'shobana.k257@apollopharmacy.org', '$2a$12$vcxvIzSuI99kD9ewtK4LQOXNCINNouEs2JhmP5W0E5UyTtc.b0Vzy',
     'Apollo Hospitals Enterprise Ltd', 'Shobana', 'Kamineni', '9849016899', 'MERCHANT', 'ACTIVE', TRUE, TRUE, TRUE, 'Nagpur', 'Maharashtra', NOW(), NOW()),

    -- Apollo Store Manager
    ('2c4251d4-2d19-4fac-a039-7adf6e0a07ed', 'apollo.nagpur@apollopharmacy24x7.com', '$2a$12$vcxvIzSuI99kD9ewtK4LQOXNCINNouEs2JhmP5W0E5UyTtc.b0Vzy',
     'Apollo Store Manager', 'Apollo', 'Manager', '9849016894', 'STORE', 'ACTIVE', TRUE, TRUE, TRUE, 'Nagpur', 'Maharashtra', NOW(), NOW()),

    -- Test Customer
    ('147ff421-7f6c-4995-98c2-b6de2a9f8eab', 'testcustomer@pinak.app', '$2a$12$4TUM7y7JmYpO5jzLPUs0g.gPfVfW3cckOK/3pRumwC3dg87jvEcyS',
     'Test Customer', 'Test', 'Customer', '+919876543210', 'CUSTOMER', 'ACTIVE', TRUE, TRUE, TRUE, 'Nagpur', 'Maharashtra', NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET status = 'ACTIVE',
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    name = EXCLUDED.name,
    updated_at = NOW();

-- Also ensure user email conflict is resolved to ACTIVE
UPDATE users
SET status = 'ACTIVE'
WHERE email IN (
    'riya.admin@pinak.app',
    'rohanitu@gmail.com',
    'haldirams.nagpur@haldiramssweetssnacks.com',
    'william.bissell401@fabindia.net',
    'fabindia.nagpur@fabindialiving.com',
    'shobana.k257@apollopharmacy.org',
    'apollo.nagpur@apollopharmacy24x7.com',
    'testcustomer@pinak.app'
);

-- 3. Seed / Update Merchants
INSERT INTO merchants (
    id, owner_user_id, business_name, legal_name, email, phone, city, state, pincode, address,
    status, approval_status, kyc_status, category_id, commission_rate, created_at, updated_at
)
VALUES
    -- Haldiram's Sweets & Snacks (Dining & Food)
    ('6059cba5-2103-42c0-b3ea-d76258ae0f04', '90bbc85f-7661-4a38-88ce-0bd72acc5e61',
     'Haldiram''s Sweets & Snacks', 'Haldiram Foods International Pvt Ltd',
     'rohanitu@gmail.com', '9145776682', 'Nagpur', 'Maharashtra', '440010', 'West High Court Road, Dharampeth',
     'ACTIVE', 'APPROVED', 'VERIFIED', '11111111-1111-1111-1111-111111111101', 5.00, NOW(), NOW()),

    -- Fabindia Home & Living (Retail & Products)
    ('f5831972-19e7-406f-b20b-92121c04c4a7', '236714f2-91b8-4429-8622-4d2dcbcf8a3a',
     'Fabindia Home & Living', 'Fabindia Overseas Pvt Ltd',
     'william.bissell401@fabindia.net', '9810182112', 'Nagpur', 'Maharashtra', '440001', 'Residency Road, Sadar',
     'ACTIVE', 'APPROVED', 'VERIFIED', '11111111-1111-1111-1111-111111111105', 5.00, NOW(), NOW()),

    -- Apollo Pharmacy 24x7 (Retail & Pharmacy)
    ('f299dbf6-0c61-4413-88b4-b210a3a725db', '689ede03-ca7d-4585-9129-b07814880eb5',
     'Apollo Pharmacy 24x7', 'Apollo Hospitals Enterprise Ltd',
     'shobana.k257@apollopharmacy.org', '9849016899', 'Nagpur', 'Maharashtra', '440010', 'Central Bazaar Road, Ramdaspeth',
     'ACTIVE', 'APPROVED', 'VERIFIED', '11111111-1111-1111-1111-111111111103', 5.00, NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET status = 'ACTIVE',
    approval_status = 'APPROVED',
    kyc_status = 'VERIFIED',
    updated_at = NOW();

-- 4. Seed Merchant Wallets
INSERT INTO merchant_wallets (id, merchant_id, available_balance, pending_balance, total_withdrawn, lifetime_volume, currency, status, version, created_at, updated_at)
VALUES
    ('685215c7-94bb-4396-8165-39f60d331439', '6059cba5-2103-42c0-b3ea-d76258ae0f04', 15000.00, 0.00, 5000.00, 20000.00, 'INR', 'ACTIVE', 0, NOW(), NOW()),
    ('152e939e-2719-4d9c-8e00-9ff07e80d263', 'f5831972-19e7-406f-b20b-92121c04c4a7', 8500.00, 0.00, 2000.00, 10500.00, 'INR', 'ACTIVE', 0, NOW(), NOW()),
    ('6a2d0793-4230-495f-bf97-df24a2ae16e1', 'f299dbf6-0c61-4413-88b4-b210a3a725db', 12000.00, 0.00, 3000.00, 15000.00, 'INR', 'ACTIVE', 0, NOW(), NOW())
ON CONFLICT (merchant_id) DO UPDATE
SET status = 'ACTIVE',
    updated_at = NOW();

-- 5. Seed Stores / Outlets
INSERT INTO stores (
    id, merchant_id, store_name, address, city_id, state, pincode,
    latitude, longitude, location_type, phone, opening_time, closing_time, operating_days,
    status, approval_status, image_url, rating, review_count_text, cuisine_or_category,
    menu_images, photos, amenities, cashback_percentage, max_cashback_amount, min_transaction_for_cashback, is_cashback_enabled,
    created_at, updated_at
)
VALUES
    -- Store 1: Haldiram's Sweets & Snacks (Full Dining Menu & Seating)
    ('97aabe53-9349-439d-952e-40f723bb8f51', '6059cba5-2103-42c0-b3ea-d76258ae0f04',
     'Haldiram''s Sweets & Snacks – Nagpur Flagship', 'West High Court Road, Dharampeth',
     'nagpur', 'Maharashtra', '440010', 21.1458000, 79.0882000, 'POINT',
     '9145776684', '08:00', '23:00', 'Daily (Mon - Sun)', 'ACTIVE', 'APPROVED',
     'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
     4.8, '(1.8k)', 'Dining & Sweets',
     '["https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"]'::jsonb,
     '["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80"]'::jsonb,
     '["Air Conditioned", "Pure Veg", "Cards & UPI Accepted", "Valet Parking", "Free High-Speed Wi-Fi"]'::jsonb,
     5.00, 150.00, 100.00, TRUE, NOW(), NOW()),

    -- Store 2: Fabindia Home & Living (Retail Product Merchant - EMPTY MENU, High-Impact Lookbook & Retail Amenities)
    ('a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d', 'f5831972-19e7-406f-b20b-92121c04c4a7',
     'Fabindia Home & Living – Nagpur Flagship', 'Residency Road, Sadar',
     'nagpur', 'Maharashtra', '440001', 21.1610000, 79.0830000, 'POINT',
     '9810182112', '10:00', '21:30', 'Daily (Mon - Sun)', 'ACTIVE', 'APPROVED',
     'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=80',
     4.9, '(920)', 'Retail & Lifestyle',
     '[]'::jsonb,
     '["https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=800&q=80"]'::jsonb,
     '["Trial Rooms", "Alteration Service", "Gift Wrapping", "Air Conditioned", "Cards & UPI Accepted", "Instant In-Store Pickup"]'::jsonb,
     5.00, 200.00, 500.00, TRUE, NOW(), NOW()),

    -- Store 3: Apollo Pharmacy 24x7 (Retail Essentials - EMPTY MENU)
    ('d4712d45-24ae-46d1-bce7-ef7b8ecab339', 'f299dbf6-0c61-4413-88b4-b210a3a725db',
     'Apollo Pharmacy 24x7 – Nagpur Flagship', 'Central Bazaar Road, Ramdaspeth',
     'nagpur', 'Maharashtra', '440010', 21.1390000, 79.0760000, 'POINT',
     '9849016894', '00:00', '23:59', 'Daily 24x7', 'ACTIVE', 'APPROVED',
     'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80',
     4.7, '(3.4k)', 'Pharmacy & Wellness',
     '[]'::jsonb,
     '["https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80"]'::jsonb,
     '["Air Conditioned", "Cards & UPI Accepted", "Free High-Speed Wi-Fi", "Wheelchair Accessible"]'::jsonb,
     5.00, 100.00, 150.00, TRUE, NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET status = 'ACTIVE',
    approval_status = 'APPROVED',
    image_url = EXCLUDED.image_url,
    menu_images = EXCLUDED.menu_images,
    photos = EXCLUDED.photos,
    amenities = EXCLUDED.amenities,
    cuisine_or_category = EXCLUDED.cuisine_or_category,
    city_id = EXCLUDED.city_id,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = NOW();

-- 6. Link Staff Members
INSERT INTO staff_members (id, user_id, role_id, scope, merchant_id, store_id, status, pos_pin, created_at, updated_at)
VALUES
    ('c28def9a-bf5e-4a02-936d-6b8bcd043025', '90bbc85f-7661-4a38-88ce-0bd72acc5e61', 'MERCHANT_OWNER', 'MERCHANT', '6059cba5-2103-42c0-b3ea-d76258ae0f04', NULL, 'ACTIVE', '1234', NOW(), NOW()),
    ('89dda0be-59bf-461d-ac96-1ace9d74deda', '7474823d-8030-47d7-a236-a5f0d6d05789', 'STORE_MANAGER', 'STORE', '6059cba5-2103-42c0-b3ea-d76258ae0f04', '97aabe53-9349-439d-952e-40f723bb8f51', 'ACTIVE', '1234', NOW(), NOW()),
    ('aafb6c26-9481-44fa-b21c-66e6220e8b95', '236714f2-91b8-4429-8622-4d2dcbcf8a3a', 'MERCHANT_OWNER', 'MERCHANT', 'f5831972-19e7-406f-b20b-92121c04c4a7', NULL, 'ACTIVE', '1234', NOW(), NOW()),
    ('e3b8a1c9-7d4f-4e2b-9a8c-1f5e2d3c4b50', 'e3b8a1c9-7d4f-4e2b-9a8c-1f5e2d3c4b5a', 'STORE_MANAGER', 'STORE', 'f5831972-19e7-406f-b20b-92121c04c4a7', 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d', 'ACTIVE', '1234', NOW(), NOW()),
    ('4976928a-d76b-44f4-b5bd-06aac06d3617', '689ede03-ca7d-4585-9129-b07814880eb5', 'MERCHANT_OWNER', 'MERCHANT', 'f299dbf6-0c61-4413-88b4-b210a3a725db', NULL, 'ACTIVE', '1234', NOW(), NOW()),
    ('c415ff0f-420d-4a76-8aac-60c2e5caef89', '2c4251d4-2d19-4fac-a039-7adf6e0a07ed', 'STORE_MANAGER', 'STORE', 'f299dbf6-0c61-4413-88b4-b210a3a725db', 'd4712d45-24ae-46d1-bce7-ef7b8ecab339', 'ACTIVE', '1234', NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET status = 'ACTIVE',
    updated_at = NOW();

-- 7. Seed Offers & Deals
INSERT INTO offers (
    id, merchant_id, store_id, category_id, title, description, terms_and_conditions,
    type, value, min_transaction_amount, max_discount_amount, valid_from, valid_to,
    usage_limit, per_customer_limit, current_usage_count, status, approval_status,
    bonus_coins, badge_text, recommendation_reason, estimated_savings, image_url,
    offer_scope, is_flash, remaining_quantity, cta_text, original_mrp, flash_selling_price,
    redemption_type, is_table_booking_enabled, booking_type, min_party_size, max_party_size,
    available_tables_per_slot, cover_charge_amount, grace_period_minutes, slot_times, seating_areas, active_days,
    start_time, end_time, created_at, updated_at
)
VALUES
    -- Haldiram's Pre-Booking Dine-in 50%
    ('99be0d40-53bb-4f60-acea-9b41d231bb79', '6059cba5-2103-42c0-b3ea-d76258ae0f04', NULL, '11111111-1111-1111-1111-111111111101',
     'Flat 50% OFF on Total Bill', 'Enjoy flat 50% OFF on your complete dining bill when reserving your table via PINAK SuperApp.',
     'Valid for dine-in only. Cannot be combined with other offers.',
     'PERCENTAGE_DISCOUNT', 50.00, 300.00, 750.00, NOW() - INTERVAL '2 days', NOW() + INTERVAL '180 days',
     1000, 3, 14, 'ACTIVE', 'APPROVED', 75, '50% OFF', 'Top Pre-booking Offer in Nagpur', 350.00,
     'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
     'SERVICE', FALSE, 250, 'Reserve Table', NULL, NULL,
     'PRE_BOOK', TRUE, 'INSTANT', 1, 8, 6, 0.00, 15,
     '["12:30 PM", "01:00 PM", "01:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM"]',
     '["Main Dining Hall", "AC Family Lounge"]', '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]',
     '11:00', '23:00', NOW(), NOW()),

    -- Haldiram's Weekend Table Feast 20%
    ('576cd3c9-dbc5-45ed-9822-4f2389f7d7d9', '6059cba5-2103-42c0-b3ea-d76258ae0f04', NULL, '11111111-1111-1111-1111-111111111101',
     'Weekend Table Feast: 20% OFF on Advance Booking', 'Special weekend family table booking discount on grand thalis and sweets.',
     'Applicable on food and beverages.',
     'PERCENTAGE_DISCOUNT', 20.00, 500.00, 500.00, NOW() - INTERVAL '2 days', NOW() + INTERVAL '180 days',
     500, 2, 8, 'ACTIVE', 'APPROVED', 50, '20% OFF', 'Weekend Special', 200.00,
     'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
     'SERVICE', FALSE, 150, 'Book Weekend Table', NULL, NULL,
     'PRE_BOOK', TRUE, 'INSTANT', 2, 12, 4, 0.00, 20,
     '["12:00 PM", "01:00 PM", "02:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"]',
     '["Main Dining Hall", "Terrace Seating"]', '["Fri", "Sat", "Sun"]',
     '12:00', '23:00', NOW(), NOW()),

    -- Haldiram's Walk-in 50% Deal
    ('827fca0f-4cc8-4867-8bde-a60b50f5540d', '6059cba5-2103-42c0-b3ea-d76258ae0f04', NULL, '11111111-1111-1111-1111-111111111101',
     'Flat 50% OFF on Total Bill (Walk-in)', 'Instant discount at the counter when paying via PINAK QR.',
     'Valid for in-store takeaway and counter orders.',
     'PERCENTAGE_DISCOUNT', 50.00, 200.00, 500.00, NOW() - INTERVAL '2 days', NOW() + INTERVAL '180 days',
     2000, 5, 42, 'ACTIVE', 'APPROVED', 50, '50% OFF', 'Instant Walk-in Deal', 250.00,
     'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
     'SERVICE', FALSE, 500, 'Pay in Store', NULL, NULL,
     'WALK_IN', FALSE, 'INSTANT', 1, 10, 0, 0.00, 15,
     '[]', '[]', '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]',
     '08:00', '23:00', NOW(), NOW()),

    -- Haldiram's Product Deal: Amul Taaza Milk
    ('c9e950e0-f4d7-4136-aaf6-5ba505fc9e0b', '6059cba5-2103-42c0-b3ea-d76258ae0f04', NULL, '11111111-1111-1111-1111-111111111103',
     'Amul Taaza Homogenised Toned Milk (19% OFF) @ All Branches', 'Fresh 1L tetra pack milk available for in-store pickup at all branches.',
     'Max 4 packs per customer daily. Show digital voucher at counter.',
     'PERCENTAGE_DISCOUNT', 19.00, 50.00, 100.00, NOW() - INTERVAL '2 days', NOW() + INTERVAL '180 days',
     1000, 10, 56, 'ACTIVE', 'APPROVED', 20, '19% OFF', 'Daily Essential', 14.00,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuDs3waAQbgzW6ulcWgCbnSxbpZN_13ZJXWzm4X2qAl0vMuum2WR04QFvNkO8dtZdx7jm6Hx-4Yv-UOTJvm_T1_zP-BjcNgu-n36fI1NJbiNiDN6iATJvnTI3PZFH9s3mrPOOkbC6anaq1aeOnanPe9Jc7mJ3mhPvignPOty3w2-rM7g19DmmRog4WK1HSwTg6I3iNANpsvacjgVB8XlD2SaJ5lauRM86etGCZnk70_yZwEM-f1ui0Vd',
     'PRODUCT', FALSE, 84, 'Claim Deal', 72.00, 58.00,
     'BOTH', FALSE, 'INSTANT', 1, 5, 0, 0.00, 15,
     '[]', '[]', '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]',
     '08:00', '23:00', NOW(), NOW()),

    -- Apollo Pharmacy Product Deal: Dettol Handwash
    ('e5f499e5-2ad7-4a7c-af06-ec031ea15bf2', 'f299dbf6-0c61-4413-88b4-b210a3a725db', NULL, '11111111-1111-1111-1111-111111111103',
     'Flat 25% OFF on Dettol Original Liquid Handwash Refill (750ml Pouch)', 'Germ protection handwash refill pouch at special retail discount.',
     'Valid across Apollo Pharmacy Nagpur branches.',
     'PERCENTAGE_DISCOUNT', 25.00, 100.00, 150.00, NOW() - INTERVAL '2 days', NOW() + INTERVAL '180 days',
     500, 5, 23, 'ACTIVE', 'APPROVED', 25, '25% OFF', 'Health & Hygiene', 47.00,
     'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
     'PRODUCT', FALSE, 68, 'Claim Deal', 189.00, 142.00,
     'BOTH', FALSE, 'INSTANT', 1, 5, 0, 0.00, 15,
     '[]', '[]', '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]',
     '00:00', '23:59', NOW(), NOW()),

    -- Fabindia Retail Product Deal 1: Pure Cotton Kurtas
    ('f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'f5831972-19e7-406f-b20b-92121c04c4a7', 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d', '11111111-1111-1111-1111-111111111105',
     'Flat 30% OFF on Pure Cotton Handwoven Kurtas', 'Handcrafted breathable cotton kurtas in artisanal indigo and vegetable dyes.',
     'Available at Fabindia Sadar Flagship store. Valid on selected summer collections.',
     'PERCENTAGE_DISCOUNT', 30.00, 1000.00, 1000.00, NOW() - INTERVAL '2 days', NOW() + INTERVAL '180 days',
     400, 4, 18, 'ACTIVE', 'APPROVED', 60, '30% OFF', 'Fabindia Ethnic Special', 567.00,
     'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
     'PRODUCT', FALSE, 45, 'Claim Deal', 1890.00, 1323.00,
     'BOTH', FALSE, 'INSTANT', 1, 5, 0, 0.00, 15,
     '[]', '[]', '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]',
     '10:00', '21:30', NOW(), NOW()),

    -- Fabindia Retail Product Deal 2: Handcrafted Home Living Decor
    ('f2a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5d', 'f5831972-19e7-406f-b20b-92121c04c4a7', 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d', '11111111-1111-1111-1111-111111111105',
     'Flat 25% OFF on Handcrafted Terracotta Vases & Living Decor', 'Elevate your home aesthetics with artisanal terracotta pottery and woven cushion covers.',
     'In-store voucher redemption at counter.',
     'PERCENTAGE_DISCOUNT', 25.00, 800.00, 600.00, NOW() - INTERVAL '2 days', NOW() + INTERVAL '180 days',
     300, 3, 11, 'ACTIVE', 'APPROVED', 45, '25% OFF', 'Home Living Best Seller', 312.00,
     'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
     'PRODUCT', FALSE, 32, 'Claim Deal', 1250.00, 938.00,
     'BOTH', FALSE, 'INSTANT', 1, 5, 0, 0.00, 15,
     '[]', '[]', '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]',
     '10:00', '21:30', NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET status = 'ACTIVE',
    approval_status = 'APPROVED',
    title = EXCLUDED.title,
    value = EXCLUDED.value,
    original_mrp = EXCLUDED.original_mrp,
    flash_selling_price = EXCLUDED.flash_selling_price,
    is_flash = EXCLUDED.is_flash,
    offer_scope = EXCLUDED.offer_scope,
    redemption_type = EXCLUDED.redemption_type,
    image_url = EXCLUDED.image_url,
    updated_at = NOW();

-- 8. Discovery Curation Config Linkage
INSERT INTO discovery_curation_config (id, config_key, ranking_weights, hero_offer_id, featured_store_ids, updated_by, updated_at)
VALUES (
    'd15c0000-0000-0000-0000-000000000001',
    'GLOBAL_MOBILE_DISCOVERY',
    '{"rating": 15, "distance": 45, "popularity": 10, "discountValue": 30}'::jsonb,
    '99be0d40-53bb-4f60-acea-9b41d231bb79',
    '["97aabe53-9349-439d-952e-40f723bb8f51", "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d", "d4712d45-24ae-46d1-bce7-ef7b8ecab339"]'::jsonb,
    'SYSTEM',
    NOW()
)
ON CONFLICT (config_key) DO UPDATE
SET hero_offer_id = EXCLUDED.hero_offer_id,
    featured_store_ids = EXCLUDED.featured_store_ids,
    updated_at = NOW();

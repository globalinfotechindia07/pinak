-- ==============================================================================
-- V13: Mobile Home Screen Newly Added Stores & Extended Places Showcase Data
-- ==============================================================================

-- 1. Extend Stores with Discovery Attributes
ALTER TABLE stores ADD COLUMN IF NOT EXISTS opening_offer VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS category_icon VARCHAR(64) DEFAULT 'storefront';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS theme_color VARCHAR(32) DEFAULT 'PRIMARY';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS price_range VARCHAR(16) DEFAULT '₹₹';

-- 2. Seed Newly Added and Places Merchants
INSERT INTO merchants (id, owner_user_id, business_name, legal_name, description, status, approval_status, kyc_status)
VALUES
    ('a0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000001', 'Blue Tokai Coffee Roasters', 'Blue Tokai Coffee Pvt Ltd', 'Artisan micro-roasters & specialty espresso bar', 'ACTIVE', 'APPROVED', 'VERIFIED'),
    ('a0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000001', 'Go Native Artisan Store & Cafe', 'Go Native Sustainable Living LLP', 'Sustainable retail, farm-to-table organic dining & conscious goods', 'ACTIVE', 'APPROVED', 'VERIFIED'),
    ('a0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000001', 'Superkicks Footwear', 'Superkicks India Retail Pvt Ltd', 'Premium sneaker store, streetwear apparel & limited drops', 'ACTIVE', 'APPROVED', 'VERIFIED'),
    ('a0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000001', 'Brik Oven Pizzeria', 'Brik Oven Foodworks Pvt Ltd', 'Wood-fired sourdough authentic Neapolitan pizza', 'ACTIVE', 'APPROVED', 'VERIFIED'),
    ('a0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000001', 'Social Indiranagar', 'Impresario Entertainment & Hospitality', 'Urban cafe, collaborative workspace and high-energy craft bar', 'ACTIVE', 'APPROVED', 'VERIFIED')
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Physical Stores with Specific Timing & Offer Details
INSERT INTO stores (id, merchant_id, store_name, description, address_line1, address_line2, address, state, pincode, latitude, longitude, status, approval_status, rating, review_count_text, cuisine_or_category, opening_offer, category_icon, theme_color, price_range, image_url, created_at, updated_at)
VALUES
    ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000009', 'Blue Tokai Coffee Roasters', 'Specialty single origin coffees and fresh bakes', '100ft Rd, Indiranagar', 'New Outlet', '584, 100ft Rd, Indiranagar, Bangalore', 'Karnataka', '560038', 12.9730000, 77.6430000, 'ACTIVE', 'APPROVED', 4.8, '(310)', 'Specialty Coffee', 'Grand Opening Offer: Free Cookie with Beverage', 'storefront', 'PRIMARY', '₹₹', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&q=80', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000010', 'Go Native Artisan Store & Cafe', 'Eco-friendly boutique & farm-to-table organic kitchen', '14th Main Rd', 'Sustainable Retail', '25, 14th Main Rd, Indiranagar, Bangalore', 'Karnataka', '560038', 12.9745000, 77.6440000, 'ACTIVE', 'APPROVED', 4.7, '(190)', 'Sustainable Retail & Cafe', 'Introductory 20% Cashback on Sustainable Goods', 'eco', 'SECONDARY', '₹₹', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000011', 'Superkicks Footwear', 'Curated collector sneakers, apparel and accessories', '12th Main Rd', 'Premium Streetwear', '72, 12th Main Rd, Indiranagar, Bangalore', 'Karnataka', '560038', 12.9720000, 77.6410000, 'ACTIVE', 'APPROVED', 4.9, '(85)', 'Sneakers & Streetwear', 'Welcome Bonus: 300 PINAK Coins on first purchase', 'skateboarding', 'TERTIARY', '₹₹₹', 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=500&q=80', CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000012', 'Brik Oven Pizzeria', 'Wood-fired artisanal sourdough pizzas', '100ft Rd', 'Indiranagar', '100ft Rd, HAL 2nd Stage, Indiranagar, Bangalore', 'Karnataka', '560038', 12.9725000, 77.6420000, 'ACTIVE', 'APPROVED', 4.6, '(3.1k)', 'Italian, Neapolitan Pizza', 'Flat 15% OFF + 100 Coins', 'local_pizza', 'PRIMARY', '₹₹', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000013', 'Social Indiranagar', 'Co-working hub, cafe and craft bar', '80ft Rd', 'Indiranagar', '80ft Rd, HAL 3rd Stage, Indiranagar, Bangalore', 'Karnataka', '560038', 12.9750000, 77.6455000, 'ACTIVE', 'APPROVED', 4.5, '(4.9k)', 'Pub & Workspace', '20% Cashback', 'nightlife', 'SECONDARY', '₹₹₹', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80', CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Real Offers for Newly Added Stores
INSERT INTO offers (id, merchant_id, store_id, title, description, type, value, min_transaction_amount, max_discount_amount, valid_from, valid_to, status, approval_status, bonus_coins, badge_text, recommendation_reason, estimated_savings)
VALUES
    ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000009', 'Free Cookie with Beverage', 'Grand Opening Offer: Free freshly baked cookie with any specialty brew', 'FIXED_DISCOUNT', 120.00, 250.00, 120.00, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '30 days', 'ACTIVE', 'APPROVED', 50, 'New Outlet', 'Newly opened coffee roastery', 120.00),
    ('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000010', '20% Cashback on Sustainable Goods', 'Introductory 20% Cashback on organic retail & cafe orders', 'CASHBACK', 20.00, 500.00, 200.00, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '30 days', 'ACTIVE', 'APPROVED', 100, 'Sustainable Retail', 'Eco-friendly curated goods', 200.00),
    ('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000011', 'Welcome Bonus: 300 PINAK Coins', 'Earn 300 bonus PINAK coins on your first sneaker purchase', 'CASHBACK', 300.00, 2000.00, 300.00, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP + INTERVAL '30 days', 'ACTIVE', 'APPROVED', 300, 'Streetwear Drop', 'Exclusive launch rewards', 300.00),
    ('c0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000012', 'Flat 15% OFF + 100 Coins', 'On all artisanal sourdough pizzas and wood-fired platters', 'PERCENTAGE_DISCOUNT', 15.00, 600.00, 300.00, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '30 days', 'ACTIVE', 'APPROVED', 100, 'Popular Pizza', 'Best wood-fired pizza near you', 250.00),
    ('c0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000013', '20% Cashback', 'Valid all day on work-friendly desks and food orders', 'CASHBACK', 20.00, 800.00, 400.00, CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP + INTERVAL '30 days', 'ACTIVE', 'APPROVED', 150, 'Workspace Deals', 'Great co-working discount', 350.00)
ON CONFLICT (id) DO NOTHING;

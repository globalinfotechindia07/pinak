-- ==============================================================================
-- V12: Mobile Home Screen Discovery Schema & Real Showcase Database Seeds
-- ==============================================================================

-- 1. Extend Stores with Discovery Attributes
ALTER TABLE stores ADD COLUMN IF NOT EXISTS image_url VARCHAR(1024);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS rating NUMERIC(2, 1) DEFAULT 4.8;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS review_count_text VARCHAR(50) DEFAULT '(1.2k)';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS cuisine_or_category VARCHAR(100);

-- 2. Extend Offers with Loyalty & Recommendation Attributes
ALTER TABLE offers ADD COLUMN IF NOT EXISTS bonus_coins INT DEFAULT 100;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS badge_text VARCHAR(100);
ALTER TABLE offers ADD COLUMN IF NOT EXISTS recommendation_reason VARCHAR(100);
ALTER TABLE offers ADD COLUMN IF NOT EXISTS estimated_savings NUMERIC(10, 2) DEFAULT 180.00;

-- 3. Seed Verified Partner Merchants
INSERT INTO merchants (id, owner_user_id, business_name, legal_name, description, status, approval_status, kyc_status)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'The Smokehouse Grill', 'Smokehouse Hospitality Pvt Ltd', 'Premier steakhouse and grill', 'ACTIVE', 'APPROVED', 'VERIFIED'),
    ('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Toni & Guy Salon', 'Toni and Guy India Pvt Ltd', 'Luxury hair styling and spa', 'ACTIVE', 'APPROVED', 'VERIFIED'),
    ('a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'Third Wave Coffee', 'Third Wave Roasters LLP', 'Specialty artisan coffee and bakes', 'ACTIVE', 'APPROVED', 'VERIFIED'),
    ('a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 'Toscano Trattoria', 'Toscano Restaurant Chain Pvt Ltd', 'Authentic Italian trattoria and pizzeria', 'ACTIVE', 'APPROVED', 'VERIFIED'),
    ('a0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', 'Cult.Fit Pro', 'Curefit Healthcare Pvt Ltd', 'High-energy fitness and boxing studio', 'ACTIVE', 'APPROVED', 'VERIFIED'),
    ('a0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000001', 'Glen''s Bakehouse', 'Glens Bakehouse Confectioners', 'Iconic red velvet and artisanal sourdough bakery', 'ACTIVE', 'APPROVED', 'VERIFIED'),
    ('a0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000001', 'Truffles Burgers', 'Truffles Hospitality LLP', 'Legendary craft burgers and milkshakes', 'ACTIVE', 'APPROVED', 'VERIFIED'),
    ('a0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000001', 'Bodycraft Spa', 'Bodycraft Salon & Spa Pvt Ltd', 'Holistic wellness and luxury spa retreat', 'ACTIVE', 'APPROVED', 'VERIFIED')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Physical Store Branches in Indiranagar, Bangalore (Coordinates centered around 12.9716, 77.6412)
INSERT INTO stores (id, merchant_id, store_name, description, address_line1, address_line2, address, state, pincode, latitude, longitude, status, approval_status, rating, review_count_text, cuisine_or_category, image_url)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'The Smokehouse Grill', 'Signature barbecue steaks & burgers', '100ft Rd', 'Indiranagar', '12, 100ft Rd, Indiranagar, Bangalore', 'Karnataka', '560038', 12.9735000, 77.6425000, 'ACTIVE', 'APPROVED', 4.8, '(1.8k)', 'Barbecue & Grill', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80'),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Toni & Guy Salon', 'Elite haircuts, color & styling', '12th Main Rd', 'Indiranagar', '45, 12th Main Rd, Indiranagar, Bangalore', 'Karnataka', '560038', 12.9752000, 77.6450000, 'ACTIVE', 'APPROVED', 4.7, '(950)', 'Salon & Styling', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80'),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Third Wave Coffee', 'Artisan manual brews and brunch', '80ft Rd', 'Indiranagar', '101, 80ft Rd, Indiranagar, Bangalore', 'Karnataka', '560038', 12.9710000, 77.6400000, 'ACTIVE', 'APPROVED', 4.9, '(2.4k)', 'Specialty Coffee', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&q=80'),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'Toscano Trattoria', 'Gourmet handmade pasta & wood-fired pizza', 'HAL 2nd Stage', 'Indiranagar', '354, 100ft Rd, Indiranagar, Bangalore', 'Karnataka', '560038', 12.9740000, 77.6430000, 'ACTIVE', 'APPROVED', 4.8, '(1.4k)', 'Italian & Wine', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80'),
    ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'Cult.Fit Pro', 'High-energy fitness and strength studio', '100ft Rd', 'Indiranagar', '502, 100ft Rd, Indiranagar, Bangalore', 'Karnataka', '560038', 12.9760000, 77.6460000, 'ACTIVE', 'APPROVED', 4.9, '(2.1k)', 'Fitness & Boxing', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80'),
    ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006', 'Glen''s Bakehouse', 'Artisanal cakes, pastries & sourdough', 'Lavelle Rd', 'Indiranagar', '24, 2nd Main Rd, Indiranagar, Bangalore', 'Karnataka', '560038', 12.9780000, 77.6475000, 'ACTIVE', 'APPROVED', 4.7, '(3.8k)', 'Bakery & Desserts', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80'),
    ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000007', 'Truffles Burgers', 'Legendary American burgers and shakes', 'Koramangala/Indiranagar', 'Indiranagar', '80ft Rd, HAL 3rd Stage, Indiranagar, Bangalore', 'Karnataka', '560038', 12.9690000, 77.6390000, 'ACTIVE', 'APPROVED', 4.7, '(4.2k)', 'Burgers & Shakes', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80'),
    ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000008', 'Bodycraft Spa', 'Luxury spa therapy and rejuvenation', '12th Main', 'Indiranagar', '12th Main Rd, Indiranagar, Bangalore', 'Karnataka', '560038', 12.9810000, 77.6490000, 'ACTIVE', 'APPROVED', 4.8, '(1.6k)', 'Salon & Wellness', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&q=80')
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Real Offers Tied to Stores
INSERT INTO offers (id, merchant_id, store_id, title, description, type, value, min_transaction_amount, max_discount_amount, valid_from, valid_to, status, approval_status, bonus_coins, badge_text, recommendation_reason, estimated_savings)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'FLAT 40% OFF', 'Up to ₹500 • On bills above ₹1,000', 'PERCENTAGE_DISCOUNT', 40.00, 1000.00, 500.00, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '30 days', 'ACTIVE', 'APPROVED', 150, '45m left', 'Top trending grill nearby', 400.00),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'BUY 1 GET 1 FREE', 'On all hair styling, cuts & blowouts', 'FIXED_DISCOUNT', 500.00, 800.00, 500.00, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '30 days', 'ACTIVE', 'APPROVED', 0, 'Till Sun', 'Trending salon service', 500.00),
    ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'FLAT ₹150 CASHBACK', '+ 2X Coins on PINAK UPI scan', 'CASHBACK', 150.00, 400.00, 150.00, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '30 days', 'ACTIVE', 'APPROVED', 100, 'Instant', 'Instant cashback on QR', 150.00),
    ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000007', '+100 Coins on ₹400 bill', 'Earn bonus coins on craft burgers and shakes', 'CASHBACK', 100.00, 400.00, 100.00, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '30 days', 'ACTIVE', 'APPROVED', 100, 'Based on dining visits', 'Based on dining visits', 180.00),
    ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000008', 'Flat 30% Off Mon-Thu', 'Luxury relaxation and wellness retreat', 'PERCENTAGE_DISCOUNT', 30.00, 1500.00, 800.00, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '30 days', 'ACTIVE', 'APPROVED', 250, 'Trending in Indiranagar', 'Trending in Indiranagar', 600.00)
ON CONFLICT (id) DO NOTHING;

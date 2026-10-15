-- ==============================================================================
-- Migration V18: Align Discover Screen Database with Exact Mobile UI
-- ==============================================================================

-- 1. Seed Exact Featured Supermarket & Kirana Stores from UI
INSERT INTO merchants (id, owner_user_id, business_name, legal_name, description, status, approval_status, kyc_status, is_featured)
VALUES
    ('a0000000-0000-0000-0000-000000000020', 'd0000000-0000-0000-0000-000000000001', 'BigBasket', 'Innovative Retail Concepts Pvt Ltd', 'India’s largest online grocery supermarket', 'ACTIVE', 'APPROVED', 'VERIFIED', TRUE),
    ('a0000000-0000-0000-0000-000000000021', 'd0000000-0000-0000-0000-000000000001', 'Reliance Fresh', 'Reliance Retail Ventures Ltd', 'Fresh fruits, vegetables and everyday groceries', 'ACTIVE', 'APPROVED', 'VERIFIED', TRUE),
    ('a0000000-0000-0000-0000-000000000022', 'd0000000-0000-0000-0000-000000000001', 'Sharma Kirana Store', 'Sharma Retail Traders', 'Trusted neighborhood kirana, spices and daily provisions', 'ACTIVE', 'APPROVED', 'VERIFIED', TRUE),
    ('a0000000-0000-0000-0000-000000000023', 'd0000000-0000-0000-0000-000000000001', 'More Supermarket', 'More Consumer Retail Ltd', 'One-stop retail hypermarket for food and home essentials', 'ACTIVE', 'APPROVED', 'VERIFIED', TRUE)
ON CONFLICT (id) DO UPDATE SET is_featured = TRUE;

INSERT INTO stores (id, merchant_id, store_name, description, address_line1, address_line2, address, state, pincode, latitude, longitude, status, approval_status, rating, review_count_text, cuisine_or_category, opening_offer, image_url)
VALUES
    ('b0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000020', 'BigBasket', 'Supermarket & groceries', 'HAL 2nd Stage', 'Indiranagar', '80ft Rd, Indiranagar, Bangalore', 'Karnataka', '560038', 12.9725000, 77.6420000, 'ACTIVE', 'APPROVED', 4.6, '(800)', 'Supermarket', '10% off on select items', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80'),
    ('b0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000021', 'Reliance Fresh', 'Fresh produce and groceries', '100ft Rd', 'Indiranagar', '100ft Rd, Indiranagar, Bangalore', 'Karnataka', '560038', 12.9740000, 77.6435000, 'ACTIVE', 'APPROVED', 4.4, '(620)', 'Supermarket', 'Flat ₹100 off on ₹1,000+', 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&q=80'),
    ('b0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000022', 'Sharma Kirana Store', 'Kirana & daily needs', '12th Main Rd', 'Indiranagar', '12th Main, Indiranagar, Bangalore', 'Karnataka', '560038', 12.9715000, 77.6405000, 'ACTIVE', 'APPROVED', 4.5, '(410)', 'Kirana & Daily Needs', 'Free delivery above ₹299', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80'),
    ('b0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000023', 'More Supermarket', 'Supermarket & staples', 'CMH Road', 'Indiranagar', 'CMH Road, Indiranagar, Bangalore', 'Karnataka', '560038', 12.9760000, 77.6465000, 'ACTIVE', 'APPROVED', 4.3, '(530)', 'Supermarket', 'Up to 20% off', 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=500&q=80')
ON CONFLICT (id) DO UPDATE SET
    store_name = EXCLUDED.store_name,
    rating = EXCLUDED.rating,
    opening_offer = EXCLUDED.opening_offer,
    image_url = EXCLUDED.image_url;

-- 2. Seed Exact Products from UI
INSERT INTO products (
    id, merchant_id, store_id, category_id, name, brand, unit,
    description, image_url, mrp, selling_price, discount_percent,
    currency, stock_quantity, in_stock, is_active
)
VALUES
    (
        'd0000000-0000-0000-0000-000000000011',
        'a0000000-0000-0000-0000-000000000020',
        'b0000000-0000-0000-0000-000000000020',
        '11111111-1111-1111-1111-111111111104',
        'Amul Fresh Milk',
        'Amul',
        '1 Litre',
        'Fresh pasteurized milk',
        'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80',
        65.00,
        52.00,
        20,
        'INR',
        100,
        TRUE,
        TRUE
    ),
    (
        'd0000000-0000-0000-0000-000000000012',
        'a0000000-0000-0000-0000-000000000020',
        'b0000000-0000-0000-0000-000000000020',
        '11111111-1111-1111-1111-111111111104',
        'India Gate Basmati Rice',
        'India Gate',
        '5 kg',
        'Aged long grain premium basmati rice',
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80',
        600.00,
        540.00,
        10,
        'INR',
        50,
        TRUE,
        TRUE
    ),
    (
        'd0000000-0000-0000-0000-000000000013',
        'a0000000-0000-0000-0000-000000000020',
        'b0000000-0000-0000-0000-000000000020',
        '11111111-1111-1111-1111-111111111104',
        'Maggi 2-Min Noodles',
        'Nestle Maggi',
        '70 g',
        'Instant masala noodles',
        'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&q=80',
        32.00,
        28.00,
        12,
        'INR',
        150,
        TRUE,
        TRUE
    ),
    (
        'd0000000-0000-0000-0000-000000000014',
        'a0000000-0000-0000-0000-000000000020',
        'b0000000-0000-0000-0000-000000000020',
        '11111111-1111-1111-1111-111111111104',
        'Dettol Handwash',
        'Dettol',
        '200 ml',
        'Liquid antiseptic hand hygiene refill',
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80',
        140.00,
        98.00,
        30,
        'INR',
        80,
        TRUE,
        TRUE
    ),
    (
        'd0000000-0000-0000-0000-000000000015',
        'a0000000-0000-0000-0000-000000000020',
        'b0000000-0000-0000-0000-000000000020',
        '11111111-1111-1111-1111-111111111103',
        'Stanley Hammer',
        'Stanley',
        '500 g',
        'Drop-forged steel claw hammer with grip',
        'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=500&q=80',
        400.00,
        340.00,
        15,
        'INR',
        30,
        TRUE,
        TRUE
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    selling_price = EXCLUDED.selling_price,
    mrp = EXCLUDED.mrp,
    discount_percent = EXCLUDED.discount_percent;

-- 3. Seed Exact Flash Deals from UI
INSERT INTO offers (
    id, merchant_id, store_id, title, description, type, value,
    min_transaction_amount, max_discount_amount, valid_from, valid_to,
    status, approval_status, bonus_coins, badge_text, is_flash,
    remaining_quantity, original_mrp, flash_selling_price, image_url
)
VALUES
    (
        'c0000000-0000-0000-0000-000000000031',
        'a0000000-0000-0000-0000-000000000020',
        'b0000000-0000-0000-0000-000000000020',
        'India Gate Rice 5kg',
        'Premium basmati rice family pack',
        'PERCENTAGE_DISCOUNT',
        45.00,
        500.00,
        450.00,
        CURRENT_TIMESTAMP - INTERVAL '1 hour',
        CURRENT_TIMESTAMP + INTERVAL '4 hours 32 minutes',
        'ACTIVE',
        'APPROVED',
        50,
        '45% OFF',
        TRUE,
        25,
        990.00,
        540.00,
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80'
    ),
    (
        'c0000000-0000-0000-0000-000000000032',
        'a0000000-0000-0000-0000-000000000020',
        'b0000000-0000-0000-0000-000000000020',
        'boAt Headphones',
        'Wireless bluetooth over-ear active bass headphones',
        'PERCENTAGE_DISCOUNT',
        40.00,
        1000.00,
        800.00,
        CURRENT_TIMESTAMP - INTERVAL '1 hour',
        CURRENT_TIMESTAMP + INTERVAL '4 hours 32 minutes',
        'ACTIVE',
        'APPROVED',
        100,
        '40% OFF',
        TRUE,
        18,
        1999.00,
        1199.00,
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'
    ),
    (
        'c0000000-0000-0000-0000-000000000033',
        'a0000000-0000-0000-0000-000000000020',
        'b0000000-0000-0000-0000-000000000020',
        'Prestige Cookware',
        'Non-stick induction base premium cookware pan',
        'PERCENTAGE_DISCOUNT',
        50.00,
        800.00,
        1000.00,
        CURRENT_TIMESTAMP - INTERVAL '1 hour',
        CURRENT_TIMESTAMP + INTERVAL '4 hours 32 minutes',
        'ACTIVE',
        'APPROVED',
        75,
        '50% OFF',
        TRUE,
        14,
        1999.00,
        999.00,
        'https://images.unsplash.com/photo-1584990347449-3998f8249bf5?w=500&q=80'
    ),
    (
        'c0000000-0000-0000-0000-000000000034',
        'a0000000-0000-0000-0000-000000000020',
        'b0000000-0000-0000-0000-000000000020',
        'Campus Sneakers',
        'Comfort cushioned breathable casual streetwear sneakers',
        'PERCENTAGE_DISCOUNT',
        35.00,
        1000.00,
        700.00,
        CURRENT_TIMESTAMP - INTERVAL '1 hour',
        CURRENT_TIMESTAMP + INTERVAL '4 hours 32 minutes',
        'ACTIVE',
        'APPROVED',
        80,
        '35% OFF',
        TRUE,
        20,
        1999.00,
        1299.00,
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80'
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    flash_selling_price = EXCLUDED.flash_selling_price,
    original_mrp = EXCLUDED.original_mrp,
    badge_text = EXCLUDED.badge_text,
    remaining_quantity = EXCLUDED.remaining_quantity;

-- 4. Seed Exact 5 Popular Collections from UI
INSERT INTO popular_collections (
    id, title, subtitle, cover_image_url, badge_text, display_order, target_type, target_id, is_active
) VALUES
    ('e0000000-0000-0000-0000-000000000011', 'Daily Essentials', 'Everyday products for your home', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80', 'Up to 30% OFF', 1, 'CATEGORY', '11111111-1111-1111-1111-111111111104', TRUE),
    ('e0000000-0000-0000-0000-000000000012', 'Electronics', 'Devices and accessories', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80', 'Up to 40% OFF', 2, 'CATEGORY', '11111111-1111-1111-1111-111111111104', TRUE),
    ('e0000000-0000-0000-0000-000000000013', 'Home Improvement', 'Tools, fixtures & decor', 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=500&q=80', 'Up to 35% OFF', 3, 'CATEGORY', '11111111-1111-1111-1111-111111111103', TRUE),
    ('e0000000-0000-0000-0000-000000000014', 'Beauty & Personal Care', 'Skincare, haircare and fragrance', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80', 'Up to 50% OFF', 4, 'CATEGORY', '11111111-1111-1111-1111-111111111102', TRUE),
    ('e0000000-0000-0000-0000-000000000015', 'Fashion Essentials', 'Trending apparel and casual wear', 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=500&q=80', 'Up to 60% OFF', 5, 'CATEGORY', '11111111-1111-1111-1111-111111111104', TRUE)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    badge_text = EXCLUDED.badge_text,
    display_order = EXCLUDED.display_order;

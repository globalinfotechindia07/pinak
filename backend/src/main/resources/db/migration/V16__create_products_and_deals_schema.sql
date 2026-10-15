-- ==============================================================================
-- V16: Create Products Table, Extend Offers for Services & Flash Deals, and Seed Showcase Data
-- ==============================================================================

-- 1. Extend Offers table with Service, Flash Deal, and UI Presentation attributes
ALTER TABLE offers ADD COLUMN IF NOT EXISTS image_url VARCHAR(1024);
ALTER TABLE offers ADD COLUMN IF NOT EXISTS offer_scope VARCHAR(32) DEFAULT 'SERVICE';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS is_flash BOOLEAN DEFAULT FALSE;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS remaining_quantity INT DEFAULT 50;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS cta_text VARCHAR(64) DEFAULT 'Book & Pay';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS original_mrp NUMERIC(10, 2);
ALTER TABLE offers ADD COLUMN IF NOT EXISTS flash_selling_price NUMERIC(10, 2);

-- Update existing offers with real image URLs, ctaText, and scope
UPDATE offers SET 
    image_url = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80',
    offer_scope = 'SERVICE',
    cta_text = 'Book & Pay'
WHERE id = 'c0000000-0000-0000-0000-000000000001';

UPDATE offers SET 
    image_url = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80',
    offer_scope = 'SERVICE',
    cta_text = 'Book Appointment'
WHERE id = 'c0000000-0000-0000-0000-000000000002';

UPDATE offers SET 
    image_url = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&q=80',
    offer_scope = 'SERVICE',
    cta_text = 'Scan & Pay'
WHERE id = 'c0000000-0000-0000-0000-000000000003';

UPDATE offers SET 
    image_url = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&q=80',
    offer_scope = 'SERVICE',
    cta_text = 'Book Session'
WHERE id = 'c0000000-0000-0000-0000-000000000005';

-- Seed Active Flash Deals into offers table
INSERT INTO offers (
    id, merchant_id, store_id, title, description, type, value,
    min_transaction_amount, max_discount_amount, valid_from, valid_to,
    status, approval_status, bonus_coins, badge_text, recommendation_reason,
    estimated_savings, image_url, offer_scope, is_flash, remaining_quantity,
    cta_text, original_mrp, flash_selling_price
)
VALUES
    (
        'c0000000-0000-0000-0000-000000000021',
        'a0000000-0000-0000-0000-000000000010',
        'b0000000-0000-0000-0000-000000000010',
        'India Gate Basmati Rice 5kg',
        'Premium Aged Rozana Basmati Rice Super Saver Pack',
        'PERCENTAGE_DISCOUNT',
        45.00,
        500.00,
        450.00,
        CURRENT_TIMESTAMP - INTERVAL '1 hour',
        CURRENT_TIMESTAMP + INTERVAL '12 hours',
        'ACTIVE',
        'APPROVED',
        100,
        '45% OFF',
        'Flash drop in Indiranagar',
        450.00,
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80',
        'FLASH',
        TRUE,
        25,
        'Grab Deal',
        990.00,
        540.00
    ),
    (
        'c0000000-0000-0000-0000-000000000022',
        'a0000000-0000-0000-0000-000000000010',
        'b0000000-0000-0000-0000-000000000010',
        'Tata Tea Gold 1kg Value Pack',
        'Rich aroma & full-bodied blend with gently rolled leaves',
        'PERCENTAGE_DISCOUNT',
        40.00,
        350.00,
        260.00,
        CURRENT_TIMESTAMP - INTERVAL '2 hours',
        CURRENT_TIMESTAMP + INTERVAL '8 hours',
        'ACTIVE',
        'APPROVED',
        50,
        '40% OFF',
        'Flash drop ending soon',
        260.00,
        'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80',
        'FLASH',
        TRUE,
        18,
        'Grab Deal',
        650.00,
        390.00
    ),
    (
        'c0000000-0000-0000-0000-000000000023',
        'a0000000-0000-0000-0000-000000000010',
        'b0000000-0000-0000-0000-000000000010',
        'Fortune Sunflower Refined Oil 5L',
        'Light & healthy cooking oil rich in natural vitamins',
        'PERCENTAGE_DISCOUNT',
        30.00,
        600.00,
        285.00,
        CURRENT_TIMESTAMP - INTERVAL '30 minutes',
        CURRENT_TIMESTAMP + INTERVAL '6 hours',
        'ACTIVE',
        'APPROVED',
        80,
        '30% OFF',
        'Limited stock flash deal',
        285.00,
        'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&q=80',
        'FLASH',
        TRUE,
        12,
        'Grab Deal',
        950.00,
        665.00
    )
ON CONFLICT (id) DO NOTHING;

-- 2. Create Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    unit VARCHAR(50) DEFAULT '1 piece',
    description TEXT,
    image_url VARCHAR(1024),
    mrp NUMERIC(10, 2) NOT NULL,
    selling_price NUMERIC(10, 2) NOT NULL,
    discount_percent INT DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'INR',
    stock_quantity INT DEFAULT 100,
    in_stock BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_merchant ON products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- 3. Seed Showcase Products with Real In-Store Deals
INSERT INTO products (
    id, merchant_id, store_id, category_id, name, brand, unit,
    description, image_url, mrp, selling_price, discount_percent,
    currency, stock_quantity, in_stock, is_active
)
VALUES
    (
        'd0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000010',
        'b0000000-0000-0000-0000-000000000010',
        '11111111-1111-1111-1111-111111111104',
        'Amul Taaza Fresh Toned Milk',
        'Amul',
        '1 litre',
        'Pasteurized homogenized toned milk with essential nutrients',
        'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80',
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
        'a0000000-0000-0000-0000-000000000010',
        'b0000000-0000-0000-0000-000000000010',
        '11111111-1111-1111-1111-111111111104',
        'Epigamia Greek Yogurt Blueberry',
        'Epigamia',
        '120g cup',
        'High protein creamy Greek yogurt infused with real blueberries',
        'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&q=80',
        60.00,
        45.00,
        25,
        'INR',
        80,
        TRUE,
        TRUE
    ),
    (
        'd0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000010',
        'b0000000-0000-0000-0000-000000000010',
        '11111111-1111-1111-1111-111111111104',
        'Aashirvaad Select Shudh Chakki Atta',
        'Aashirvaad',
        '10 kg',
        '100% pure Sharbati wheat grains from Madhya Pradesh',
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80',
        580.00,
        464.00,
        20,
        'INR',
        40,
        TRUE,
        TRUE
    ),
    (
        'd0000000-0000-0000-0000-000000000004',
        'a0000000-0000-0000-0000-000000000010',
        'b0000000-0000-0000-0000-000000000010',
        '11111111-1111-1111-1111-111111111104',
        'Nutella Hazelnut Cocoa Spread',
        'Ferrero',
        '350g jar',
        'Original hazelnut and cocoa spread with no artificial colors',
        'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=500&q=80',
        420.00,
        336.00,
        20,
        'INR',
        65,
        TRUE,
        TRUE
    )
ON CONFLICT (id) DO NOTHING;

-- ==============================================================
-- Migration V17: Create Discover Collections, Benefits & User History
-- ==============================================================

-- 1. Popular Collections Table
CREATE TABLE IF NOT EXISTS popular_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    cover_image_url VARCHAR(1024),
    badge_text VARCHAR(100),
    display_order INT DEFAULT 0,
    target_type VARCHAR(64) DEFAULT 'CATEGORY',
    target_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_popular_collections_active ON popular_collections(is_active, display_order);

-- Seed Popular Collections
INSERT INTO popular_collections (
    id, title, subtitle, cover_image_url, badge_text, display_order, target_type, target_id, is_active
) VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    'Daily Essentials & Grocery',
    'Fresh milk, veggies, atta, and daily staples',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
    'Up to 30% OFF',
    1,
    'CATEGORY',
    '11111111-1111-1111-1111-111111111104',
    TRUE
),
(
    'e0000000-0000-0000-0000-000000000002',
    'Top Cafes & Dining',
    'Artisanal bakeries, pizzerias and craft coffee',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&q=80',
    'Flat 20% OFF',
    2,
    'CATEGORY',
    '11111111-1111-1111-1111-111111111101',
    TRUE
),
(
    'e0000000-0000-0000-0000-000000000003',
    'Salon & Self-Care Spa',
    'Premium haircuts, styling, and soothing therapies',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80',
    'Earn 150 Coins',
    3,
    'CATEGORY',
    '11111111-1111-1111-1111-111111111102',
    TRUE
),
(
    'e0000000-0000-0000-0000-000000000004',
    'Automotive & Bike Care',
    'Water washes, full servicing & emergency fixes',
    'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=500&q=80',
    'Free Inspection',
    4,
    'CATEGORY',
    '11111111-1111-1111-1111-111111111103',
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 2. Discover Benefits ("Why Shop on PINAK?")
CREATE TABLE IF NOT EXISTS discover_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    icon_name VARCHAR(64) NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discover_benefits_active ON discover_benefits(is_active, display_order);

-- Seed Discover Benefits
INSERT INTO discover_benefits (
    id, title, subtitle, icon_name, display_order, is_active
) VALUES
(
    'f0000000-0000-0000-0000-000000000001',
    'Verified Local Stores',
    '100% genuine neighborhood merchants & verified partners',
    'shield-check',
    1,
    TRUE
),
(
    'f0000000-0000-0000-0000-000000000002',
    'Earn PINAK Coins',
    'Guaranteed cashback coins on every QR payment and bill scan',
    'coins',
    2,
    TRUE
),
(
    'f0000000-0000-0000-0000-000000000003',
    'Exclusive Local Deals',
    'Up to 50% discount vouchers unavailable anywhere else',
    'percent',
    3,
    TRUE
),
(
    'f0000000-0000-0000-0000-000000000004',
    'Instant QR Pay & Receipts',
    'Seamless UPI checkout with instant digital tax invoice',
    'qrcode-scan',
    4,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 3. User Recently Viewed Ledger
CREATE TABLE IF NOT EXISTS user_recently_viewed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    item_type VARCHAR(32) NOT NULL, -- 'PRODUCT' or 'MERCHANT'
    item_id UUID NOT NULL,
    branch_id UUID,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_urv_user_time ON user_recently_viewed(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_urv_user_item ON user_recently_viewed(user_id, item_type, item_id);

-- 4. Ensure merchants has is_featured column
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Mark our prime demo merchants as featured
UPDATE merchants
SET is_featured = TRUE
WHERE id IN (
    'a0000000-0000-0000-0000-000000000010',
    'a0000000-0000-0000-0000-000000000011',
    'a0000000-0000-0000-0000-000000000012'
);

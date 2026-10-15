-- ==============================================================================
-- V7: Discovery Feeds, Hero Banners, Retail Products, Collections & Benefits
-- Tables: discovery_curation_config, home_banners, products,
--         popular_collections, discover_benefits, user_recently_viewed
-- ==============================================================================

-- 1. Discovery Curation Config
CREATE TABLE IF NOT EXISTS discovery_curation_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(64) NOT NULL UNIQUE,
    ranking_weights JSONB NOT NULL,
    hero_offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
    featured_store_ids JSONB DEFAULT '{}'::jsonb,
    updated_by VARCHAR(128),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Home & Discover Promotional Banners Table
CREATE TABLE IF NOT EXISTS home_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_text VARCHAR(100) NOT NULL,
    countdown_end_time TIMESTAMP WITH TIME ZONE,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    cta_text VARCHAR(100) DEFAULT 'Claim Pass',
    cta_action VARCHAR(64) DEFAULT 'CLAIM_PASS',
    cta_target_id VARCHAR(255),
    theme_style VARCHAR(64) DEFAULT 'PRIMARY_GRADIENT',
    image_url VARCHAR(1024),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_home_banners_active ON home_banners(is_active, display_order);

-- 3. Retail Products Table (In-Store Bargains & Daily Essentials)
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

-- 4. Popular Collections Table
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

-- 5. Discover Benefits ("Why Shop on PINAK?")
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

-- 6. User Recently Viewed Ledger
CREATE TABLE IF NOT EXISTS user_recently_viewed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    item_type VARCHAR(32) NOT NULL,
    item_id UUID NOT NULL,
    branch_id UUID,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_urv_user_time ON user_recently_viewed(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_urv_user_item ON user_recently_viewed(user_id, item_type, item_id);

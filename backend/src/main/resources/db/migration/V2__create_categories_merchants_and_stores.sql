-- ==============================================================================
-- V2: Commerce Taxonomy, Geography, Merchants, and Stores
-- Tables: categories, cities, merchants, merchant_kyc, stores
-- ==============================================================================

-- 1. Categories Table (Hierarchical Taxonomy)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(128) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    display_order INTEGER NOT NULL DEFAULT 0,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);

-- 2. Cities Master Table
CREATE TABLE IF NOT EXISTS cities (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cities_state ON cities(state);
CREATE INDEX IF NOT EXISTS idx_cities_status ON cities(status);
CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);

-- 3. Merchants Table (Business / Brand Level)
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    business_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    bank_upi_id VARCHAR(100),
    gstin VARCHAR(50),
    pan VARCHAR(20),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    approval_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_APPROVAL',
    kyc_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    suspension_reason TEXT,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_merchants_owner ON merchants(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_merchants_category ON merchants(category_id);
CREATE INDEX IF NOT EXISTS idx_merchants_status ON merchants(status);
CREATE INDEX IF NOT EXISTS idx_merchants_approval ON merchants(approval_status);

-- 4. Merchant KYC Table
CREATE TABLE IF NOT EXISTS merchant_kyc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    business_type VARCHAR(64) NOT NULL,
    pan_number VARCHAR(10) NOT NULL,
    gstin VARCHAR(15),
    bank_account_number VARCHAR(34) NOT NULL,
    bank_ifsc VARCHAR(11) NOT NULL,
    bank_name VARCHAR(128) NOT NULL,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITHOUT TIME ZONE,
    submitted_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_merchant_kyc_merchant ON merchant_kyc(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_kyc_status ON merchant_kyc(verification_status);

-- 5. Stores Table (Physical Branch Outlets Owning Geographic Location)
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    store_name VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    address VARCHAR(512) NOT NULL,
    city_id VARCHAR(64) REFERENCES cities(id) ON DELETE SET NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    location_type VARCHAR(20) NOT NULL DEFAULT 'POINT',
    location VARCHAR(255),
    phone VARCHAR(20),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    opening_time VARCHAR(10),
    closing_time VARCHAR(10),
    operating_days VARCHAR(100),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    approval_status VARCHAR(32) NOT NULL DEFAULT 'APPROVED',
    rejection_reason TEXT,
    suspension_reason VARCHAR(1000),
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stores_merchant ON stores(merchant_id);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_coordinates ON stores(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_stores_city ON stores(city_id);

-- ==============================================================================
-- 6. Seed Categories Master Data
-- ==============================================================================
INSERT INTO categories (id, name, slug, parent_id, status, display_order)
VALUES 
    ('11111111-1111-1111-1111-111111111101', 'Food & Dining', 'food-and-dining', NULL, 'ACTIVE', 1),
    ('11111111-1111-1111-1111-111111111102', 'Health & Fitness', 'health-and-fitness', NULL, 'ACTIVE', 2),
    ('11111111-1111-1111-1111-111111111103', 'Services & Salons', 'services-and-salons', NULL, 'ACTIVE', 3),
    ('11111111-1111-1111-1111-111111111104', 'Retail & Shopping', 'retail-and-shopping', NULL, 'ACTIVE', 4),
    ('11111111-1111-1111-1111-111111111111', 'Restaurants', 'restaurants', '11111111-1111-1111-1111-111111111101', 'ACTIVE', 1),
    ('11111111-1111-1111-1111-111111111112', 'Cafes & Bakeries', 'cafes-and-bakeries', '11111111-1111-1111-1111-111111111101', 'ACTIVE', 2),
    ('11111111-1111-1111-1111-111111111121', 'Gyms & Training', 'gyms-and-training', '11111111-1111-1111-1111-111111111102', 'ACTIVE', 1),
    ('11111111-1111-1111-1111-111111111131', 'Salon & Spa', 'salon-and-spa', '11111111-1111-1111-1111-111111111103', 'ACTIVE', 1)
ON CONFLICT (id) DO NOTHING;

-- Seed Cities
INSERT INTO cities (id, name, slug, state, country, status)
VALUES
    ('nagpur', 'Nagpur', 'nagpur', 'Maharashtra', 'India', 'ACTIVE'),
    ('mumbai', 'Mumbai', 'mumbai', 'Maharashtra', 'India', 'ACTIVE'),
    ('pune', 'Pune', 'pune', 'Maharashtra', 'India', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;



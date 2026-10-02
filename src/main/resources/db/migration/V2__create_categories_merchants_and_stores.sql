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

-- Seed Demo Merchants
INSERT INTO merchants (id, owner_user_id, business_name, legal_name, description, category_id, phone, email, status, approval_status, kyc_status, approved_at)
VALUES
    ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'The Curry Leaf', 'Curry Leaf Hospitality Pvt Ltd', 'Authentic Indian regional delicacies and multi-cuisine dine-in.', '11111111-1111-1111-1111-111111111101', '+919822011111', 'contact@curryleaf.in', 'ACTIVE', 'APPROVED', 'VERIFIED', CURRENT_TIMESTAMP),
    ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Glow Theory Studio', 'Glow Beauty Labs LLP', 'Bespoke hair spa, organic facials, and bridal styling studio.', '11111111-1111-1111-1111-111111111103', '+919822022222', 'care@glowtheory.com', 'ACTIVE', 'APPROVED', 'VERIFIED', CURRENT_TIMESTAMP),
    ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Stride Fitness Club', 'Stride Athletics India Pvt Ltd', 'High-intensity cross-training, Olympic lifting, and functional yoga.', '11111111-1111-1111-1111-111111111102', '+919822033333', 'hello@stridefitness.in', 'ACTIVE', 'APPROVED', 'VERIFIED', CURRENT_TIMESTAMP),
    ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Roast & Roast Cafe', 'Roast Artisanal Brews LLP', 'Single-origin espresso, pour-overs, and handcrafted desserts.', '11111111-1111-1111-1111-111111111112', '+919822044444', 'cheers@roastandtoast.com', 'ACTIVE', 'APPROVED', 'VERIFIED', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Seed Demo Stores
INSERT INTO stores (id, merchant_id, store_name, address, city_id, state, pincode, latitude, longitude, location_type, phone, contact_phone, contact_email, opening_time, closing_time, operating_days, status, approval_status)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'The Curry Leaf - Dharampeth Flagship', 'Plot 42, West High Court Road, Dharampeth', 'nagpur', 'Maharashtra', '440010', 21.1458000, 79.0669000, 'POINT', '+919822011111', '+919822011111', 'dharampeth@curryleaf.in', '11:00', '23:30', 'Monday - Sunday', 'ACTIVE', 'APPROVED'),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'The Curry Leaf - Civil Lines Executive', 'Opposite High Court, Civil Lines', 'nagpur', 'Maharashtra', '440001', 21.1524000, 79.0782000, 'POINT', '+919822011112', '+919822011112', 'civillines@curryleaf.in', '11:00', '23:30', 'Monday - Sunday', 'ACTIVE', 'APPROVED'),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'The Curry Leaf - Koregaon Park Bistro', 'Lane 7, Koregaon Park, Near South Main Road', 'pune', 'Maharashtra', '411001', 18.5362000, 73.8940000, 'POINT', '+919822011113', '+919822011113', 'pune@curryleaf.in', '12:00', '23:00', 'Monday - Sunday', 'ACTIVE', 'APPROVED'),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Glow Theory Studio - Bandra West', 'Ground Floor, Linking Road, Khar West', 'mumbai', 'Maharashtra', '400052', 19.0688000, 72.8360000, 'POINT', '+919822022221', '+919822022221', 'bandra@glowtheory.com', '10:00', '20:30', 'Tuesday - Sunday', 'ACTIVE', 'APPROVED'),
    ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'Glow Theory Studio - Viman Nagar', 'Shop 12, Phoenix Marketcity Avenue, Viman Nagar', 'pune', 'Maharashtra', '411014', 18.5679000, 73.9143000, 'POINT', '+919822022222', '+919822022222', 'vimannagar@glowtheory.com', '10:30', '21:00', 'Monday - Sunday', 'ACTIVE', 'APPROVED'),
    ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', 'Stride Fitness Club - Andheri West', '3rd Floor, Crystal Point Mall, New Link Road', 'mumbai', 'Maharashtra', '400053', 19.1363000, 72.8277000, 'POINT', '+919822033331', '+919822033331', 'andheri@stridefitness.in', '06:00', '22:30', 'Monday - Saturday', 'ACTIVE', 'APPROVED'),
    ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000004', 'Roast & Roast Cafe - Dharampeth', 'Coffee Lane, Opposite Traffic Park, Dharampeth', 'nagpur', 'Maharashtra', '440010', 21.1441000, 79.0645000, 'POINT', '+919822044441', '+919822044441', 'dharampeth@roastandtoast.com', '08:00', '23:00', 'Monday - Sunday', 'ACTIVE', 'APPROVED')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- V14: Create Cities master table, extend Stores schema with
-- PostGIS geography, approval status, and security fields
-- ============================================================

-- 1. Ensure PostGIS is active if available
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'postgis') THEN
        BEGIN
            CREATE EXTENSION IF NOT EXISTS postgis;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'PostGIS extension could not be enabled: %', SQLERRM;
        END;
    END IF;
END $$;

-- 2. Create Cities Master Table
CREATE TABLE IF NOT EXISTS cities (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_city_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);
CREATE INDEX IF NOT EXISTS idx_cities_status ON cities(status);

-- Seed Initial Master Cities
INSERT INTO cities (id, name, state, country, status, created_at, updated_at)
VALUES
    ('city_123', 'Nagpur', 'Maharashtra', 'India', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PUNE', 'Pune', 'Maharashtra', 'India', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('MUMBAI', 'Mumbai', 'Maharashtra', 'India', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('NAGPUR', 'Nagpur', 'Maharashtra', 'India', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('DELHI', 'Delhi', 'Delhi', 'India', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('BANGALORE', 'Bangalore', 'Karnataka', 'India', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 3. Extend Stores Table with Branch & Geographic Attributes
ALTER TABLE stores
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255),
    ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255),
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS approval_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_APPROVAL',
    ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS suspension_reason VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

-- Migrate legacy address and status data in existing store rows
UPDATE stores
SET address_line1 = address
WHERE address_line1 IS NULL AND address IS NOT NULL;

UPDATE stores
SET city_id = 'PUNE'
WHERE city_id IS NOT NULL AND city_id NOT IN (SELECT id FROM cities);

UPDATE stores
SET approval_status = 'APPROVED', status = 'ACTIVE'
WHERE status = 'APPROVED';

UPDATE stores
SET approval_status = 'PENDING_APPROVAL', status = 'ACTIVE'
WHERE status = 'PENDING';

-- Add Foreign Key from stores(city_id) to cities(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_stores_city' AND table_name = 'stores'
    ) THEN
        ALTER TABLE stores
            ADD CONSTRAINT fk_stores_city
            FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add Check Constraints for Status and Approval Status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_stores_status'
    ) THEN
        ALTER TABLE stores
            ADD CONSTRAINT chk_stores_status
            CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'chk_stores_approval_status'
    ) THEN
        ALTER TABLE stores
            ADD CONSTRAINT chk_stores_approval_status
            CHECK (approval_status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'));
    END IF;
END $$;

-- 4. Setup PostGIS Location Column and Spatial Index
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'stores' AND column_name = 'location'
        ) THEN
            ALTER TABLE stores ADD COLUMN location geography(Point, 4326);
            -- Longitude FIRST, Latitude SECOND
            UPDATE stores SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_stores_location ON stores USING GIST(location);
        END IF;
    ELSE
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'stores' AND column_name = 'location'
        ) THEN
            ALTER TABLE stores ADD COLUMN location VARCHAR(255);
            -- Standard WKT format POINT(longitude latitude)
            UPDATE stores SET location = 'POINT(' || longitude || ' ' || latitude || ')'
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_stores_location_text ON stores(location);
        END IF;
    END IF;
END $$;

-- Additional Performance Indexes
CREATE INDEX IF NOT EXISTS idx_stores_city ON stores(city_id);
CREATE INDEX IF NOT EXISTS idx_stores_approval_status ON stores(approval_status);
CREATE INDEX IF NOT EXISTS idx_stores_merchant_status ON stores(merchant_id, status, approval_status);

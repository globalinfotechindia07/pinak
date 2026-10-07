-- ==============================================================================
-- V6: PostGIS Spatial Indexing & Discovery Feed Curation Tables
-- Enables high-performance ST_DWithin queries and persistent discovery rules
-- ==============================================================================

-- 1. Enable PostGIS Extension (if available in PostgreSQL instance)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS postgis;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'PostGIS extension not installed; falling back to numeric indexing';
END $$;

-- 2. Add spatial column and GiST index to stores
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
        -- Add geography column if not present
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'stores' AND column_name = 'location_geog'
        ) THEN
            ALTER TABLE stores ADD COLUMN location_geog GEOGRAPHY(Point, 4326);
            
            -- Backfill existing store coordinates
            UPDATE stores 
            SET location_geog = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography 
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
            
            -- Create spatial GiST index
            CREATE INDEX IF NOT EXISTS idx_stores_location_geog_gist ON stores USING GIST (location_geog);
        END IF;
    END IF;
END $$;

-- 3. Composite functional index fallback for high-speed Haversine calculations
CREATE INDEX IF NOT EXISTS idx_stores_lat_lng_active 
ON stores(latitude, longitude) 
WHERE status = 'ACTIVE' AND approval_status = 'APPROVED';

-- 4. Discovery Curation & Ranking Weights Table
CREATE TABLE IF NOT EXISTS discovery_curation_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(64) NOT NULL UNIQUE,
    ranking_weights JSONB NOT NULL,
    hero_offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
    featured_store_ids JSONB DEFAULT '{}'::jsonb,
    updated_by VARCHAR(128),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed default discovery ranking formula
INSERT INTO discovery_curation_config (id, config_key, ranking_weights, featured_store_ids, updated_by)
VALUES (
    'd15c0000-0000-0000-0000-000000000001',
    'GLOBAL_MOBILE_DISCOVERY',
    '{"distance": 45, "discountValue": 30, "rating": 15, "popularity": 10}'::jsonb,
    '{}'::jsonb,
    'SYSTEM'
)
ON CONFLICT (config_key) DO NOTHING;

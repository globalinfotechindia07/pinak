-- ============================================================
-- V24: Align stores.location column type with JPA entity
-- When PostGIS is active, V14 created location as geography.
-- Convert to VARCHAR(255) to match Store.java String mapping.
-- ============================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stores' 
          AND column_name = 'location' 
          AND udt_name = 'geography'
    ) THEN
        DROP INDEX IF EXISTS idx_stores_location;
        ALTER TABLE stores ALTER COLUMN location TYPE VARCHAR(255) USING ST_AsText(location);
        CREATE INDEX IF NOT EXISTS idx_stores_location_text ON stores(location);
    END IF;
END $$;

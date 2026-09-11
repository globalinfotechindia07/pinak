-- ============================================================
-- V15: Extend Categories and Cities Master Tables
-- Adds slug, description, icon, displayOrder, audit fields,
-- unique constraints, and performance indexes.
-- ============================================================

-- 1. Extend Categories Table
ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS slug VARCHAR(128),
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS icon VARCHAR(100),
    ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

-- Backfill slugs for existing categories
UPDATE categories SET slug = 'food-dining', icon = 'restaurant', display_order = 1 WHERE name = 'Food & Dining' AND slug IS NULL;
UPDATE categories SET slug = 'health-fitness', icon = 'fitness_center', display_order = 2 WHERE name = 'Health & Fitness' AND slug IS NULL;
UPDATE categories SET slug = 'services-salons', icon = 'spa', display_order = 3 WHERE name = 'Services & Salons' AND slug IS NULL;
UPDATE categories SET slug = 'retail-shopping', icon = 'shopping_bag', display_order = 4 WHERE name = 'Retail & Shopping' AND slug IS NULL;
UPDATE categories SET slug = 'restaurants', icon = 'restaurant', display_order = 5 WHERE name = 'Restaurants' AND slug IS NULL;
UPDATE categories SET slug = 'cafes-bakeries', icon = 'local_cafe', display_order = 6 WHERE name = 'Cafes & Bakeries' AND slug IS NULL;
UPDATE categories SET slug = 'gyms-training', icon = 'fitness_center', display_order = 7 WHERE name = 'Gyms & Training' AND slug IS NULL;
UPDATE categories SET slug = 'salon-spa', icon = 'spa', display_order = 8 WHERE name = 'Salon & Spa' AND slug IS NULL;

-- Fallback for any other existing categories without slug
UPDATE categories
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Ensure all slugs are lowercase and stripped of trailing hyphens
UPDATE categories
SET slug = TRIM(BOTH '-' FROM slug)
WHERE slug LIKE '-%' OR slug LIKE '%-';

-- Enforce NOT NULL on categories.slug
ALTER TABLE categories ALTER COLUMN slug SET NOT NULL;

-- Unique and performance indexes on categories
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_status_order ON categories(status, display_order);

-- 2. Extend Cities Table
ALTER TABLE cities
    ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

-- Backfill slugs for existing cities
UPDATE cities SET slug = 'nagpur' WHERE id = 'city_123' AND slug IS NULL;
UPDATE cities SET slug = 'pune' WHERE id = 'PUNE' AND slug IS NULL;
UPDATE cities SET slug = 'mumbai' WHERE id = 'MUMBAI' AND slug IS NULL;
UPDATE cities SET slug = 'delhi' WHERE id = 'DELHI' AND slug IS NULL;
UPDATE cities SET slug = 'bangalore' WHERE id = 'BANGALORE' AND slug IS NULL;
UPDATE cities SET slug = 'nagpur-central' WHERE id = 'NAGPUR' AND slug IS NULL;

-- Fallback for any other existing cities without slug
UPDATE cities
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

UPDATE cities
SET slug = TRIM(BOTH '-' FROM slug)
WHERE slug LIKE '-%' OR slug LIKE '%-';

-- Enforce NOT NULL on cities.slug
ALTER TABLE cities ALTER COLUMN slug SET NOT NULL;

-- Unique and performance indexes on cities
CREATE UNIQUE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);
CREATE INDEX IF NOT EXISTS idx_cities_search ON cities(status, state, name);

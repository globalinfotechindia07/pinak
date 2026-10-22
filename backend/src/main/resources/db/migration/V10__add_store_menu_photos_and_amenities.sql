-- ==============================================================================
-- V10: Add menu_images, photos, and amenities to stores table
-- Enables restaurant menu cards, store photo gallery, and dining amenities.
-- ==============================================================================

ALTER TABLE stores
ADD COLUMN IF NOT EXISTS menu_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;

-- Seed sample menu, photos, and amenities for demonstration stores
UPDATE stores
SET
  menu_images = '[
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80"
  ]'::jsonb,
  photos = '[
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80",
    "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80"
  ]'::jsonb,
  amenities = '[
    "Air Conditioned",
    "Free Wi-Fi",
    "Pure Vegetarian",
    "Valet Parking",
    "Cards & UPI Accepted",
    "Family & Kid Friendly",
    "Takeaway Available"
  ]'::jsonb
WHERE id = 'cac68ee2-f6c6-4103-b276-208c56569691';

UPDATE stores
SET
  menu_images = '[
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80"
  ]'::jsonb,
  photos = '[
    "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80",
    "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80"
  ]'::jsonb,
  amenities = '[
    "Air Conditioned",
    "Free Wi-Fi",
    "Outdoor Seating",
    "Bar & Cocktails",
    "Valet Parking",
    "Cards & UPI Accepted",
    "Live Music"
  ]'::jsonb
WHERE id = '678f1bb7-0b19-4322-a3a1-17b12419d64c' OR id = 'b3e6e877-b00a-407b-b8f7-4bf7cf6c7945';

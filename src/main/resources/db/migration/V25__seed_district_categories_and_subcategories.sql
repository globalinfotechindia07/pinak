-- V25: Seed District-Style Top-Level Categories & Subcategories and add index on parent_id

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);

-- Seed / Update Parent Categories
INSERT INTO categories (id, name, slug, description, icon, display_order, status, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'Dining', 'dining', 'Cafes, Fine Dining, Fast Food, Bars & Pubs', 'restaurant', 1, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SYSTEM', 'SYSTEM'),
    (gen_random_uuid(), 'Movies', 'movies', 'Multiplex, Cinemas, IMAX, Drive-in Theatres', 'movie', 2, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SYSTEM', 'SYSTEM'),
    (gen_random_uuid(), 'Events', 'events', 'Concerts, Festivals, Exhibitions, Nightlife', 'event', 3, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SYSTEM', 'SYSTEM'),
    (gen_random_uuid(), 'Stores', 'stores', 'Shopping, Fashion, Electronics, Supermarkets', 'shopping_bag', 4, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SYSTEM', 'SYSTEM'),
    (gen_random_uuid(), 'Activities', 'activities', 'Bowling, Go-Karting, VR, Escape Rooms', 'sports_esports', 5, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SYSTEM', 'SYSTEM'),
    (gen_random_uuid(), 'Play', 'play', 'Turf Sports, Badminton, Fitness, Gyms', 'fitness_center', 6, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SYSTEM', 'SYSTEM'),
    (gen_random_uuid(), 'Comedy', 'comedy', 'Standup Specials, Open Mics, Comedy Clubs', 'theater_comedy', 7, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SYSTEM', 'SYSTEM')
ON CONFLICT (name) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    display_order = EXCLUDED.display_order,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

-- Seed Subcategories under Dining
INSERT INTO categories (id, name, slug, description, icon, display_order, parent_id, status, created_at, updated_at, created_by, updated_by)
SELECT gen_random_uuid(), sub.name, sub.slug, sub.description, sub.icon, sub.display_order, c.id, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SYSTEM', 'SYSTEM'
FROM categories c
CROSS JOIN (VALUES
    ('Cafes', 'cafes', 'Coffee shops, artisanal bakeries, tea lounges', 'local_cafe', 1),
    ('Fine Dining', 'fine-dining', 'Gourmet dining and premium restaurants', 'wine_bar', 2),
    ('Fast Food', 'fast-food', 'Quick bites, burgers, pizzas, and rolls', 'fastfood', 3),
    ('Bars & Pubs', 'bars-pubs', 'Cocktail lounges, breweries, nightlife spots', 'local_bar', 4),
    ('Bakeries & Desserts', 'bakeries-desserts', 'Cakes, pastries, ice creams, desserts', 'cake', 5),
    ('Casual Dining', 'casual-dining', 'Family restaurants, buffets, multi-cuisine', 'dinner_dining', 6),
    ('Street Food', 'street-food', 'Local delicacies, food stalls, chaat', 'ramen_dining', 7)
) AS sub(name, slug, description, icon, display_order)
WHERE c.name = 'Dining' AND c.parent_id IS NULL
ON CONFLICT (name) DO UPDATE SET
    slug = EXCLUDED.slug,
    parent_id = EXCLUDED.parent_id,
    updated_at = CURRENT_TIMESTAMP;

-- Seed Subcategories under Movies
INSERT INTO categories (id, name, slug, description, icon, display_order, parent_id, status, created_at, updated_at, created_by, updated_by)
SELECT gen_random_uuid(), sub.name, sub.slug, sub.description, sub.icon, sub.display_order, c.id, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SYSTEM', 'SYSTEM'
FROM categories c
CROSS JOIN (VALUES
    ('Multiplex & Cinemas', 'multiplex-cinemas', 'PVR, INOX, Cinepolis screens', 'theaters', 1),
    ('IMAX & 4DX', 'imax-4dx', 'Immersive large screen experience', 'aspect_ratio', 2),
    ('Drive-in Theatres', 'drive-in-theatres', 'Open-air movie screening under stars', 'directions_car', 3),
    ('Film Clubs', 'film-clubs', 'Indie screenings, documentary clubs', 'movie_filter', 4)
) AS sub(name, slug, description, icon, display_order)
WHERE c.name = 'Movies' AND c.parent_id IS NULL
ON CONFLICT (name) DO UPDATE SET
    slug = EXCLUDED.slug,
    parent_id = EXCLUDED.parent_id,
    updated_at = CURRENT_TIMESTAMP;

-- Seed Subcategories under Events
INSERT INTO categories (id, name, slug, description, icon, display_order, parent_id, status, created_at, updated_at, created_by, updated_by)
SELECT gen_random_uuid(), sub.name, sub.slug, sub.description, sub.icon, sub.display_order, c.id, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SYSTEM', 'SYSTEM'
FROM categories c
CROSS JOIN (VALUES
    ('Live Concerts', 'live-concerts', 'Music concerts and live performances', 'music_note', 1),
    ('Music Festivals', 'music-festivals', 'Multi-day music festivals and DJ nights', 'festival', 2),
    ('Exhibitions & Expos', 'exhibitions-expos', 'Art shows, trade expos, flea markets', 'museum', 3),
    ('Nightlife & Parties', 'nightlife-parties', 'Clubbing, rooftop parties, DJ events', 'nightlife', 4),
    ('Workshops', 'workshops', 'Art, cooking, dance, and creative workshops', 'school', 5)
) AS sub(name, slug, description, icon, display_order)
WHERE c.name = 'Events' AND c.parent_id IS NULL
ON CONFLICT (name) DO UPDATE SET
    slug = EXCLUDED.slug,
    parent_id = EXCLUDED.parent_id,
    updated_at = CURRENT_TIMESTAMP;

-- Seed Subcategories under Stores
INSERT INTO categories (id, name, slug, description, icon, display_order, parent_id, status, created_at, updated_at, created_by, updated_by)
SELECT gen_random_uuid(), sub.name, sub.slug, sub.description, sub.icon, sub.display_order, c.id, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SYSTEM', 'SYSTEM'
FROM categories c
CROSS JOIN (VALUES
    ('Fashion & Apparel', 'fashion-apparel', 'Clothing, designer wear, accessories', 'checkroom', 1),
    ('Electronics & Gadgets', 'electronics-gadgets', 'Mobiles, laptops, home appliances', 'devices', 2),
    ('Supermarkets & Grocery', 'supermarkets-grocery', 'Daily needs, organic food, groceries', 'local_grocery_store', 3),
    ('Beauty & Personal Care', 'beauty-personal-care', 'Cosmetics, skincare, salons', 'spa', 4),
    ('Home & Decor', 'home-decor', 'Furniture, lighting, kitchenware', 'chair', 5),
    ('Footwear', 'footwear', 'Sneakers, formal shoes, sandals', 'steps', 6)
) AS sub(name, slug, description, icon, display_order)
WHERE c.name = 'Stores' AND c.parent_id IS NULL
ON CONFLICT (name) DO UPDATE SET
    slug = EXCLUDED.slug,
    parent_id = EXCLUDED.parent_id,
    updated_at = CURRENT_TIMESTAMP;

-- Seed Subcategories under Activities
INSERT INTO categories (id, name, slug, description, icon, display_order, parent_id, status, created_at, updated_at, created_by, updated_by)
SELECT gen_random_uuid(), sub.name, sub.slug, sub.description, sub.icon, sub.display_order, c.id, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SYSTEM', 'SYSTEM'
FROM categories c
CROSS JOIN (VALUES
    ('Bowling Alleys', 'bowling-alleys', 'Bowling arenas and arcade zones', 'sports_kilikiti', 1),
    ('Go-Karting', 'go-karting', 'Racing tracks and karting arenas', 'sports_motorsports', 2),
    ('Arcades & VR', 'arcades-vr', 'Virtual reality games and arcade consoles', 'videogame_asset', 3),
    ('Trampoline Parks', 'trampoline-parks', 'Bounce arenas and foam pits', 'sports_gymnastics', 4),
    ('Escape Rooms', 'escape-rooms', 'Mystery rooms and puzzle games', 'lock_reset', 5),
    ('Gaming Lounges', 'gaming-lounges', 'PC gaming, PS5 lounges, esports', 'sports_esports', 6)
) AS sub(name, slug, description, icon, display_order)
WHERE c.name = 'Activities' AND c.parent_id IS NULL
ON CONFLICT (name) DO UPDATE SET
    slug = EXCLUDED.slug,
    parent_id = EXCLUDED.parent_id,
    updated_at = CURRENT_TIMESTAMP;

-- Seed Subcategories under Play
INSERT INTO categories (id, name, slug, description, icon, display_order, parent_id, status, created_at, updated_at, created_by, updated_by)
SELECT gen_random_uuid(), sub.name, sub.slug, sub.description, sub.icon, sub.display_order, c.id, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SYSTEM', 'SYSTEM'
FROM categories c
CROSS JOIN (VALUES
    ('Turf Football & Cricket', 'turf-football-cricket', 'Box cricket and football turfs', 'sports_soccer', 1),
    ('Badminton Courts', 'badminton-courts', 'Indoor wooden & synthetic badminton courts', 'sports_tennis', 2),
    ('Swimming Pools', 'swimming-pools', 'Olympic & leisure swimming pools', 'pool', 3),
    ('Fitness & Gyms', 'fitness-gyms', 'Gyms, crossfit, yoga studios', 'fitness_center', 4),
    ('Tennis & Pickleball', 'tennis-pickleball', 'Pickleball and tennis courts', 'sports_bar', 5)
) AS sub(name, slug, description, icon, display_order)
WHERE c.name = 'Play' AND c.parent_id IS NULL
ON CONFLICT (name) DO UPDATE SET
    slug = EXCLUDED.slug,
    parent_id = EXCLUDED.parent_id,
    updated_at = CURRENT_TIMESTAMP;

-- Seed Subcategories under Comedy
INSERT INTO categories (id, name, slug, description, icon, display_order, parent_id, status, created_at, updated_at, created_by, updated_by)
SELECT gen_random_uuid(), sub.name, sub.slug, sub.description, sub.icon, sub.display_order, c.id, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SYSTEM', 'SYSTEM'
FROM categories c
CROSS JOIN (VALUES
    ('Standup Specials', 'standup-specials', 'Solo comedy shows and specials', 'mic', 1),
    ('Open Mics', 'open-mics', 'Budding comedian nights and open mics', 'mic_external_on', 2),
    ('Comedy Clubs', 'comedy-clubs', 'Dedicated comedy venues', 'chair_alt', 3),
    ('Improv Theatre', 'improv-theatre', 'Improvised comedy and interactive acts', 'groups', 4)
) AS sub(name, slug, description, icon, display_order)
WHERE c.name = 'Comedy' AND c.parent_id IS NULL
ON CONFLICT (name) DO UPDATE SET
    slug = EXCLUDED.slug,
    parent_id = EXCLUDED.parent_id,
    updated_at = CURRENT_TIMESTAMP;

-- ==============================================================================
-- V14: Create Home Banners Table & Seed Hero Carousel Promotions
-- ==============================================================================

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

-- Seed Hero Carousel Banners from Mobile Screen 10 Specification
INSERT INTO home_banners (id, badge_text, countdown_end_time, title, subtitle, cta_text, cta_action, theme_style, display_order, is_active)
VALUES
    (
        'e0000000-0000-0000-0000-000000000001',
        'Super Weekend Fest',
        CURRENT_TIMESTAMP + INTERVAL '16 hours',
        'Flat 50% Cashback + 200 Extra Coins',
        'Valid at all verified dining & salon partners in Indiranagar.',
        'Claim Pass',
        'CLAIM_PASS',
        'PRIMARY_GRADIENT',
        1,
        TRUE
    ),
    (
        'e0000000-0000-0000-0000-000000000002',
        'Dining Carnival',
        CURRENT_TIMESTAMP + INTERVAL '2 days',
        'Buy 1 Get 1 Free on Craft Brews & Gourmet Bakes',
        'Exclusive perks at Third Wave, Glen''s Bakehouse & Brik Oven.',
        'Explore Spots',
        'EXPLORE_CATEGORY',
        'SECONDARY_GRADIENT',
        2,
        TRUE
    ),
    (
        'e0000000-0000-0000-0000-000000000003',
        'Flash Drop',
        CURRENT_TIMESTAMP + INTERVAL '5 hours',
        'Earn 300 PINAK Coins on Streetwear & Sneakers',
        'First 500 orders unlock instant bonus wallet credit.',
        'Grab Deal',
        'VIEW_OFFER',
        'TERTIARY_GRADIENT',
        3,
        TRUE
    )
ON CONFLICT (id) DO NOTHING;

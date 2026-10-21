-- ==============================================================================
-- V9: Seed Discover Screen Hero Promotional Banners
-- Table: home_banners (used by /api/v1/banners?placement=DISCOVER)
-- ==============================================================================

INSERT INTO home_banners (
    id,
    badge_text,
    countdown_end_time,
    title,
    subtitle,
    cta_text,
    cta_action,
    cta_target_id,
    theme_style,
    image_url,
    display_order,
    is_active,
    created_at,
    updated_at
) VALUES
(
    'b0000000-0000-0000-0000-000000000001',
    'FLAT 50% OFF',
    NOW() + INTERVAL '7 days',
    'Mega Dining Carnival 🍽️',
    'Reserve confirmed tables at top restaurants & save flat 50% on food bills',
    'Book Table',
    'TABLE_RESERVATION',
    'tbl_dining_fest_2026',
    'PRIMARY_GRADIENT',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    1,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'b0000000-0000-0000-0000-000000000002',
    'FLASH SALE',
    NOW() + INTERVAL '3 days',
    'Supermarket Bargain Rush 🛒',
    'Steal deals on monthly groceries, dairy & staples with express counter pickup',
    'Shop Deals',
    'PRODUCT_DEAL',
    'deal_grocery_blowout_2026',
    'SECONDARY_GRADIENT',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    2,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'b0000000-0000-0000-0000-000000000003',
    'REWARDS 2X',
    NOW() + INTERVAL '14 days',
    'Grooming & Salon Treat ✂️',
    'Flat ₹300 OFF premium haircut, facial & massage + Earn double PINAK Coins',
    'Claim Pass',
    'CLAIM_PASS',
    'pass_wellness_treat_2026',
    'TERTIARY_GRADIENT',
    'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=1200&q=80',
    3,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'b0000000-0000-0000-0000-000000000004',
    'HOT DEAL',
    NOW() + INTERVAL '10 days',
    'Audio & Gadget Fiesta 🎧',
    'ANC earbuds, smartwatches & accessories at direct wholesale prices',
    'View Gadgets',
    'PRODUCT_DEAL',
    'deal_tech_fiesta_2026',
    'PRIMARY_GRADIENT',
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=80',
    4,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    badge_text = EXCLUDED.badge_text,
    countdown_end_time = EXCLUDED.countdown_end_time,
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    cta_text = EXCLUDED.cta_text,
    cta_action = EXCLUDED.cta_action,
    cta_target_id = EXCLUDED.cta_target_id,
    theme_style = EXCLUDED.theme_style,
    image_url = EXCLUDED.image_url,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- ==============================================================================
-- V12: Add Pre-Booking and Walk-In Offer Differentiation
-- Adds redemption_type ('WALK_IN', 'PRE_BOOK', 'BOTH') and min_advance_hours
-- ==============================================================================

ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS redemption_type VARCHAR(32) NOT NULL DEFAULT 'BOTH';

ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS min_advance_hours INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_offers_redemption_type ON offers(redemption_type);

-- Update seeded restaurant offers with targeted redemption behaviors:
-- 1. Pre-Booking Only: Group/Party celebrations and multi-course chef tasting dinners
UPDATE offers 
SET redemption_type = 'PRE_BOOK', min_advance_hours = 2 
WHERE id IN (
    'd1000000-0000-0000-0000-000000000006', -- 5-Course Chef Tasting Dinner Pass
    'd1000000-0000-0000-0000-000000000009', -- Grand Celebration ₹600 OFF (Min Bill ₹3,000)
    'd1000000-0000-0000-0000-000000000010'  -- Corporate Dining ₹400 OFF (Min Bill ₹2,000)
);

-- 2. Walk-In Only: Happy hours & fast lunch rush deals
UPDATE offers 
SET redemption_type = 'WALK_IN', min_advance_hours = 0 
WHERE id IN (
    'd1000000-0000-0000-0000-000000000003', -- Happy Hours 1+1 on Craft Beverages
    'd1000000-0000-0000-0000-000000000004'  -- Early Lunch Rush 30% OFF
);

-- 3. Both Walk-in & Pre-book: Standard dine-in bill discounts, buffets, and first-time specials
UPDATE offers 
SET redemption_type = 'BOTH', min_advance_hours = 0 
WHERE id IN (
    'd1000000-0000-0000-0000-000000000001', -- Flat 20% OFF on Total Food Bill
    'd1000000-0000-0000-0000-000000000002', -- Weekend Family Feast 15% OFF
    'd1000000-0000-0000-0000-000000000005', -- Unlimited Royal Veg Thali @ ₹599
    'd1000000-0000-0000-0000-000000000007', -- Buy 1 Chole Bhature, Get Chaas Free
    'd1000000-0000-0000-0000-000000000008', -- Order 2 Starters, Get 1 Dessert Free
    'd1000000-0000-0000-0000-000000000011', -- First Dine-In Welcome 25% OFF
    'd1000000-0000-0000-0000-000000000012'  -- New Foodie ₹150 OFF Welcome Gift
);

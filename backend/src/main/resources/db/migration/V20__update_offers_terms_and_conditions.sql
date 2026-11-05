-- ==============================================================================
-- Migration V19: Update Offers Terms and Conditions from Database
-- Ensures all dining and pre-booking offers have comprehensive real terms loaded from database
-- ==============================================================================

UPDATE offers
SET terms_and_conditions = 'Valid for dine-in reservations made via PINAK SuperApp only.
Flat 50% discount applies on the total food and soft beverage bill before taxes.
Minimum dining bill of ₹1,000 required to redeem this offer.
The table reservation will be held for up to 15 minutes past the scheduled slot time; please arrive on time.
Cannot be clubbed or combined with any other in-store promotions, happy hours, or special buffet rates.
The full discount is redeemed automatically when settling the final dining bill through the PINAK app/QR.
Cover charges (if applicable) are 100% refundable if the booking is cancelled at least 2 hours prior to the slot time.
Right of admission is reserved by restaurant management. Valid government photo ID may be requested upon arrival.'
WHERE terms_and_conditions IS NULL 
   OR terms_and_conditions = '' 
   OR terms_and_conditions = 'Auto-applied at checkout.';

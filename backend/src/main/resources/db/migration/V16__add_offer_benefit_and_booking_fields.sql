-- ==============================================================================
-- Migration V16: Add Offer Benefit Structure (BOGO buy/get quantities)
-- and District Table/Slot Booking fields to offers table
-- ==============================================================================

ALTER TABLE offers
    ADD COLUMN IF NOT EXISTS buy_quantity INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS get_quantity INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS is_table_booking_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS booking_type VARCHAR(64),
    ADD COLUMN IF NOT EXISTS min_party_size INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS max_party_size INTEGER DEFAULT 6,
    ADD COLUMN IF NOT EXISTS available_tables_per_slot INTEGER DEFAULT 5,
    ADD COLUMN IF NOT EXISTS cover_charge_amount NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS grace_period_minutes INTEGER DEFAULT 15,
    ADD COLUMN IF NOT EXISTS slot_times TEXT,
    ADD COLUMN IF NOT EXISTS seating_areas TEXT,
    ADD COLUMN IF NOT EXISTS active_days TEXT,
    ADD COLUMN IF NOT EXISTS start_time VARCHAR(16),
    ADD COLUMN IF NOT EXISTS end_time VARCHAR(16);

-- Optional comments for schema clarity
COMMENT ON COLUMN offers.buy_quantity IS 'For BOGO benefit structure: quantity to purchase (X)';
COMMENT ON COLUMN offers.get_quantity IS 'For BOGO benefit structure: quantity received free (Y)';
COMMENT ON COLUMN offers.is_table_booking_enabled IS 'Whether this offer enables pre-booking or table reservations';

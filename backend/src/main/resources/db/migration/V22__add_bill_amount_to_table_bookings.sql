-- Migration V22: Add bill_amount and bill_added_at to table_bookings
ALTER TABLE table_bookings
    ADD COLUMN IF NOT EXISTS bill_amount NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS bill_added_at TIMESTAMP WITH TIME ZONE;

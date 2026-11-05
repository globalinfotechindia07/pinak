-- ==============================================================================
-- Migration V18: Create Table Bookings and Table Reservations Table
-- Supports mobile table booking, pre-booking slot selection, checkout, confirmation, and cancellations
-- ==============================================================================

CREATE TABLE IF NOT EXISTS table_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_ref VARCHAR(64) UNIQUE NOT NULL,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(150),
    guests INTEGER NOT NULL DEFAULT 2,
    booking_date DATE NOT NULL,
    meal_type VARCHAR(20) NOT NULL, -- 'LUNCH' or 'DINNER'
    slot_time VARCHAR(20) NOT NULL, -- e.g. '01:45 PM'
    offer_id VARCHAR(64),
    offer_title VARCHAR(255),
    discount_pct NUMERIC(5,2) DEFAULT 0.00,
    cover_charge_per_guest NUMERIC(10,2) DEFAULT 0.00,
    total_cover_charge NUMERIC(10,2) DEFAULT 0.00,
    include_vip_plan BOOLEAN DEFAULT false,
    vip_plan_fee NUMERIC(10,2) DEFAULT 0.00,
    total_paid NUMERIC(10,2) DEFAULT 0.00,
    payment_method VARCHAR(50) DEFAULT 'Google Pay',
    payment_status VARCHAR(30) DEFAULT 'PAID', -- 'PAID', 'PENDING', 'FAILED', 'REFUNDED'
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED', -- 'CONFIRMED', 'CANCELLED', 'SEATED', 'COMPLETED', 'NO_SHOW'
    verification_code VARCHAR(10),
    special_requests TEXT,
    cancellation_reason VARCHAR(255),
    cancellation_comments TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    refund_amount NUMERIC(10,2) DEFAULT 0.00,
    refund_status VARCHAR(30), -- 'NOT_APPLICABLE', 'INITIATED', 'REFUNDED'
    refund_ref VARCHAR(64),
    coins_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_table_bookings_store_id ON table_bookings(store_id);
CREATE INDEX IF NOT EXISTS idx_table_bookings_user_id ON table_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_table_bookings_customer_phone ON table_bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_table_bookings_date ON table_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_table_bookings_status ON table_bookings(status);
CREATE INDEX IF NOT EXISTS idx_table_bookings_ref ON table_bookings(booking_ref);

COMMENT ON TABLE table_bookings IS 'Customer restaurant table reservations, pre-booking passes, and cover charge redemption tracking';

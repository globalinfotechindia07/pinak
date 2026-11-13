-- ==============================================================================
-- Migration V28: Align stores, offers, and table_bookings column definitions
-- Ensures all columns exist across local and production databases
-- ==============================================================================

-- 1. STORES table columns
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS menu_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS menu_highlights JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS cashback_percentage NUMERIC(5, 2) DEFAULT 5.00;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS max_cashback_amount NUMERIC(10, 2) DEFAULT 150.00;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS min_transaction_for_cashback NUMERIC(10, 2) DEFAULT 100.00;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_cashback_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_table_booking_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS allow_free_standard_booking BOOLEAN DEFAULT TRUE;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS default_standard_cover_charge NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS cuisine_or_category VARCHAR(100);
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS opening_offer VARCHAR(255);
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS category_icon VARCHAR(64) DEFAULT 'storefront';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS theme_color VARCHAR(32) DEFAULT 'PRIMARY';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS price_range VARCHAR(16) DEFAULT '₹₹';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS review_count_text VARCHAR(50) DEFAULT '(1.2k)';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS operating_days VARCHAR(50) DEFAULT 'Daily (Mon - Sun)';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS opening_time VARCHAR(10) DEFAULT '10:00';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS closing_time VARCHAR(10) DEFAULT '22:00';

-- 2. OFFERS table columns
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS bonus_coins INTEGER DEFAULT 100;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS badge_text VARCHAR(100);
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS recommendation_reason VARCHAR(100);
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS estimated_savings NUMERIC(10, 2) DEFAULT 180.00;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS image_url VARCHAR(1024);
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS offer_scope VARCHAR(32) DEFAULT 'SERVICE';
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS is_flash BOOLEAN DEFAULT FALSE;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS remaining_quantity INTEGER DEFAULT 50;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS cta_text VARCHAR(64) DEFAULT 'Book & Pay';
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS original_mrp NUMERIC(10, 2);
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS flash_selling_price NUMERIC(10, 2);
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS redemption_type VARCHAR(32) DEFAULT 'BOTH';
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS min_advance_hours INTEGER DEFAULT 0;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS buy_quantity INTEGER DEFAULT 1;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS get_quantity INTEGER DEFAULT 1;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS is_table_booking_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS booking_type VARCHAR(64);
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS min_party_size INTEGER DEFAULT 1;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS max_party_size INTEGER DEFAULT 6;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS available_tables_per_slot INTEGER DEFAULT 5;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS cover_charge_amount NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS grace_period_minutes INTEGER DEFAULT 15;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS slot_times TEXT;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS seating_areas TEXT;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS active_days TEXT;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS start_time VARCHAR(32);
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS end_time VARCHAR(32);

-- 3. USERS table columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS primary_city VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS district VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address VARCHAR(512);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender VARCHAR(32);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS primary_zone VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(64);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(64);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS whatsapp_alerts_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS soundbox_stay_signed_in BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS category_preferences VARCHAR(512);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS precise_location_granted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS flash_alerts_granted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_known_latitude NUMERIC;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_known_longitude NUMERIC;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(1024);

-- 4. TABLE_BOOKINGS table columns
ALTER TABLE public.table_bookings ADD COLUMN IF NOT EXISTS bill_amount NUMERIC(10, 2);
ALTER TABLE public.table_bookings ADD COLUMN IF NOT EXISTS bill_added_at TIMESTAMP WITHOUT TIME ZONE;

-- 5. PAYMENTS table columns
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(64);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_id UUID;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS merchant_id UUID;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS store_id UUID;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS offer_id UUID;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS provider VARCHAR(64);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS provider_order_id VARCHAR(128);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS provider_payment_id VARCHAR(128);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(12, 2);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payable_amount NUMERIC(12, 2);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS failure_code VARCHAR(64);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(512);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

-- 6. REWARD_LEDGER_ENTRIES table columns
ALTER TABLE public.reward_ledger_entries ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE public.reward_ledger_entries ADD COLUMN IF NOT EXISTS reward_account_id UUID;
ALTER TABLE public.reward_ledger_entries ADD COLUMN IF NOT EXISTS transaction_id UUID;
ALTER TABLE public.reward_ledger_entries ADD COLUMN IF NOT EXISTS redemption_id UUID;
ALTER TABLE public.reward_ledger_entries ADD COLUMN IF NOT EXISTS type VARCHAR(32);
ALTER TABLE public.reward_ledger_entries ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'POSTED';

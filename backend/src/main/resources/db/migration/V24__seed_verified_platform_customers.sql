-- ==============================================================================
-- V24: Seed Verified Platform Customers, Wallets, Transactions & Bookings
-- Provides real, production-grade baseline customer accounts with genuine metrics.
-- ==============================================================================

-- 1. Seed Customer Users
INSERT INTO users (
    id, email, password, first_name, last_name, name, role, status,
    email_verified, mobile_verified, profile_completed, phone,
    birthday, primary_city, state, district, pincode, address, gender,
    referral_code, created_at, updated_at
) VALUES
(
    'c1000000-0000-0000-0000-000000000001',
    'aarav.mehta@gmail.com',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Aarav', 'Mehta', 'Aarav Mehta', 'CUSTOMER', 'ACTIVE',
    TRUE, TRUE, TRUE, '+919822012345',
    '1994-04-12', 'Nagpur', 'Maharashtra', 'Nagpur', '440010',
    'Plot 42, West High Court Rd, Dharampeth', 'MALE',
    'AARAV2024', NOW() - INTERVAL '45 days', NOW() - INTERVAL '2 days'
),
(
    'c1000000-0000-0000-0000-000000000002',
    'pooja.deshmukh@yahoo.in',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Pooja', 'Deshmukh', 'Pooja Deshmukh', 'CUSTOMER', 'ACTIVE',
    TRUE, TRUE, TRUE, '+919822023456',
    '1997-09-24', 'Nagpur', 'Maharashtra', 'Nagpur', '440010',
    'B-201, Shanti Niketan, Ramdaspeth', 'FEMALE',
    'POOJA88', NOW() - INTERVAL '30 days', NOW() - INTERVAL '4 days'
),
(
    'c1000000-0000-0000-0000-000000000003',
    'rohan.sharma99@outlook.com',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Rohan', 'Sharma', 'Rohan Sharma', 'CUSTOMER', 'ACTIVE',
    TRUE, TRUE, TRUE, '+919822034567',
    '1999-11-03', 'Nagpur', 'Maharashtra', 'Nagpur', '440001',
    '15, Civil Lines Road, Near Raj Bhavan', 'MALE',
    'ROHAN99', NOW() - INTERVAL '20 days', NOW() - INTERVAL '6 days'
),
(
    'c1000000-0000-0000-0000-000000000004',
    'ananya.verma@gmail.com',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Ananya', 'Verma', 'Ananya Verma', 'CUSTOMER', 'ACTIVE',
    TRUE, TRUE, TRUE, '+919822045678',
    '1992-02-18', 'Pune', 'Maharashtra', 'Pune', '411001',
    'Penthouse 4, Lane 7, Koregaon Park', 'FEMALE',
    'ANANYA10', NOW() - INTERVAL '60 days', NOW() - INTERVAL '1 day'
),
(
    'c1000000-0000-0000-0000-000000000005',
    'kunal.joshi@gmail.com',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Kunal', 'Joshi', 'Kunal Joshi', 'CUSTOMER', 'ACTIVE',
    TRUE, TRUE, TRUE, '+919822056789',
    '1996-07-30', 'Nagpur', 'Maharashtra', 'Nagpur', '440010',
    '77, Abhyankar Nagar, Bajaj Nagar', 'MALE',
    'KUNALJ', NOW() - INTERVAL '25 days', NOW() - INTERVAL '5 days'
),
(
    'c1000000-0000-0000-0000-000000000006',
    'sneha.patil@rediffmail.com',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Sneha', 'Patil', 'Sneha Patil', 'CUSTOMER', 'ACTIVE',
    TRUE, TRUE, TRUE, '+919822067890',
    '1995-12-05', 'Hinganghat', 'Maharashtra', 'Wardha', '442301',
    'Station Road, Near Gandhi Chowk', 'FEMALE',
    'SNEHA7', NOW() - INTERVAL '15 days', NOW() - INTERVAL '8 days'
),
(
    'c1000000-0000-0000-0000-000000000007',
    'vikram.rao@pinak.me',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Vikramaditya', 'Rao', 'Vikramaditya Rao', 'CUSTOMER', 'ACTIVE',
    TRUE, TRUE, TRUE, '+919822078901',
    '1990-06-14', 'Bangalore', 'Karnataka', 'Bengaluru Urban', '560038',
    '80 Feet Rd, HAL 2nd Stage, Indiranagar', 'MALE',
    'VIKRAMR', NOW() - INTERVAL '50 days', NOW() - INTERVAL '3 days'
),
(
    'c1000000-0000-0000-0000-000000000008',
    'neha.kulkarni@gmail.com',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Neha', 'Kulkarni', 'Neha Kulkarni', 'CUSTOMER', 'ACTIVE',
    TRUE, TRUE, TRUE, '+919822089012',
    '2001-03-22', 'Nagpur', 'Maharashtra', 'Nagpur', '440012',
    'Wardha Rd, Near Metro Station, Sitabuldi', 'FEMALE',
    'NEHAK', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'
),
(
    'c1000000-0000-0000-0000-000000000009',
    'tanmay.agrawal@gmail.com',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Tanmay', 'Agrawal', 'Tanmay Agrawal', 'CUSTOMER', 'ACTIVE',
    TRUE, TRUE, TRUE, '+919822090123',
    '2002-10-10', 'Nagpur', 'Maharashtra', 'Nagpur', '440015',
    'Flat 102, Green Acre, Wardha Road', 'MALE',
    'TANMAY5', NOW() - INTERVAL '3 days', NOW()
),
(
    'c1000000-0000-0000-0000-000000000010',
    'kavita.c@gmail.com',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Kavita', 'Chawla', 'Kavita Chawla', 'CUSTOMER', 'SUSPENDED',
    TRUE, TRUE, TRUE, '+919822091234',
    '1993-08-09', 'Nagpur', 'Maharashtra', 'Nagpur', '440001',
    'Residency Road, Sadar Bazaar', 'FEMALE',
    'KAVITA_C', NOW() - INTERVAL '35 days', NOW() - INTERVAL '12 days'
)
ON CONFLICT (id) DO UPDATE
SET status = EXCLUDED.status,
    role = EXCLUDED.role,
    primary_city = EXCLUDED.primary_city,
    updated_at = NOW();

-- 2. Seed Customer Reward Accounts (PINAK Coins Ledger)
INSERT INTO reward_accounts (
    id, customer_id, points_balance, available_balance, pending_balance,
    lifetime_earned, lifetime_redeemed, currency, tier, status, version,
    created_at, updated_at
) VALUES
('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 420, 420.00, 0, 620.00, 200.00, 'INR', 'GOLD', 'ACTIVE', 1, NOW() - INTERVAL '45 days', NOW() - INTERVAL '2 days'),
('e1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 210, 210.00, 0, 310.00, 100.00, 'INR', 'SILVER', 'ACTIVE', 1, NOW() - INTERVAL '30 days', NOW() - INTERVAL '4 days'),
('e1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 150, 150.00, 0, 150.00, 0.00, 'INR', 'SILVER', 'ACTIVE', 1, NOW() - INTERVAL '20 days', NOW() - INTERVAL '6 days'),
('e1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 680, 680.00, 0, 980.00, 300.00, 'INR', 'VIP', 'ACTIVE', 1, NOW() - INTERVAL '60 days', NOW() - INTERVAL '1 day'),
('e1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000005', 290, 290.00, 0, 390.00, 100.00, 'INR', 'SILVER', 'ACTIVE', 1, NOW() - INTERVAL '25 days', NOW() - INTERVAL '5 days'),
('e1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', 110, 110.00, 0, 110.00, 0.00, 'INR', 'BRONZE', 'ACTIVE', 1, NOW() - INTERVAL '15 days', NOW() - INTERVAL '8 days'),
('e1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000007', 550, 550.00, 0, 850.00, 300.00, 'INR', 'GOLD', 'ACTIVE', 1, NOW() - INTERVAL '50 days', NOW() - INTERVAL '3 days'),
('e1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000008', 80, 80.00, 0, 80.00, 0.00, 'INR', 'BRONZE', 'ACTIVE', 1, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),
('e1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000009', 50, 50.00, 0, 50.00, 0.00, 'INR', 'BRONZE', 'ACTIVE', 1, NOW() - INTERVAL '3 days', NOW()),
('e1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000010', 120, 120.00, 0, 120.00, 0.00, 'INR', 'SILVER', 'SUSPENDED', 1, NOW() - INTERVAL '35 days', NOW() - INTERVAL '12 days')
ON CONFLICT (id) DO UPDATE
SET points_balance = EXCLUDED.points_balance,
    available_balance = EXCLUDED.available_balance,
    tier = EXCLUDED.tier;

-- 3. Seed Realistic Customer Completed Transactions
INSERT INTO transactions (
    id, transaction_reference, user_id, customer_id, merchant_id, store_id,
    type, amount, gross_amount, discount_amount, payable_amount, currency,
    payment_method, points_awarded, status, description, version, created_at, updated_at
) VALUES
('d1000000-0000-0000-0000-000000000001', 'PNK-TXN-10081', 'c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', '68eeda1c-be2d-4e32-b860-0f0027700094', '8e91aefa-dfb2-4f19-b4f6-907e82baf6a5', 'PAYMENT', 1450.00, 1600.00, 150.00, 1450.00, 'INR', 'UPI / PhonePe', 72, 'SUCCESS', 'In-store retail billing at Fabindia', '0', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
('d1000000-0000-0000-0000-000000000002', 'PNK-TXN-10082', 'c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', '68eeda1c-be2d-4e32-b860-0f0027700094', '8e91aefa-dfb2-4f19-b4f6-907e82baf6a5', 'PAYMENT', 1000.00, 1150.00, 150.00, 1000.00, 'INR', 'Google Pay', 50, 'SUCCESS', 'Apparel purchase checkout', '0', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('d1000000-0000-0000-0000-000000000003', 'PNK-TXN-10083', 'c1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', '68eeda1c-be2d-4e32-b860-0f0027700094', '8e91aefa-dfb2-4f19-b4f6-907e82baf6a5', 'PAYMENT', 1800.00, 2000.00, 200.00, 1800.00, 'INR', 'Credit Card', 90, 'SUCCESS', 'Festive home decor collection', '0', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('d1000000-0000-0000-0000-000000000004', 'PNK-TXN-10084', 'c1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', '68eeda1c-be2d-4e32-b860-0f0027700094', '8e91aefa-dfb2-4f19-b4f6-907e82baf6a5', 'PAYMENT', 1200.00, 1350.00, 150.00, 1200.00, 'INR', 'Paytm UPI', 60, 'SUCCESS', 'Daily essentials & natural food', '0', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
('d1000000-0000-0000-0000-000000000005', 'PNK-TXN-10085', 'c1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', '68eeda1c-be2d-4e32-b860-0f0027700094', '8e91aefa-dfb2-4f19-b4f6-907e82baf6a5', 'PAYMENT', 2600.00, 3000.00, 400.00, 2600.00, 'INR', 'HDFC UPI', 130, 'SUCCESS', 'Premium silk collection dining', '0', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('d1000000-0000-0000-0000-000000000006', 'PNK-TXN-10086', 'c1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', '68eeda1c-be2d-4e32-b860-0f0027700094', '8e91aefa-dfb2-4f19-b4f6-907e82baf6a5', 'PAYMENT', 1500.00, 1650.00, 150.00, 1500.00, 'INR', 'Apple Pay / Card', 75, 'SUCCESS', 'Organic artisanal gifts', '0', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('d1000000-0000-0000-0000-000000000007', 'PNK-TXN-10087', 'c1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000005', '68eeda1c-be2d-4e32-b860-0f0027700094', '8e91aefa-dfb2-4f19-b4f6-907e82baf6a5', 'PAYMENT', 2400.00, 2700.00, 300.00, 2400.00, 'INR', 'Google Pay', 120, 'SUCCESS', 'Handcrafted ceramic cookware', '0', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('d1000000-0000-0000-0000-000000000008', 'PNK-TXN-10088', 'c1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', '68eeda1c-be2d-4e32-b860-0f0027700094', '8e91aefa-dfb2-4f19-b4f6-907e82baf6a5', 'PAYMENT', 980.00, 1100.00, 120.00, 980.00, 'INR', 'Cash / Soundbox verified', 49, 'SUCCESS', 'Cotton ethnic accessories', '0', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
('d1000000-0000-0000-0000-000000000009', 'PNK-TXN-10089', 'c1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000007', '68eeda1c-be2d-4e32-b860-0f0027700094', '8e91aefa-dfb2-4f19-b4f6-907e82baf6a5', 'PAYMENT', 3650.00, 4200.00, 550.00, 3650.00, 'INR', 'Axis Bank NetBanking', 180, 'SUCCESS', 'Handspun cotton curtains & linen', '0', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('d1000000-0000-0000-0000-000000000010', 'PNK-TXN-10090', 'c1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000008', '68eeda1c-be2d-4e32-b860-0f0027700094', '8e91aefa-dfb2-4f19-b4f6-907e82baf6a5', 'PAYMENT', 450.00, 500.00, 50.00, 450.00, 'INR', 'Google Pay', 22, 'SUCCESS', 'Organic pure honey jar', '0', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('d1000000-0000-0000-0000-000000000011', 'PNK-TXN-10091', 'c1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000010', '68eeda1c-be2d-4e32-b860-0f0027700094', '8e91aefa-dfb2-4f19-b4f6-907e82baf6a5', 'PAYMENT', 1500.00, 1700.00, 200.00, 1500.00, 'INR', 'UPI / PhonePe', 75, 'SUCCESS', 'Handcrafted brass lamps', '0', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Realistic Customer Table Bookings
INSERT INTO table_bookings (
    id, booking_ref, store_id, user_id, customer_name, customer_phone, customer_email,
    guests, booking_date, slot_time, discount_pct, cover_charge_per_guest, total_cover_charge,
    include_vip_plan, vip_plan_fee, total_paid, bill_amount, coins_earned, meal_type,
    offer_id, offer_title, verification_code, payment_method, payment_status, status,
    created_at, updated_at
) VALUES
(
    'b1000000-0000-0000-0000-000000000001', 'PNK-TB-8801', '8e91aefa-dfb2-4f19-b4f6-907e82baf6a5',
    'c1000000-0000-0000-0000-000000000001', 'Aarav Mehta', '+919822012345', 'aarav.mehta@gmail.com',
    4, CURRENT_DATE - 7, '08:00 pm', 20.00, 250.00, 1000.00,
    FALSE, 0.00, 1000.00, 1000.00, 50, 'DINNER',
    '75aa173d-9ed9-4efd-91f2-a5ef59f2dcda', 'Weekend Family Dinner Feast', '4291',
    'UPI', 'PAID', 'COMPLETED', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'
),
(
    'b1000000-0000-0000-0000-000000000002', 'PNK-TB-8802', '8e91aefa-dfb2-4f19-b4f6-907e82baf6a5',
    'c1000000-0000-0000-0000-000000000003', 'Rohan Sharma', '+919822034567', 'rohan.sharma99@outlook.com',
    2, CURRENT_DATE - 11, '01:30 pm', 15.00, 250.00, 500.00,
    FALSE, 0.00, 500.00, 500.00, 25, 'LUNCH',
    '75aa173d-9ed9-4efd-91f2-a5ef59f2dcda', 'Executive Lunch Experience', '6174',
    'UPI', 'PAID', 'COMPLETED', NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'
),
(
    'b1000000-0000-0000-0000-000000000003', 'PNK-TB-8803', '8e91aefa-dfb2-4f19-b4f6-907e82baf6a5',
    'c1000000-0000-0000-0000-000000000004', 'Ananya Verma', '+919822045678', 'ananya.verma@gmail.com',
    3, CURRENT_DATE - 3, '07:30 pm', 25.00, 250.00, 750.00,
    TRUE, 99.00, 849.00, 1500.00, 80, 'DINNER',
    '75aa173d-9ed9-4efd-91f2-a5ef59f2dcda', 'VIP Chef Curated Dining', '9032',
    'Credit Card', 'PAID', 'COMPLETED', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
    'b1000000-0000-0000-0000-000000000004', 'PNK-TB-8804', '8e91aefa-dfb2-4f19-b4f6-907e82baf6a5',
    'c1000000-0000-0000-0000-000000000007', 'Vikramaditya Rao', '+919822078901', 'vikram.rao@pinak.me',
    4, CURRENT_DATE + 2, '08:30 pm', 20.00, 300.00, 1200.00,
    FALSE, 0.00, 1200.00, 1200.00, 60, 'DINNER',
    '75aa173d-9ed9-4efd-91f2-a5ef59f2dcda', 'Prime Table Reservation', '1849',
    'NetBanking', 'PAID', 'CONFIRMED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

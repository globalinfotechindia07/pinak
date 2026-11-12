-- ==============================================================================
-- V26: Purge All Seeded Dummy Customer Records
-- Cleans out mock/seeded customers so the customer base contains ONLY real users
-- created via the Mobile Postman API or genuine consumer registration.
-- ==============================================================================

-- 1. Purge table bookings linked to seeded customers
DELETE FROM table_bookings 
WHERE user_id IN (SELECT id FROM users WHERE role = 'CUSTOMER' AND (id::text LIKE 'c1000000%' OR id::text LIKE 'c2000000%'));

-- 2. Purge transactions linked to seeded customers
DELETE FROM transactions 
WHERE user_id IN (SELECT id FROM users WHERE role = 'CUSTOMER' AND (id::text LIKE 'c1000000%' OR id::text LIKE 'c2000000%'))
   OR customer_id IN (SELECT id FROM users WHERE role = 'CUSTOMER' AND (id::text LIKE 'c1000000%' OR id::text LIKE 'c2000000%'));

-- 3. Purge payments linked to seeded customers
DELETE FROM payments 
WHERE user_id IN (SELECT id FROM users WHERE role = 'CUSTOMER' AND (id::text LIKE 'c1000000%' OR id::text LIKE 'c2000000%'))
   OR customer_id IN (SELECT id FROM users WHERE role = 'CUSTOMER' AND (id::text LIKE 'c1000000%' OR id::text LIKE 'c2000000%'));

-- 4. Purge reward ledger entries & reward transactions
DELETE FROM reward_ledger_entries 
WHERE customer_id IN (SELECT id FROM users WHERE role = 'CUSTOMER' AND (id::text LIKE 'c1000000%' OR id::text LIKE 'c2000000%'));

DELETE FROM reward_transactions 
WHERE account_id IN (
    SELECT id FROM reward_accounts 
    WHERE customer_id IN (SELECT id FROM users WHERE role = 'CUSTOMER' AND (id::text LIKE 'c1000000%' OR id::text LIKE 'c2000000%'))
       OR id::text LIKE 'e1000000%' OR id::text LIKE 'e2000000%'
);

-- 5. Purge reward accounts linked to seeded customers
DELETE FROM reward_accounts 
WHERE customer_id IN (SELECT id FROM users WHERE role = 'CUSTOMER' AND (id::text LIKE 'c1000000%' OR id::text LIKE 'c2000000%'))
   OR id::text LIKE 'e1000000%' OR id::text LIKE 'e2000000%';

-- 6. Purge redemptions & offer redemptions
DELETE FROM redemptions 
WHERE user_id IN (SELECT id FROM users WHERE role = 'CUSTOMER' AND (id::text LIKE 'c1000000%' OR id::text LIKE 'c2000000%'));

DELETE FROM offer_redemptions 
WHERE user_id IN (SELECT id FROM users WHERE role = 'CUSTOMER' AND (id::text LIKE 'c1000000%' OR id::text LIKE 'c2000000%'));

-- 7. Purge user recently viewed
DELETE FROM user_recently_viewed 
WHERE user_id IN (SELECT id FROM users WHERE role = 'CUSTOMER' AND (id::text LIKE 'c1000000%' OR id::text LIKE 'c2000000%'));

-- 8. Purge notifications
DELETE FROM notifications 
WHERE user_id IN (SELECT id FROM users WHERE role = 'CUSTOMER' AND (id::text LIKE 'c1000000%' OR id::text LIKE 'c2000000%'));

DELETE FROM notification_preferences 
WHERE user_id IN (SELECT id FROM users WHERE role = 'CUSTOMER' AND (id::text LIKE 'c1000000%' OR id::text LIKE 'c2000000%'));

-- 9. Purge sessions and auth tokens
DELETE FROM user_sessions 
WHERE user_id IN (SELECT id FROM users WHERE role = 'CUSTOMER' AND (id::text LIKE 'c1000000%' OR id::text LIKE 'c2000000%'));

DELETE FROM refresh_tokens 
WHERE user_id IN (SELECT id FROM users WHERE role = 'CUSTOMER' AND (id::text LIKE 'c1000000%' OR id::text LIKE 'c2000000%'));

DELETE FROM password_reset_tokens 
WHERE user_id IN (SELECT id FROM users WHERE role = 'CUSTOMER' AND (id::text LIKE 'c1000000%' OR id::text LIKE 'c2000000%'));

DELETE FROM audit_logs 
WHERE user_id IN (SELECT id FROM users WHERE role = 'CUSTOMER' AND (id::text LIKE 'c1000000%' OR id::text LIKE 'c2000000%'));

-- 10. Purge mobile OTPs for seeded phones
DELETE FROM mobile_otps 
WHERE phone IN (
    '+919822012345', '+919822023456', '+919822034567', '+919822045678',
    '+919822056789', '+919822067890', '+919822078901', '+919822089012',
    '+919822090123', '+919822091234', '+919876543210'
);

-- 11. Purge seeded customers from users table
DELETE FROM users 
WHERE role = 'CUSTOMER' AND (id::text LIKE 'c1000000%' OR id::text LIKE 'c2000000%');

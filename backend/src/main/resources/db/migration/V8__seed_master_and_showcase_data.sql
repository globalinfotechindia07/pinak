-- ==============================================================================
-- V8: Master Data Seeder (Super Admin, Taxonomy Categories & Master Cities)
-- Clean production-ready baseline: NO demo merchants, stores, offers, or products.
-- ==============================================================================

-- 1. Seed Core Master User (Super Admin Only)
INSERT INTO users (
    id, email, password, first_name, last_name, name, role, status,
    email_verified, mobile_verified, profile_completed, phone, mobile,
    birthday, primary_city, state, district, pincode, address, gender,
    profile_picture_url
) VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'riya.admin@pinak.app',
    '$2a$12$KqaMkGio6.pUuUQOw286yOvwDRebk84pAMGkGwMdfwA0yLYngFaBS',
    'Riya',
    'Shah',
    'Riya Shah',
    'SUPER_ADMIN',
    'ACTIVE',
    TRUE,
    TRUE,
    TRUE,
    '+919820000001',
    '+919820000001',
    '1995-08-15',
    'Bangalore',
    'Karnataka',
    'Bengaluru Urban',
    '560038',
    '100ft Rd, Indiranagar, Bengaluru, Karnataka',
    'FEMALE',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
)
ON CONFLICT (email) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    phone = EXCLUDED.phone,
    mobile = EXCLUDED.mobile,
    birthday = EXCLUDED.birthday,
    primary_city = EXCLUDED.primary_city,
    state = EXCLUDED.state,
    district = EXCLUDED.district,
    pincode = EXCLUDED.pincode,
    address = EXCLUDED.address,
    gender = EXCLUDED.gender,
    profile_picture_url = EXCLUDED.profile_picture_url;

-- 2. Staff Assignments (Super Admin Only)
INSERT INTO staff_members (id, user_id, role_id, scope, merchant_id, store_id, status, last_login_at)
VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'SUPERADMIN',
    'PLATFORM',
    NULL,
    NULL,
    'ACTIVE',
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    status = EXCLUDED.status,
    last_login_at = EXCLUDED.last_login_at,
    updated_at = CURRENT_TIMESTAMP;

-- 3. Seed Taxonomy Categories
INSERT INTO categories (id, name, slug, description, icon, display_order, status)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'Dining', 'dining', 'Restaurants, bistros, gourmet dining & buffets', 'utensils', 1, 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111102', 'Cafes', 'cafes', 'Artisan cafes, manual brews & bakeries', 'coffee', 2, 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111103', 'Supermarket', 'supermarket', 'Large supermarkets, FMCG & household staples', 'shopping-cart', 3, 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111104', 'Kirana', 'kirana', 'Local grocery stores & daily essentials', 'store', 4, 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111105', 'Fashion', 'fashion', 'Apparel, footwear & fashion accessories', 'shirt', 5, 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111106', 'Electronics', 'electronics', 'Smartphones, audio, appliances & gadgets', 'laptop', 6, 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111107', 'Hardware', 'hardware', 'Tools, paints, sanitaryware & hardware', 'wrench', 7, 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111108', 'Salons', 'salons', 'Hair styling, beauty parlors & grooming', 'scissors', 8, 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111109', 'Gyms', 'gyms', 'Fitness centers, pilates, boxing & crossfit', 'dumbbell', 9, 'ACTIVE'),
    ('11111111-1111-1111-1111-111111111110', 'Automotive', 'automotive', 'Car care, bike servicing & detailing spas', 'car', 10, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Master Cities
INSERT INTO cities (id, name, slug, state, country, status)
VALUES
    ('blr', 'Bengaluru', 'bengaluru', 'Karnataka', 'India', 'ACTIVE'),
    ('mum', 'Mumbai', 'mumbai', 'Maharashtra', 'India', 'ACTIVE'),
    ('del', 'Delhi NCR', 'delhi-ncr', 'Delhi', 'India', 'ACTIVE'),
    ('hyd', 'Hyderabad', 'hyderabad', 'Telangana', 'India', 'ACTIVE'),
    ('pun', 'Pune', 'pune', 'Maharashtra', 'India', 'ACTIVE'),
    ('nagpur', 'Nagpur', 'nagpur', 'Maharashtra', 'India', 'ACTIVE'),
    ('ahmedabad', 'Ahmedabad', 'ahmedabad', 'Gujarat', 'India', 'ACTIVE'),
    ('surat', 'Surat', 'surat', 'Gujarat', 'India', 'ACTIVE'),
    ('jaipur', 'Jaipur', 'jaipur', 'Rajasthan', 'India', 'ACTIVE'),
    ('lucknow', 'Lucknow', 'lucknow', 'Uttar Pradesh', 'India', 'ACTIVE'),
    ('kanpur', 'Kanpur', 'kanpur', 'Uttar Pradesh', 'India', 'ACTIVE'),
    ('indore', 'Indore', 'indore', 'Madhya Pradesh', 'India', 'ACTIVE'),
    ('thane', 'Thane', 'thane', 'Maharashtra', 'India', 'ACTIVE'),
    ('bhopal', 'Bhopal', 'bhopal', 'Madhya Pradesh', 'India', 'ACTIVE'),
    ('visakhapatnam', 'Visakhapatnam', 'visakhapatnam', 'Andhra Pradesh', 'India', 'ACTIVE'),
    ('patna', 'Patna', 'patna', 'Bihar', 'India', 'ACTIVE'),
    ('vadodara', 'Vadodara', 'vadodara', 'Gujarat', 'India', 'ACTIVE'),
    ('ghaziabad', 'Ghaziabad', 'ghaziabad', 'Uttar Pradesh', 'India', 'ACTIVE'),
    ('ludhiana', 'Ludhiana', 'ludhiana', 'Punjab', 'India', 'ACTIVE'),
    ('agra', 'Agra', 'agra', 'Uttar Pradesh', 'India', 'ACTIVE'),
    ('nashik', 'Nashik', 'nashik', 'Maharashtra', 'India', 'ACTIVE'),
    ('faridabad', 'Faridabad', 'faridabad', 'Haryana', 'India', 'ACTIVE'),
    ('meerut', 'Meerut', 'meerut', 'Uttar Pradesh', 'India', 'ACTIVE'),
    ('rajkot', 'Rajkot', 'rajkot', 'Gujarat', 'India', 'ACTIVE'),
    ('varanasi', 'Varanasi', 'varanasi', 'Uttar Pradesh', 'India', 'ACTIVE'),
    ('srinagar', 'Srinagar', 'srinagar', 'Jammu & Kashmir', 'India', 'ACTIVE'),
    ('aurangabad', 'Chhatrapati Sambhajinagar', 'aurangabad', 'Maharashtra', 'India', 'ACTIVE'),
    ('dhanbad', 'Dhanbad', 'dhanbad', 'Jharkhand', 'India', 'ACTIVE'),
    ('amritsar', 'Amritsar', 'amritsar', 'Punjab', 'India', 'ACTIVE'),
    ('navi-mumbai', 'Navi Mumbai', 'navi-mumbai', 'Maharashtra', 'India', 'ACTIVE'),
    ('allahabad', 'Prayagraj', 'allahabad', 'Uttar Pradesh', 'India', 'ACTIVE'),
    ('ranchi', 'Ranchi', 'ranchi', 'Jharkhand', 'India', 'ACTIVE'),
    ('howrah', 'Howrah', 'howrah', 'West Bengal', 'India', 'ACTIVE'),
    ('coimbatore', 'Coimbatore', 'coimbatore', 'Tamil Nadu', 'India', 'ACTIVE'),
    ('jabalpur', 'Jabalpur', 'jabalpur', 'Madhya Pradesh', 'India', 'ACTIVE'),
    ('gwalior', 'Gwalior', 'gwalior', 'Madhya Pradesh', 'India', 'ACTIVE'),
    ('vijayawada', 'Vijayawada', 'vijayawada', 'Andhra Pradesh', 'India', 'ACTIVE'),
    ('jodhpur', 'Jodhpur', 'jodhpur', 'Rajasthan', 'India', 'ACTIVE'),
    ('madurai', 'Madurai', 'madurai', 'Tamil Nadu', 'India', 'ACTIVE'),
    ('raipur', 'Raipur', 'raipur', 'Chhattisgarh', 'India', 'ACTIVE'),
    ('kota', 'Kota', 'kota', 'Rajasthan', 'India', 'ACTIVE'),
    ('chandigarh', 'Chandigarh', 'chandigarh', 'Chandigarh', 'India', 'ACTIVE'),
    ('guwahati', 'Guwahati', 'guwahati', 'Assam', 'India', 'ACTIVE'),
    ('solapur', 'Solapur', 'solapur', 'Maharashtra', 'India', 'ACTIVE'),
    ('hubli-dharwad', 'Hubli-Dharwad', 'hubli-dharwad', 'Karnataka', 'India', 'ACTIVE'),
    ('mysore', 'Mysore', 'mysore', 'Karnataka', 'India', 'ACTIVE'),
    ('tiruchirappalli', 'Tiruchirappalli', 'tiruchirappalli', 'Tamil Nadu', 'India', 'ACTIVE'),
    ('bareilly', 'Bareilly', 'bareilly', 'Uttar Pradesh', 'India', 'ACTIVE'),
    ('aligarh', 'Aligarh', 'aligarh', 'Uttar Pradesh', 'India', 'ACTIVE'),
    ('tiruppur', 'Tiruppur', 'tiruppur', 'Tamil Nadu', 'India', 'ACTIVE'),
    ('gurgaon', 'Gurugram', 'gurgaon', 'Haryana', 'India', 'ACTIVE'),
    ('moradabad', 'Moradabad', 'moradabad', 'Uttar Pradesh', 'India', 'ACTIVE'),
    ('jalandhar', 'Jalandhar', 'jalandhar', 'Punjab', 'India', 'ACTIVE'),
    ('bhubaneswar', 'Bhubaneswar', 'bhubaneswar', 'Odisha', 'India', 'ACTIVE'),
    ('salem', 'Salem', 'salem', 'Tamil Nadu', 'India', 'ACTIVE'),
    ('warangal', 'Warangal', 'warangal', 'Telangana', 'India', 'ACTIVE'),
    ('jalgaon', 'Jalgaon', 'jalgaon', 'Maharashtra', 'India', 'ACTIVE'),
    ('noida', 'Noida', 'noida', 'Uttar Pradesh', 'India', 'ACTIVE'),
    ('kochi', 'Kochi', 'kochi', 'Kerala', 'India', 'ACTIVE'),
    ('dehradun', 'Dehradun', 'dehradun', 'Uttarakhand', 'India', 'ACTIVE'),
    ('jammu', 'Jammu', 'jammu', 'Jammu & Kashmir', 'India', 'ACTIVE'),
    ('kolkata', 'Kolkata', 'kolkata', 'West Bengal', 'India', 'ACTIVE'),
    ('chennai', 'Chennai', 'chennai', 'Tamil Nadu', 'India', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Discovery Curation Formula
INSERT INTO discovery_curation_config (id, config_key, ranking_weights, featured_store_ids, updated_by)
VALUES (
    'd15c0000-0000-0000-0000-000000000001',
    'GLOBAL_MOBILE_DISCOVERY',
    '{"distance": 45, "discountValue": 30, "rating": 15, "popularity": 10}'::jsonb,
    '{}'::jsonb,
    'SYSTEM'
)
ON CONFLICT (config_key) DO NOTHING;

-- ==============================================================================
-- V10: Add Merchant Registered Location Columns and Seed Major Indian Cities
-- ==============================================================================

-- 1. Add location fields to merchants table (Headquarters / Registered Office)
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS district VARCHAR(100),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS pincode VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT;

CREATE INDEX IF NOT EXISTS idx_merchants_state ON merchants(state);
CREATE INDEX IF NOT EXISTS idx_merchants_city ON merchants(city);
CREATE INDEX IF NOT EXISTS idx_merchants_pincode ON merchants(pincode);

-- 2. Seed Major Indian Cities to ensure foreign keys on stores(city_id) always resolve
INSERT INTO cities (id, name, slug, state, country, status)
VALUES
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

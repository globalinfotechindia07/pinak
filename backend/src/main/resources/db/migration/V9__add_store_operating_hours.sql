-- V9: Add store operating hours and days of operation to physical branch stores
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS opening_time VARCHAR(10) DEFAULT '10:00',
ADD COLUMN IF NOT EXISTS closing_time VARCHAR(10) DEFAULT '22:00',
ADD COLUMN IF NOT EXISTS operating_days VARCHAR(50) DEFAULT 'Daily (Mon - Sun)';

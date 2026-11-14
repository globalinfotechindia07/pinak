-- ==============================================================================
-- Migration V29: Enforce Merchant Email and Phone Number Unique Constraints
-- Prevents duplicate merchant creation by normalizing and constraining
-- case-insensitive emails and 10-digit Indian phone numbers at DB engine level.
-- ==============================================================================

-- 1. Ensure case-insensitive trimmed unique email index on merchants
DROP INDEX IF EXISTS public.uq_merchants_email_lower;
CREATE UNIQUE INDEX IF NOT EXISTS uq_merchants_email_lower 
ON public.merchants (LOWER(TRIM(email))) 
WHERE email IS NOT NULL AND TRIM(email) != '';

-- 2. Ensure unique index on canonical 10-digit phone suffix (handles +91, 0, spaces, dashes)
CREATE UNIQUE INDEX IF NOT EXISTS uq_merchants_phone_last10 
ON public.merchants ((RIGHT(REGEXP_REPLACE(phone, '\D', '', 'g'), 10))) 
WHERE phone IS NOT NULL AND LENGTH(REGEXP_REPLACE(phone, '\D', '', 'g')) >= 10;

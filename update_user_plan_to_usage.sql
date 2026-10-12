-- =====================================================================
-- HELVIA: UPDATE USER PLAN TO 'USAGE' IN SUPABASE
-- =====================================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- Replace 'user@gmail.com' with the actual user's email address.
-- =====================================================================

-- ---------------------------------------------------------------------
-- OPTION 1: 1-MONTH UNLIMITED VIP PLAN (₹1,999 / $24)
-- Grants Unlimited Minutes, Unlimited AI Answers, Unlimited Job Applies,
-- with 30-day expiration.
-- ---------------------------------------------------------------------
UPDATE public.users
SET 
  plan = 'usage',
  seconds_remaining = 999999 * 60, -- 59,999,940 seconds (~unlimited)
  responses_remaining = 999999,
  applications_remaining = 999999,
  login_verifier = true,
  verifier = true,
  plan_expires_at = NOW() + INTERVAL '30 days',
  updated_at = NOW()
WHERE LOWER(TRIM(email)) = LOWER(TRIM('user@gmail.com'));

-- Verify the update
SELECT id, email, plan, ROUND(seconds_remaining / 60.0, 0) AS minutes_remaining, 
       responses_remaining, applications_remaining, plan_expires_at, updated_at
FROM public.users
WHERE LOWER(TRIM(email)) = LOWER(TRIM('user@gmail.com'));


-- ---------------------------------------------------------------------
-- OPTION 2: STANDARD USAGE PLAN ($8 / ₹599)
-- 300 Remote Minutes, 500 AI Answers, 200 Job Auto-Applies
-- ---------------------------------------------------------------------
/*
UPDATE public.users
SET 
  plan = 'usage',
  seconds_remaining = 300 * 60, -- 18,000s
  responses_remaining = 500,
  applications_remaining = 200,
  login_verifier = true,
  verifier = true,
  plan_expires_at = NULL,
  updated_at = NOW()
WHERE LOWER(TRIM(email)) = LOWER(TRIM('user@gmail.com'));
*/


-- ---------------------------------------------------------------------
-- OPTION 3: PRO+ USAGE PLAN ($15 / ₹999)
-- 1,000 Remote Minutes, 1,500 AI Answers, 600 Job Auto-Applies
-- ---------------------------------------------------------------------
/*
UPDATE public.users
SET 
  plan = 'usage',
  seconds_remaining = 1000 * 60, -- 60,000s
  responses_remaining = 1500,
  applications_remaining = 600,
  login_verifier = true,
  verifier = true,
  plan_expires_at = NULL,
  updated_at = NOW()
WHERE LOWER(TRIM(email)) = LOWER(TRIM('user@gmail.com'));
*/


-- ---------------------------------------------------------------------
-- OPTION 4: SIMPLE PLAN SWITCH ONLY (Keep existing token balances)
-- ---------------------------------------------------------------------
/*
UPDATE public.users
SET 
  plan = 'usage',
  login_verifier = true,
  verifier = true,
  updated_at = NOW()
WHERE LOWER(TRIM(email)) = LOWER(TRIM('user@gmail.com'));
*/

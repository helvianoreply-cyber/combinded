-- =====================================================================
-- HELVIA: ADD PLAN EXPIRATION & AUTO-DOWNGRADE FOR 1-MONTH UNLIMITED VIP
-- =====================================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- 
-- This adds the plan_expires_at column to public.users and creates
-- a stored procedure to automatically downgrade expired accounts
-- back to 'basic' with 0 tokens.
-- =====================================================================

-- 1. Add plan_expires_at column to public.users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- 2. Create index for high-speed expiration checking
CREATE INDEX IF NOT EXISTS users_plan_expires_at_idx 
ON public.users (plan_expires_at) 
WHERE plan_expires_at IS NOT NULL;

-- 3. Stored Procedure: Downgrade Expired 1-Month Plans
-- Downgrades any account whose 30-day period has passed:
-- - plan -> 'basic'
-- - seconds_remaining -> 0
-- - responses_remaining -> 0
-- - applications_remaining -> 0
-- - plan_expires_at -> NULL
CREATE OR REPLACE FUNCTION public.downgrade_expired_plans()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  downgraded_count INTEGER;
BEGIN
  UPDATE public.users
  SET 
    plan = 'basic',
    seconds_remaining = 0,
    responses_remaining = 0,
    applications_remaining = 0,
    plan_expires_at = NULL,
    updated_at = NOW()
  WHERE 
    plan_expires_at IS NOT NULL 
    AND plan_expires_at <= NOW();

  GET DIAGNOSTICS downgraded_count = ROW_COUNT;
  RETURN downgraded_count;
END;
$$;

-- Grant execution permissions to service_role and authenticated users
GRANT EXECUTE ON FUNCTION public.downgrade_expired_plans() TO service_role;
GRANT EXECUTE ON FUNCTION public.downgrade_expired_plans() TO authenticated;

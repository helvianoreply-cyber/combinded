-- =====================================================================
-- HELVIA: FIX STARTER TRIAL TOKENS IN SUPABASE SCHEMA & TRIGGERS
-- =====================================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
--
-- This ensures:
-- 1. Any newly created account automatically receives:
--    - 5 Minutes Remote / Meeting Time (300 seconds)
--    - 5 AI Screen Vision Answers
--    - 3 Job Auto-Applies
-- 2. Sets column DEFAULT values in public.users so even raw inserts or 
--    auth triggers automatically assign the correct values.
-- =====================================================================

-- 1. Set column default values on public.users
ALTER TABLE public.users 
  ALTER COLUMN seconds_remaining SET DEFAULT 300,
  ALTER COLUMN responses_remaining SET DEFAULT 5,
  ALTER COLUMN applications_remaining SET DEFAULT 3,
  ALTER COLUMN seconds_used SET DEFAULT 0,
  ALTER COLUMN responses_used SET DEFAULT 0,
  ALTER COLUMN applications_applied SET DEFAULT 0,
  ALTER COLUMN plan SET DEFAULT 'basic';

-- 2. If you use a handle_new_user trigger on auth.users, update it to use 300, 5, 3:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    plan,
    seconds_remaining,
    responses_remaining,
    applications_remaining,
    seconds_used,
    responses_used,
    applications_applied,
    verifier,
    login_verifier,
    session_verifier,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    'basic',
    300,  -- 5 minutes
    5,    -- 5 AI answers
    3,    -- 3 job applies
    0,
    0,
    0,
    false,
    false,
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. One-time clean-up: Update any existing basic accounts that have 0 usage and 0 tokens
UPDATE public.users
SET 
  seconds_remaining = 300,
  responses_remaining = 5,
  applications_remaining = 3,
  updated_at = NOW()
WHERE 
  plan = 'basic'
  AND (plan_expires_at IS NULL)
  AND (COALESCE(seconds_used, 0) = 0)
  AND (COALESCE(responses_used, 0) = 0)
  AND (COALESCE(applications_applied, 0) = 0)
  AND (
    (COALESCE(seconds_remaining, 0) = 0 AND COALESCE(responses_remaining, 0) = 0)
    OR COALESCE(applications_remaining, 0) = 10
  );


-- =====================================================================
-- HELVIA: FIX STARTER TOKENS & VERIFIERS IN SUPABASE SCHEMA
-- =====================================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
--
-- This ensures:
-- 1. All new accounts are created with:
--    - 5 Minutes Remote / Meeting Time (300 seconds)
--    - 5 AI Screen Vision Answers (5 responses)
--    - 3 Job Auto-Applies (3 applications)
--    - verifier = false
--    - session_verifier = false
--    - login_verifier = false
-- =====================================================================

-- 1. Set column default values on public.users
ALTER TABLE public.users 
  ALTER COLUMN seconds_remaining SET DEFAULT 300,
  ALTER COLUMN responses_remaining SET DEFAULT 5,
  ALTER COLUMN applications_remaining SET DEFAULT 3,
  ALTER COLUMN seconds_used SET DEFAULT 0,
  ALTER COLUMN responses_used SET DEFAULT 0,
  ALTER COLUMN applications_applied SET DEFAULT 0,
  ALTER COLUMN verifier SET DEFAULT false,
  ALTER COLUMN session_verifier SET DEFAULT false,
  ALTER COLUMN login_verifier SET DEFAULT false,
  ALTER COLUMN plan SET DEFAULT 'basic';

-- 2. If you use a handle_new_user trigger on auth.users:
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
    300,    -- 5 minutes
    5,      -- 5 AI answers
    3,      -- 3 job applies
    0,
    0,
    0,
    false,  -- verifier must be false
    false,  -- login_verifier must be false
    false,  -- session_verifier must be false
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

-- 3. One-time clean-up: Update any existing basic accounts that have verifiers set to true or 0 tokens
UPDATE public.users
SET 
  seconds_remaining = CASE WHEN COALESCE(seconds_used, 0) = 0 AND (COALESCE(seconds_remaining, 0) = 0 OR COALESCE(applications_remaining, 0) = 10) THEN 300 ELSE seconds_remaining END,
  responses_remaining = CASE WHEN COALESCE(responses_used, 0) = 0 AND (COALESCE(responses_remaining, 0) = 0 OR COALESCE(applications_remaining, 0) = 10) THEN 5 ELSE responses_remaining END,
  applications_remaining = CASE WHEN COALESCE(applications_applied, 0) = 0 AND (COALESCE(responses_remaining, 0) = 0 OR COALESCE(applications_remaining, 0) = 10) THEN 3 ELSE applications_remaining END,
  verifier = false,
  session_verifier = false,
  login_verifier = false,
  updated_at = NOW()
WHERE 
  plan = 'basic'
  AND (plan_expires_at IS NULL);

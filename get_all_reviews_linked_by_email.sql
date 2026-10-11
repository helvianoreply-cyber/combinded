-- =====================================================================
-- HELVIA: GET ALL REVIEWS LINKED BY EMAIL WITH USER ACCOUNTS
-- =====================================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- It joins every honest review with the user's account details by email.

-- 1. Ensure public.app_reviews exists with UNIQUE(email) constraint
CREATE TABLE IF NOT EXISTS public.app_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL UNIQUE,
  rating INTEGER DEFAULT 5,
  issues TEXT,
  suggestions TEXT,
  bonus_seconds INTEGER DEFAULT 7200,
  bonus_responses INTEGER DEFAULT 300,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS app_reviews_lower_email_idx 
ON public.app_reviews (LOWER(email));

ALTER TABLE public.app_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access on app_reviews"
ON public.app_reviews
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================================
-- 2. DIRECT SELECT: All Reviews Linked with User Account by Email
-- =====================================================================
SELECT 
  r.id                      AS review_id,
  r.created_at              AS review_submitted_at,
  r.email                   AS reviewer_email,
  r.rating                  AS star_rating,
  r.issues                  AS issues_faced,
  r.suggestions             AS feature_suggestions,
  r.bonus_seconds           AS bonus_seconds_credited,
  r.bonus_responses         AS bonus_responses_credited,
  u.id                      AS user_id,
  u.plan                    AS user_plan,
  ROUND(u.seconds_remaining / 60.0, 1) AS minutes_remaining,
  u.responses_remaining     AS ai_answers_remaining,
  u.applications_remaining  AS auto_apply_jobs_remaining,
  u.verifier                AS is_host_linked,
  u.created_at              AS user_account_created_at
FROM public.app_reviews r
LEFT JOIN public.users u 
  ON LOWER(TRIM(r.email)) = LOWER(TRIM(u.email))
ORDER BY r.created_at DESC;

-- =====================================================================
-- 3. OPTIONAL: Create a permanent View for Supabase Table Editor
-- Once created, you can simply click "reviews_linked_users" in your 
-- Supabase Table Editor to view and filter everything like a spreadsheet!
-- =====================================================================
CREATE OR REPLACE VIEW public.reviews_linked_users AS
SELECT 
  r.id                      AS review_id,
  r.created_at              AS review_date,
  r.email                   AS email,
  r.rating                  AS rating,
  r.issues                  AS issues,
  r.suggestions             AS suggestions,
  u.plan                    AS plan,
  ROUND(u.seconds_remaining / 60.0, 1) AS minutes_remaining,
  u.responses_remaining     AS responses_remaining,
  u.applications_remaining  AS applications_remaining,
  u.verifier                AS host_linked,
  r.bonus_seconds           AS bonus_seconds,
  r.bonus_responses         AS bonus_responses,
  u.id                      AS user_id
FROM public.app_reviews r
LEFT JOIN public.users u 
  ON LOWER(TRIM(r.email)) = LOWER(TRIM(u.email))
ORDER BY r.created_at DESC;

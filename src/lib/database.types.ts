export type PlanTier = 
  | 'basic' 
  | 'pro plus+' 
  | 'usage' 
  | 'standard' 
  | 'pro_plus' 
  | 'max_plus' 
  | 'ultra_plus'

export interface DbUser {
  id: string
  email: string
  plan: PlanTier | string
  verifier: boolean
  created_at?: string
  updated_at?: string
  responses_remaining: number
  responses_used: number
  seconds_remaining: number
  seconds_used: number
  session_verifier: boolean
  applications_remaining: number
  applications_applied: number
  login_verifier: boolean
}

export interface DbPlan {
  id: string
  tier: PlanTier | string
  name: string
  price: number
  created_at?: string
  included_minutes: number
  included_responses: number
  dodo_product_id: string | null
  included_applications: number
}

export const SEED_PLANS: DbPlan[] = [
  {
    id: 'ee803f63-7ffc-4c93-bd79-2cb349c318b1',
    tier: 'basic',
    name: 'Basic Free Tier',
    price: 0,
    included_minutes: 0,
    included_responses: 0,
    dodo_product_id: null,
    included_applications: 0,
  },
  {
    id: '4d569314-3b27-45c8-93ad-3d5c2eebffc0',
    tier: 'usage',
    name: 'Standard Plan',
    price: 8,
    included_minutes: 300,
    included_responses: 500,
    dodo_product_id: 'pdt_0NnIPft32K3WxEEJbH04J',
    included_applications: 200,
  },
  {
    id: 'fdbc4259-cdb8-42b8-a0d5-02b8a7392812',
    tier: 'usage',
    name: 'Pro+ Pro (Most Popular)',
    price: 15,
    included_minutes: 1000,
    included_responses: 1500,
    dodo_product_id: 'pdt_0NnIQ5VyQfhSXYsFLcojZ',
    included_applications: 600,
  },
  {
    id: '13969aad-7309-40ec-9b54-70b39d5b13f6',
    tier: 'pro plus+',
    name: 'Pro Plus+ Lifetime (BYOK)',
    price: 49,
    included_minutes: 0,
    included_responses: 0,
    dodo_product_id: 'pdt_0NnIQqc0EzhEoVKHtBWTx',
    included_applications: 0,
  },
]

/**
 * Standard INR pricing mapping for Razorpay
 */
export function getPlanInrPrice(priceUsd: number): number {
  const p = Number(priceUsd)
  if (p <= 0) return 0
  if (p <= 8) return 699
  if (p <= 15) return 1299
  if (p <= 25) return 2199
  if (p <= 35) return 2999
  if (p <= 49) return 4199
  return Math.round(p * 86)
}

export interface TopupCopilotQuote {
  minutes: number
  responses: number
  priceInr: number
  priceUsd: number
}

export interface TopupAutoApplyQuote {
  applications: number
  priceInr: number
  priceUsd: number
}

/**
 * Dynamic Top-up for AI Meeting Copilot Time & Answers
 */
export function calculateCopilotTopup(minutes: number): TopupCopilotQuote {
  const m = Math.max(60, Math.min(5000, Math.round(minutes)))
  const responses = Math.round(m * 1.6)
  let inr = 99 + Math.round(m * 1.05)
  if (m >= 1000) inr = Math.round(inr * 0.9)
  if (m >= 2000) inr = Math.round(inr * 0.85)
  const usd = Math.max(2, Math.round((inr / 84) * 10) / 10)
  return { minutes: m, responses, priceInr: inr, priceUsd: usd }
}

/**
 * Dynamic Top-up for AI Jobs Auto Apply (Applications)
 */
export function calculateAutoApplyTopup(applications: number): TopupAutoApplyQuote {
  const a = Math.max(50, Math.min(5000, Math.round(applications)))
  let inr = 99 + Math.round(a * 1.4)
  if (a >= 500) inr = Math.round(inr * 0.9)
  if (a >= 1000) inr = Math.round(inr * 0.85)
  if (a >= 2000) inr = Math.round(inr * 0.8)
  const usd = Math.max(2, Math.round((inr / 84) * 10) / 10)
  return { applications: a, priceInr: inr, priceUsd: usd }
}

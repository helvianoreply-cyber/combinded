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
  plan_expires_at?: string | null
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
    included_minutes: 5,
    included_responses: 5,
    dodo_product_id: null,
    included_applications: 5,
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
    id: 'b1e06fa2-5819-48ce-8d07-28d8cf9c4901',
    tier: 'usage',
    name: '1 Month Unlimited VIP',
    price: 21,
    included_minutes: 999999,
    included_responses: 999999,
    dodo_product_id: 'pdt_0Nmfh6M8mQGJT0VvCHDzO',
    included_applications: 999999,
  },
]

/**
 * Standard INR pricing mapping for Razorpay
 * Official Prices:
 * - Basic Free Tier: ₹0
 * - Standard Plan ($8): ₹699
 * - Pro+ Pro ($15): ₹1,299
 * - 1 Month Unlimited VIP ($21 / $24): ₹1,999
 */
export function getPlanInrPrice(priceUsd: number, planNameOrId?: string): number {
  const p = Number(priceUsd)
  const name = String(planNameOrId || '').toLowerCase()
  if (name.includes('unlimited') || name.includes('vip') || planNameOrId === 'b1e06fa2-5819-48ce-8d07-28d8cf9c4901') {
    return 1999
  }
  if (name.includes('pro+') || name.includes('pro plus') || planNameOrId === 'fdbc4259-cdb8-42b8-a0d5-02b8a7392812') {
    return 1299
  }
  if (name.includes('standard') || planNameOrId === '4d569314-3b27-45c8-93ad-3d5c2eebffc0') {
    return 699
  }
  if (p <= 0) return 0
  if (p <= 8) return 699
  if (p <= 15) return 1299
  if (p <= 24) return 1999
  return 1999
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


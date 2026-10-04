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
    id: '867a98bf-9dd0-4b22-bbf5-86d19193632e',
    tier: 'usage',
    name: 'Max+ Pro',
    price: 25,
    included_minutes: 2500,
    included_responses: 3500,
    dodo_product_id: 'pdt_0NnIQFN75jtyT7fIvHQd1',
    included_applications: 1500,
  },
  {
    id: '08545cec-6a37-4922-8456-54481379e290',
    tier: 'usage',
    name: 'Ultra+ Pro',
    price: 35,
    included_minutes: 5000,
    included_responses: 7500,
    dodo_product_id: 'pdt_0NnIQOPYDlQBXyoHj0Mxv',
    included_applications: 3500,
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

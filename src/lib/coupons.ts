export interface CouponInfo {
  code: string
  discountPercent?: number
  discountInr?: number
  offerId?: string // Razorpay Offer ID
  description: string
}

/**
export const OFFICIAL_COUPON_CODE = 'FIRST_50'

/**
 * Single Official Coupon: FIRST_50
 * Distributed to all influencers for 50% instant discount on membership plans.
 * Linked to Razorpay Offer: offer_ThtiX0ut4rhpCT
 */
export const ACTIVE_COUPONS: Record<string, CouponInfo> = {
  FIRST_50: {
    code: 'FIRST_50',
    discountPercent: 50,
    offerId: 'offer_ThtiX0ut4rhpCT',
    description: 'Official 50% Instant Discount (Code: FIRST_50)',
  },
  FIRST50: {
    code: 'FIRST_50',
    discountPercent: 50,
    offerId: 'offer_ThtiX0ut4rhpCT',
    description: 'Official 50% Instant Discount (Code: FIRST_50)',
  },
  OFFER_THTIX0UT4RHPCT: {
    code: 'FIRST_50',
    discountPercent: 50,
    offerId: 'offer_ThtiX0ut4rhpCT',
    description: 'Official 50% Instant Discount (Code: FIRST_50)',
  },
}

/**
 * Validates a coupon code string. Only FIRST_50 is accepted.
 */
export function validateCoupon(code: string): CouponInfo | null {
  const clean = code.trim().replace(/\s+/g, '_').toUpperCase()
  if (!clean) return null

  // Direct match for FIRST_50
  if (ACTIVE_COUPONS[clean]) {
    return ACTIVE_COUPONS[clean]
  }

  // Match without underscores (e.g. FIRST50)
  const noUnderscore = clean.replace(/_/g, '')
  if (ACTIVE_COUPONS[noUnderscore]) {
    return ACTIVE_COUPONS[noUnderscore]
  }

  return null
}

/**
 * Calculates discounted INR price specifically for Razorpay.
 */
export function calculateDiscount(
  priceInr: number,
  coupon: CouponInfo
): {
  discountedInr: number
  savingsInr: number
  label: string
} {
  let discountedInr = priceInr
  let label = ''

  if (coupon.discountPercent) {
    const percent = Math.min(100, Math.max(1, coupon.discountPercent))
    if (percent === 50) {
      if (priceInr === 1999) discountedInr = 999
      else if (priceInr === 1299) discountedInr = 649
      else if (priceInr === 699) discountedInr = 349
      else discountedInr = Math.max(1, Math.round(priceInr * 0.5))
    } else {
      discountedInr = Math.max(1, Math.round(priceInr * (1 - percent / 100)))
    }
    label = `${percent}% OFF Creator Discount`
  } else if (coupon.discountInr) {
    discountedInr = Math.max(1, priceInr - coupon.discountInr)
    label = `₹${coupon.discountInr} OFF Creator Discount`
  } else {
    label = '50% Creator Discount Applied'
  }

  const savingsInr = priceInr - discountedInr

  return {
    discountedInr,
    savingsInr,
    label,
  }
}

/**
 * Calculates discounted USD price for international display.
 */
export function calculateUsdDiscount(
  priceUsd: number,
  coupon?: CouponInfo | null
): {
  discountedUsd: number
  savingsUsd: number
  label: string
} {
  if (!coupon || !coupon.discountPercent || priceUsd === 0) {
    return { discountedUsd: priceUsd, savingsUsd: 0, label: '' }
  }

  const percent = coupon.discountPercent
  let discountedUsd = priceUsd * (1 - percent / 100)
  
  if (percent === 50) {
    if (priceUsd === 21) discountedUsd = 10.5
    else if (priceUsd === 15) discountedUsd = 7.5
    else if (priceUsd === 8) discountedUsd = 4.0
    else discountedUsd = Math.round(discountedUsd * 100) / 100
  } else {
    discountedUsd = Math.round(discountedUsd * 100) / 100
  }

  const savingsUsd = Math.round((priceUsd - discountedUsd) * 100) / 100

  return {
    discountedUsd,
    savingsUsd,
    label: `${percent}% OFF Creator Discount`,
  }
}

/**
 * Promotional coupons and discount offers are exclusively valid for core membership plans
 * (Standard, Pro+ Pro, Lifetime BYOK). They do NOT apply to flexible quota top-ups.
 */
export function isCouponAllowedForPlan(planIdOrTier?: string): boolean {
  if (!planIdOrTier) return false
  const lower = planIdOrTier.toLowerCase()
  if (lower === 'topup' || lower.includes('topup') || lower === 'copilot' || lower === 'autoapply') {
    return false
  }
  return true
}

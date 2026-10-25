export interface CouponInfo {
  code: string
  discountPercent?: number
  discountInr?: number
  offerId?: string // Razorpay Offer ID
  description: string
}

/**
 * Registry of active coupoffn codes exclusively for Razorpay.
 * Linked to Razorpay Offer: offer_TgYKvwy8HyzTTz (Apply_50_off - 50% Instant Discount)
 */
export const ACTIVE_COUPONS: Record<string, CouponInfo> = {
  FIRST_50: {
    code: 'FIRST_50',
    discountPercent: 50,
    offerId: 'offer_ThtiX0ut4rhpCT',
    description: '50% Instant Discount for First Payment (UPI, Netbanking & Cards)',
  },
  FIRST50: {
    code: 'FIRST_50',
    discountPercent: 50,
    offerId: 'offer_ThtiX0ut4rhpCT',
    description: '50% Instant Discount for First Payment (UPI, Netbanking & Cards)',
  },
  OFFER_THTIX0UT4RHPCT: {
    code: 'FIRST_50',
    discountPercent: 50,
    offerId: 'offer_ThtiX0ut4rhpCT',
    description: '50% Instant Discount for First Payment (UPI, Netbanking & Cards)',
  },
  APPLY_50_OFF: {
    code: 'Apply_50_off',
    discountPercent: 50,
    offerId: 'offer_TgYKvwy8HyzTTz',
    description: '50% Instant Discount on Razorpay (UPI, Netbanking & Cards)',
  },
  APPLY50OFF: {
    code: 'Apply_50_off',
    discountPercent: 50,
    offerId: 'offer_TgYKvwy8HyzTTz',
    description: '50% Instant Discount on Razorpay (UPI, Netbanking & Cards)',
  },
  APPLY50: {
    code: 'Apply_50_off',
    discountPercent: 50,
    offerId: 'offer_TgYKvwy8HyzTTz',
    description: '50% Instant Discount on Razorpay (UPI, Netbanking & Cards)',
  },
  '50OFF': {
    code: 'Apply_50_off',
    discountPercent: 50,
    offerId: 'offer_TgYKvwy8HyzTTz',
    description: '50% Instant Discount on Razorpay (UPI, Netbanking & Cards)',
  },
  OFFER_TGYKVWY8HYZTTZ: {
    code: 'Apply_50_off',
    discountPercent: 50,
    offerId: 'offer_TgYKvwy8HyzTTz',
    description: '50% Instant Discount on Razorpay (UPI, Netbanking & Cards)',
  },
}

/**
 * Validates a coupon code string (Exclusively for Razorpay).
 */
export function validateCoupon(code: string): CouponInfo | null {
  const clean = code.trim().replace(/\s+/g, '_').toUpperCase()
  if (!clean || clean.length < 2) return null

  // Direct match in registry
  if (ACTIVE_COUPONS[clean]) {
    return ACTIVE_COUPONS[clean]
  }

  // Match without underscores
  const noUnderscore = clean.replace(/_/g, '')
  if (ACTIVE_COUPONS[noUnderscore]) {
    return ACTIVE_COUPONS[noUnderscore]
  }

  // Direct match for the offer ID
  if (clean.toLowerCase() === 'offer_tgykvwy8hyzttz') {
    return ACTIVE_COUPONS.APPLY_50_OFF
  }

  if (clean.toLowerCase().startsWith('offer_')) {
    return {
      code: clean,
      offerId: clean.toLowerCase(),
      discountPercent: 50,
      description: 'Razorpay Instant Offer (50% OFF)',
    }
  }

  // Universal Creator / Influencer Code Support
  // Any promo or creator code provided by influencers activates 50% Instant Discount!
  return {
    code: clean,
    discountPercent: 50,
    offerId: 'offer_TgYKvwy8HyzTTz',
    description: `Creator Code "${clean}": 50% Instant Discount Activated`,
  }
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

export interface CouponInfo {
  code: string
  discountPercent?: number
  discountInr?: number
  offerId?: string // Razorpay Offer ID
  description: string
}

/**
 * Registry of active coupon codes exclusively for Razorpay.
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
  if (!clean) return null

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
      description: 'Razorpay Instant Offer',
    }
  }

  return null
}

/**
 * Calculates discounted INR price specifically for Razorpay.
 * Dodo Payments (USD) remains unaffected.
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
    discountedInr = Math.max(1, Math.round(priceInr * (1 - percent / 100)))
    label = `${percent}% OFF on Razorpay`
  } else if (coupon.discountInr) {
    discountedInr = Math.max(1, priceInr - coupon.discountInr)
    label = `₹${coupon.discountInr} OFF on Razorpay`
  } else {
    label = 'Razorpay Offer Applied'
  }

  const savingsInr = priceInr - discountedInr

  return {
    discountedInr,
    savingsInr,
    label,
  }
}

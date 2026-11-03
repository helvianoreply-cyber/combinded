export interface CouponInfo {
  code: string
  discountPercent?: number
  discountInr?: number
  offerId?: string // Razorpay Offer ID
  description: string
}

/**
 * The single official coupon displayed publicly across the website is FIRST_50.
 * Partner / Creator codes (e.g. TAMILBROSSQUAD10, stranger78) are supported and applicable
 * when entered directly by customers or via campaign links, but not advertised on site.
 */
export const OFFICIAL_COUPON_CODE = 'FIRST_50'

export const ACTIVE_COUPONS: Record<string, CouponInfo> = {
  // New 60% Creator Offer: TAMILBROSSQUAD10
  TAMILBROSSQUAD10: {
    code: 'TAMILBROSSQUAD10',
    discountPercent: 60,
    offerId: 'offer_TvJzHL1gF2jcQ5',
    description: 'Official 60% Instant Discount on All Purchases (Code: TAMILBROSSQUAD10)',
  },
  TAMILBROSSQUAD: {
    code: 'TAMILBROSSQUAD10',
    discountPercent: 60,
    offerId: 'offer_TvJzHL1gF2jcQ5',
    description: 'Official 60% Instant Discount on All Purchases (Code: TAMILBROSSQUAD10)',
  },
  TAMIL_BROS_SQUAD_10: {
    code: 'TAMILBROSSQUAD10',
    discountPercent: 60,
    offerId: 'offer_TvJzHL1gF2jcQ5',
    description: 'Official 60% Instant Discount on All Purchases (Code: TAMILBROSSQUAD10)',
  },
  TAMIL_BROS_SQUAD: {
    code: 'TAMILBROSSQUAD10',
    discountPercent: 60,
    offerId: 'offer_TvJzHL1gF2jcQ5',
    description: 'Official 60% Instant Discount on All Purchases (Code: TAMILBROSSQUAD10)',
  },
  OFFER_TVJZHL1GF2JCQ5: {
    code: 'TAMILBROSSQUAD10',
    discountPercent: 60,
    offerId: 'offer_TvJzHL1gF2jcQ5',
    description: 'Official 60% Instant Discount on All Purchases (Code: TAMILBROSSQUAD10)',
  },

  // 60% Creator Offer: stranger78
  STRANGER78: {
    code: 'stranger78',
    discountPercent: 60,
    offerId: 'offer_TuweufXLBXXzIP',
    description: 'Official 60% Instant Discount on All Purchases (Code: stranger78)',
  },
  STRANGER_78: {
    code: 'stranger78',
    discountPercent: 60,
    offerId: 'offer_TuweufXLBXXzIP',
    description: 'Official 60% Instant Discount on All Purchases (Code: stranger78)',
  },
  STRANGER: {
    code: 'stranger78',
    discountPercent: 60,
    offerId: 'offer_TuweufXLBXXzIP',
    description: 'Official 60% Instant Discount on All Purchases (Code: stranger78)',
  },
  OFFER_TUWEUFXLBXXZIP: {
    code: 'stranger78',
    discountPercent: 60,
    offerId: 'offer_TuweufXLBXXzIP',
    description: 'Official 60% Instant Discount on All Purchases (Code: stranger78)',
  },

  // 50% Founder Offer: FIRST_50
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
 * Validates a coupon code string (supports TAMILBROSSQUAD10, stranger78, FIRST_50, and their aliases).
 */
export function validateCoupon(code: string): CouponInfo | null {
  const clean = code.trim().replace(/\s+/g, '_').toUpperCase()
  if (!clean) return null

  // Direct match
  if (ACTIVE_COUPONS[clean]) {
    return ACTIVE_COUPONS[clean]
  }

  // Match without underscores (e.g. TAMILBROSSQUAD10, FIRST50, STRANGER78)
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
    if (percent === 60) {
      if (priceInr === 1999) discountedInr = 799
      else if (priceInr === 1299) discountedInr = 519
      else if (priceInr === 699) discountedInr = 279
      else if (priceInr === 169) discountedInr = 68
      else discountedInr = Math.max(1, Math.round(priceInr * 0.4))
    } else if (percent === 50) {
      if (priceInr === 1999) discountedInr = 999
      else if (priceInr === 1299) discountedInr = 649
      else if (priceInr === 699) discountedInr = 349
      else if (priceInr === 169) discountedInr = 85
      else discountedInr = Math.max(1, Math.round(priceInr * 0.5))
    } else {
      discountedInr = Math.max(1, Math.round(priceInr * (1 - percent / 100)))
    }
    label = `${percent}% OFF Creator Discount`
  } else if (coupon.discountInr) {
    discountedInr = Math.max(1, priceInr - coupon.discountInr)
    label = `₹${coupon.discountInr} OFF Creator Discount`
  } else {
    label = 'Creator Discount Applied'
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
  
  if (percent === 60) {
    if (priceUsd === 21) discountedUsd = 8.4
    else if (priceUsd === 15) discountedUsd = 6.0
    else if (priceUsd === 8) discountedUsd = 3.2
    else if (priceUsd === 2) discountedUsd = 0.8
    else discountedUsd = Math.round(priceUsd * 0.4 * 100) / 100
  } else if (percent === 50) {
    if (priceUsd === 21) discountedUsd = 10.5
    else if (priceUsd === 15) discountedUsd = 7.5
    else if (priceUsd === 8) discountedUsd = 4.0
    else if (priceUsd === 2) discountedUsd = 1.0
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
 * Promotional coupons and discount offers are valid for all purchases.
 */
export function isCouponAllowedForPlan(_planIdOrTier?: string): boolean {
  return true
}

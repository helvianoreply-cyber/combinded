import React, { useEffect, useState } from 'react'
import { type DbPlan, getPlanInrPrice } from '../lib/database.types'
import { type CouponInfo, validateCoupon, calculateDiscount } from '../lib/coupons'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  plan: DbPlan | null
  onSelectRazorpay: (plan: DbPlan, couponCode?: string, customAmountInr?: number) => void
  onSelectDodo: (plan: DbPlan) => void
  isProcessing?: boolean
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  plan,
  onSelectRazorpay,
  onSelectDodo,
  isProcessing = false,
}) => {
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<CouponInfo | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null)

  // Reset coupon state whenever modal opens or closes or plan changes
  useEffect(() => {
    if (!isOpen) {
      setCouponInput('')
      setAppliedCoupon(null)
      setCouponError(null)
      setCouponSuccess(null)
    }
  }, [isOpen, plan])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !plan) return null

  const originalInrAmount = getPlanInrPrice(plan.price)
  const isLifetime = plan.tier === 'pro plus+' || plan.name.toLowerCase().includes('lifetime')

  // Auto-detect coupon: either explicitly applied or currently typed valid coupon
  const activeCoupon = appliedCoupon || (couponInput.trim() ? validateCoupon(couponInput.trim()) : null)

  // Calculate dynamic discounted INR amount ONLY for Razorpay
  const discountCalc = activeCoupon
    ? calculateDiscount(originalInrAmount, activeCoupon)
    : null

  const effectiveInrAmount = discountCalc ? discountCalc.discountedInr : originalInrAmount

  const handleApplyCoupon = () => {
    setCouponError(null)
    setCouponSuccess(null)

    const raw = couponInput.trim()
    if (!raw) {
      setCouponError('Please enter a coupon code')
      return
    }

    const found = validateCoupon(raw)
    if (found) {
      setAppliedCoupon(found)
      const calc = calculateDiscount(originalInrAmount, found)
      setCouponSuccess(`Coupon "${found.code}" applied! ${calc.label}`)
    } else {
      setCouponError(`Coupon code "${raw}" is invalid or expired.`)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponError(null)
    setCouponSuccess(null)
  }

  const handleProceedRazorpay = () => {
    if (isProcessing) return
    const couponToUse = activeCoupon?.code || couponInput.trim() || undefined
    onSelectRazorpay(plan, couponToUse, effectiveInrAmount)
  }

  return (
    <div className="payment-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="payment-modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="payment-modal-header">
          <div className="payment-modal-title-group">
            <span className="payment-modal-badge">Secure Checkout</span>
            <h2 className="payment-modal-title">Select Payment Method</h2>
          </div>
          <button 
            className="payment-modal-close-btn" 
            onClick={onClose}
            aria-label="Close payment options"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Selected Plan Summary Banner */}
        <div className="payment-plan-summary">
          <div className="payment-plan-info">
            <span className="payment-plan-tag">{isLifetime ? 'Lifetime Access' : 'Selected Plan'}</span>
            <h3 className="payment-plan-name">{plan.name}</h3>
            <div className="payment-plan-perks">
              {isLifetime ? (
                <>
                  <span>✓ Unlimited Duration</span>
                  <span>•</span>
                  <span>✓ BYOK AI Copilot</span>
                  <span>•</span>
                  <span>✓ Lifetime License</span>
                </>
              ) : (
                <>
                  <span>⏱️ {plan.included_minutes} mins</span>
                  <span>•</span>
                  <span>💡 {plan.included_responses} AI answers</span>
                  <span>•</span>
                  <span>💼 {plan.included_applications} Job Auto-Applies</span>
                </>
              )}
            </div>
          </div>
          <div className="payment-plan-amounts">
            <div className="payment-amount-usd">
              ${plan.price} <span className="payment-curr-sub">USD</span>
            </div>
            <div className="payment-amount-inr">
              ≈ ₹{originalInrAmount.toLocaleString('en-IN')} <span className="payment-curr-sub">INR</span>
            </div>
          </div>
        </div>

        <p className="payment-choice-subtitle">
          Choose your preferred gateway. Both methods activate your plan immediately:
        </p>

        {/* Dual Payment Method Cards */}
        <div className="payment-methods-grid">
          {/* METHOD 1: RAZORPAY (India & UPI) -> WITH INLINE COUPON DISCOUNT */}
          <div 
            className="payment-method-card razorpay-card"
            onClick={handleProceedRazorpay}
          >
            <div className="payment-card-top">
              <div className="payment-card-badge rzp">
                <span>🇮🇳 India &amp; UPI</span>
              </div>
              <div className="payment-gateway-logo rzp-logo">
                <span className="rzp-brand-text">Razorpay</span>
              </div>
            </div>

            <div className="payment-card-price-row">
              {discountCalc ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <del className="card-strike-price">₹{originalInrAmount.toLocaleString('en-IN')}</del>
                  <span className="payment-card-price highlight">₹{effectiveInrAmount.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <span className="payment-card-price">₹{originalInrAmount.toLocaleString('en-IN')}</span>
              )}
              <span className="payment-card-period">{isLifetime ? 'one-time' : 'total INR'}</span>
            </div>

            <p className="payment-card-desc">
              Recommended for Indian users. Pay seamlessly with UPI QR, PhonePe, Google Pay, Netbanking, or RuPay.
            </p>

            <div className="payment-supported-chips">
              <span className="chip-pill">⚡ UPI QR</span>
              <span className="chip-pill">Google Pay</span>
              <span className="chip-pill">PhonePe</span>
              <span className="chip-pill">Paytm</span>
              <span className="chip-pill">NetBanking</span>
              <span className="chip-pill">Indian Cards</span>
            </div>

            {/* Scoped Coupon Section Exclusively for Razorpay */}
            <div className="payment-coupon-section razorpay-coupon-box" onClick={(e) => e.stopPropagation()}>
              <div className="payment-coupon-bar">
                <div className="payment-coupon-input-wrap">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="coupon-icon">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                  </svg>
                  <input
                    type="text"
                    className={`payment-coupon-input ${appliedCoupon ? 'applied' : ''}`}
                    placeholder="Coupon code (e.g. FIRST_50)"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value)
                      setCouponError(null)
                      setCouponSuccess(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (!appliedCoupon) handleApplyCoupon()
                      }
                    }}
                    disabled={isProcessing || !!appliedCoupon}
                  />
                </div>
                {appliedCoupon ? (
                  <button
                    type="button"
                    className="payment-coupon-btn remove"
                    onClick={handleRemoveCoupon}
                    disabled={isProcessing}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    className="payment-coupon-btn apply"
                    onClick={handleApplyCoupon}
                    disabled={!couponInput.trim() || isProcessing}
                  >
                    Apply
                  </button>
                )}
              </div>

              {couponError && (
                <div className="payment-coupon-msg error">
                  <span>⚠️ {couponError}</span>
                </div>
              )}

              {couponSuccess && appliedCoupon && discountCalc && (
                <div className="payment-coupon-msg success">
                  <span>
                    🎉 <strong>{couponSuccess}</strong> (Savings: ₹{discountCalc.savingsInr.toLocaleString('en-IN')})
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="payment-action-btn razorpay-btn"
              onClick={(e) => {
                e.stopPropagation()
                handleProceedRazorpay()
              }}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span>Opening Gateway…</span>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                    <line x1="2" y1="10" x2="22" y2="10"></line>
                  </svg>
                  <span>
                    Pay ₹{effectiveInrAmount.toLocaleString('en-IN')} with Razorpay
                    {discountCalc ? ` (50% OFF)` : ''}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* METHOD 2: DODO PAYMENTS (Global & Cards) -> IN-BUILD COUPON ON CHECKOUT */}
          <div 
            className="payment-method-card dodo-card"
            onClick={() => !isProcessing && onSelectDodo(plan)}
          >
            <div className="payment-card-top">
              <div className="payment-card-badge dodo">
                <span>🌍 Global &amp; USD</span>
              </div>
              <div className="payment-gateway-logo dodo-logo">
                <span className="dodo-brand-text">Dodo Payments</span>
              </div>
            </div>

            <div className="payment-card-price-row">
              <span className="payment-card-price">${plan.price}</span>
              <span className="payment-card-period">{isLifetime ? 'one-time' : 'USD'}</span>
            </div>

            <p className="payment-card-desc">
              Recommended for International users. Pay in USD with Visa, Mastercard, American Express, Apple Pay, or Google Pay.
            </p>

            <div className="payment-supported-chips">
              <span className="chip-pill">💳 Visa</span>
              <span className="chip-pill">Mastercard</span>
              <span className="chip-pill">Amex</span>
              <span className="chip-pill">Apple Pay</span>
              <span className="chip-pill">Google Pay</span>
              <span className="chip-pill">Global Cards</span>
            </div>

            <div className="dodo-inbuild-coupon-hint">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
              <span>Have a coupon? Enter it directly on Dodo checkout</span>
            </div>

            <button
              type="button"
              className="payment-action-btn dodo-btn"
              onClick={(e) => {
                e.stopPropagation()
                onSelectDodo(plan)
              }}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span>Redirecting…</span>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  <span>Pay ${plan.price} with Dodo Payments</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security & Instant Delivery Notice */}
        <div className="payment-modal-footer">
          <div className="payment-security-pill">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>256-bit SSL Encrypted • Instant Quotas &amp; AI Activation</span>
          </div>
          <a
            href="https://wa.me/919032025916?text=Hi%2C%20I%20have%20a%20question%20about%20payment%20for%20Helvia"
            target="_blank"
            rel="noopener noreferrer"
            className="payment-whatsapp-support-link"
          >
            <span>💬</span> Need payment help? Chat on WhatsApp: <strong>+91 9032025916</strong>
          </a>
        </div>
      </div>
    </div>
  )
}

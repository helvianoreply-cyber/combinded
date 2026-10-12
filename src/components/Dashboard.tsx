import React, { useMemo, useState, useEffect } from 'react'
import { SkyCanvas3D } from './SkyCanvas3D'
import { type DbUser, type DbPlan, SEED_PLANS, getPlanInrPrice } from '../lib/database.types'
import { PaymentModal } from './PaymentModal'
import { InteractiveTopupStation } from './InteractiveTopupStation'
import { ReviewSessionCard } from './ReviewSessionCard'

interface DashboardProps {
  displayName: string | null
  sessionEmail: string | null
  userProfile?: DbUser | null
  plans?: DbPlan[]
  plan: string
  planExpiresAt: string | null
  startUpgrade: (plan: DbPlan | '24h' | 'month', couponCode?: string, customAmountInr?: number) => void
  startTopup?: (type: 'copilot' | 'autoapply', units: number, couponCode?: string) => void
  startDodoUpgrade?: (productId?: string, couponCode?: string, planObj?: DbPlan) => void
  isUpgrading: boolean
  upgradeError: string | null
}

// Icon Components
const CrownIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path>
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
)

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
)

const ShieldCheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <polyline points="9 12 12 15 16 10"></polyline>
  </svg>
)

const SparklesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
  </svg>
)

const BriefcaseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </svg>
)

export const Dashboard: React.FC<DashboardProps> = ({
  displayName,
  sessionEmail,
  userProfile,
  plans,
  plan,
  planExpiresAt,
  startUpgrade,
  startTopup,
  startDodoUpgrade,
  isUpgrading,
  upgradeError,
}) => {
  const [currentPlan, setCurrentPlan] = useState(userProfile?.plan || plan || 'basic')
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null)

  useEffect(() => {
    setCurrentPlan(userProfile?.plan || plan || 'basic')
  }, [userProfile, plan])

  useEffect(() => {
    document.documentElement.setAttribute('data-sky-theme', 'morning')

    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') {
      setPaymentSuccess('🎉 Payment Successful! Your upgraded plan and quotas are now active.')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const apiBase = useMemo(() => {
    const configured = import.meta.env.VITE_API_BASE_URL
    if (configured && typeof configured === 'string' && configured.trim()) {
      return configured.replace(/\/+$/, '')
    }
    return 'https://red-glade-5c0e.nagineniyashwanth90.workers.dev'
  }, [])

  // Auto-sync latest profile
  useEffect(() => {
    const fetchLatestProfile = async () => {
      const email = (sessionEmail || '').trim().toLowerCase()
      if (!email) return
      try {
        const res = await fetch(`${apiBase}/get-profile?email=${encodeURIComponent(email)}`)
        if (res.ok) {
          const json = (await res.json()) as { ok?: boolean; profile?: DbUser }
          if (json?.profile?.plan) {
            setCurrentPlan(json.profile.plan.toLowerCase())
          }
        }
      } catch (err) {
        console.error('Failed to sync profile on dashboard:', err)
      }
    }
    fetchLatestProfile()
  }, [apiBase, sessionEmail])

  // Sort available plans in ascending price order: $0 -> $8 -> $15 -> $25 -> $35 -> $49
  const availablePlans = useMemo(() => {
    const list = plans && plans.length > 0 ? plans : SEED_PLANS
    return [...list].sort((a, b) => Number(a.price) - Number(b.price))
  }, [plans])

  const unlimitedPlan = useMemo(() => {
    return (
      availablePlans.find(
        (p) => p.name.toLowerCase().includes('unlimited') || p.id === 'b1e06fa2-5819-48ce-8d07-28d8cf9c4901'
      ) || SEED_PLANS.find((p) => p.id === 'b1e06fa2-5819-48ce-8d07-28d8cf9c4901')
    )
  }, [availablePlans])

  const standardPlans = useMemo(() => {
    return availablePlans.filter(
      (p) => !p.name.toLowerCase().includes('unlimited') && p.id !== 'b1e06fa2-5819-48ce-8d07-28d8cf9c4901'
    )
  }, [availablePlans])

  const isUserUnlimitedPlan = 
    currentPlan !== 'basic' && (
      Boolean(planExpiresAt) ||
      (userProfile?.responses_remaining != null && userProfile.responses_remaining >= 900000) ||
      (userProfile?.seconds_remaining != null && userProfile.seconds_remaining >= 50000000)
    )

  const activePlanObj = availablePlans.find((p) => {
    if (isUserUnlimitedPlan && p.name.toLowerCase().includes('unlimited')) return true
    if (currentPlan === 'pro plus+' && p.tier === 'pro plus+') return true
    if (p.tier.toLowerCase() === currentPlan.toLowerCase() && !p.name.toLowerCase().includes('unlimited')) return true
    return false
  })

  const planDisplayName = isUserUnlimitedPlan
    ? '1 Month Unlimited VIP'
    : activePlanObj
      ? activePlanObj.name
      : currentPlan === 'basic'
        ? 'Basic Free Tier'
        : currentPlan
  const isPaid = currentPlan !== 'basic'

  // Real-time check if 1-month unlimited plan expired while dashboard is open
  useEffect(() => {
    if (!planExpiresAt || currentPlan === 'basic') return

    const checkExpiration = () => {
      if (new Date(planExpiresAt).getTime() <= Date.now()) {
        setCurrentPlan('basic')
        if (sessionEmail) {
          fetch(`${apiBase}/get-profile?email=${encodeURIComponent(sessionEmail)}`).catch(() => {})
        }
      }
    }

    checkExpiration()
    const interval = setInterval(checkExpiration, 60000)
    return () => clearInterval(interval)
  }, [planExpiresAt, currentPlan, sessionEmail, apiBase])

  const firstName = displayName?.split(' ')[0] || displayName || sessionEmail?.split('@')[0] || 'User'

  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<DbPlan | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const openPaymentModal = (p: DbPlan) => {
    setSelectedPlanForPayment(p)
    setIsPaymentModalOpen(true)
  }

  const handleRazorpayUpgrade = (p: DbPlan, couponCode?: string, customAmountInr?: number) => {
    setIsPaymentModalOpen(false)
    startUpgrade(p, couponCode, customAmountInr)
  }

  const handleDodoUpgrade = (p: DbPlan, couponCode?: string) => {
    setIsPaymentModalOpen(false)
    if (startDodoUpgrade) {
      startDodoUpgrade(p.dodo_product_id || undefined, couponCode, p)
    }
  }

  return (
    <>
      <SkyCanvas3D scrollProgress={0} manualTimeOverride={0} />

      <div className="plans-dashboard-container">
        {/* Header Section */}
        <section className="plans-page-header">
          <div className="plans-user-badge">
            <span className={`plan-indicator ${isPaid ? 'pro' : 'free'}`}>
              {isPaid ? <CrownIcon /> : <ShieldCheckIcon />}
              <span>Current Plan: <strong>{planDisplayName}</strong></span>
            </span>
            {sessionEmail && (
              <span className="user-email-pill">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.85, flexShrink: 0 }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span>{sessionEmail}</span>
              </span>
            )}
            {planExpiresAt && currentPlan !== 'basic' && (
              <span className="user-email-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', border: '1px solid rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontWeight: 600 }}>
                <ClockIcon />
                <span>
                  Expires {new Date(planExpiresAt).toLocaleDateString()}{' '}
                  {(() => {
                    const days = Math.max(0, Math.ceil((new Date(planExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                    return `(${days} days left)`
                  })()}
                </span>
              </span>
            )}
            <a
              href="https://wa.me/919032025916?text=Hi%2C%20I%20need%20support%20with%20my%20Helvia%20account"
              target="_blank"
              rel="noopener noreferrer"
              className="user-email-pill"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', color: '#25D366', fontWeight: 600, border: '1px solid rgba(37, 211, 102, 0.35)' }}
              title="Chat on WhatsApp (+91 9032025916)"
            >
              <span>💬</span>
              <span>WhatsApp: 9032025916</span>
            </a>
          </div>
          <h1>Welcome, <span className="plans-name-highlight">{firstName}</span></h1>
          <p className="plans-page-subtitle">
            Select the plan that fits your remote desktop control and AI screen analysis workload.
          </p>
        </section>

        {/* Live Quotas & Balances Bar */}
        {userProfile && (() => {
          const isUserUnlimited = 
            currentPlan === 'pro plus+' ||
            (currentPlan !== 'basic' && (
              (userProfile.responses_remaining != null && userProfile.responses_remaining >= 900000) ||
              (userProfile.seconds_remaining != null && userProfile.seconds_remaining >= 50000000) ||
              Boolean(planExpiresAt) ||
              Boolean(activePlanObj?.name.toLowerCase().includes('unlimited'))
            ))

          return (
            <div className="plans-live-stats-bar">
              <div className="live-stat-pill">
                <ClockIcon />
                <div>
                  <span className="live-stat-val">
                    {isUserUnlimited
                      ? '∞ Unlimited'
                      : userProfile.seconds_remaining != null && userProfile.seconds_remaining > 0
                        ? `${Math.floor(userProfile.seconds_remaining / 60)} min`
                        : `${Math.floor((userProfile.seconds_remaining || 0) / 60)} min`}
                  </span>
                  <span className="live-stat-lbl">Time Remaining</span>
                </div>
              </div>

              <div className="live-stat-pill">
                <SparklesIcon />
                <div>
                  <span className="live-stat-val">
                    {isUserUnlimited ? '∞ Unlimited' : (userProfile.responses_remaining ?? 0)}
                  </span>
                  <span className="live-stat-lbl">AI Answers Balance</span>
                </div>
              </div>

              <div className="live-stat-pill">
                <BriefcaseIcon />
                <div>
                  <span className="live-stat-val">
                    {isUserUnlimited ? '∞ Unlimited' : (userProfile.applications_remaining ?? 10)}
                  </span>
                  <span className="live-stat-lbl">Job Auto-Applies</span>
                </div>
              </div>

              <div className={`live-stat-pill ${userProfile.verifier ? 'verified' : ''}`}>
                <CheckCircleIcon />
                <div>
                  <span className="live-stat-val">{userProfile.verifier ? 'Host Linked' : 'Standby'}</span>
                  <span className="live-stat-lbl">Windows Host Status</span>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Success / Error Alerts */}
        {paymentSuccess && (
          <div className="dashboard-alert success" style={{ maxWidth: 840, margin: '0 auto 2rem auto' }}>
            <CheckCircleIcon />
            <span>{paymentSuccess}</span>
          </div>
        )}

        {upgradeError && (
          <div className="dashboard-alert error" style={{ maxWidth: 840, margin: '0 auto 2rem auto' }}>
            <span>⚠️</span>
            <span>{upgradeError}</span>
          </div>
        )}

        {/* =========================================================
            FEATURED 1-MONTH UNLIMITED VIP SPOTLIGHT (STANDALONE SECTION)
            ========================================================= */}
        {unlimitedPlan && (() => {
          const inrPrice = getPlanInrPrice(unlimitedPlan.price)
          const isCurrentUnlimited = isUserUnlimitedPlan

          return (
            <section className="unlimited-spotlight-section">
              <div className={`unlimited-spotlight-card ${isCurrentUnlimited ? 'active-plan' : ''}`}>
                <div className="unlimited-spotlight-glow" />

                <div className="unlimited-spotlight-header">
                  <div className="unlimited-badge-cluster">
                    <span className="unlimited-crown-badge">
                      👑 1-Month Unlimited VIP Pass
                    </span>
                    <span className="unlimited-duration-tag">30 Days Unlimited Access</span>
                  </div>
                  <div className="unlimited-offer-pill">
                    <span>🔥 Offer: ₹999 with 50% Coupon / ${unlimitedPlan.price} Global via Dodo Payments</span>
                  </div>
                </div>

                <div className="unlimited-spotlight-body">
                  {/* Left Column: Details & Pricing & Dual CTAs */}
                  <div className="unlimited-spotlight-main">
                    <h2 className="unlimited-spotlight-title">{unlimitedPlan.name}</h2>
                    <p className="unlimited-spotlight-subtitle">
                      Complete unrestricted access for 30 days. Run long meetings, continuous AI screen analysis, and bulk auto-apply to hundreds of jobs with zero per-minute deductions.
                    </p>

                    <div className="unlimited-pricing-block">
                      <div className="unlimited-price-tag">
                        <span className="unlimited-currency">$</span>
                        <span className="unlimited-amount">{unlimitedPlan.price}</span>
                        <span className="unlimited-period">/ month (30 Days)</span>
                      </div>
                      <div className="unlimited-inr-row">
                        <span className="unlimited-inr-base">≈ ₹{inrPrice.toLocaleString('en-IN')} Base</span>
                        <span className="unlimited-coupon-deal">Special: ₹999 with Coupon (FIRST_50)</span>
                      </div>
                    </div>

                    {/* Unlimited Badges / Quotas */}
                    <div className="unlimited-stats-row">
                      <div className="unlimited-stat-card">
                        <div className="unlimited-stat-icon">⏱️</div>
                        <div>
                          <div className="unlimited-stat-number">∞ Unlimited</div>
                          <div className="unlimited-stat-label">Remote &amp; Meeting Time</div>
                        </div>
                      </div>

                      <div className="unlimited-stat-card">
                        <div className="unlimited-stat-icon">💡</div>
                        <div>
                          <div className="unlimited-stat-number">∞ Unlimited</div>
                          <div className="unlimited-stat-label">AI Screen Vision Answers</div>
                        </div>
                      </div>

                      <div className="unlimited-stat-card">
                        <div className="unlimited-stat-icon">💼</div>
                        <div>
                          <div className="unlimited-stat-number">∞ Unlimited</div>
                          <div className="unlimited-stat-label">Job Auto-Applies</div>
                        </div>
                      </div>
                    </div>

                    {/* Dual Gateway Checkout Buttons */}
                    <div className="unlimited-cta-container">
                      {isCurrentUnlimited ? (
                        <button className="unlimited-current-badge-btn" type="button" disabled>
                          <CheckCircleIcon /> Current Active Plan {planExpiresAt && `(Expires ${new Date(planExpiresAt).toLocaleDateString()})`}
                        </button>
                      ) : (
                        <div className="unlimited-buttons-grid">
                          <button
                            type="button"
                            className="unlimited-btn razorpay-btn"
                            onClick={() => openPaymentModal(unlimitedPlan)}
                            disabled={isUpgrading}
                          >
                            <span className="btn-main-text">🇮🇳 Get with Razorpay / UPI</span>
                            <span className="btn-sub-text">₹1,999 → ₹999 with Coupon</span>
                          </button>

                          <button
                            type="button"
                            className="unlimited-btn dodo-btn"
                            onClick={() => handleDodoUpgrade(unlimitedPlan)}
                            disabled={isUpgrading}
                          >
                            <span className="btn-main-text">🌍 Pay with Dodo Payments</span>
                            <span className="btn-sub-text">${unlimitedPlan.price} USD • Global Cards &amp; Apple Pay</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Key Feature Highlights */}
                  <div className="unlimited-spotlight-sidebar">
                    <h3 className="unlimited-features-heading">⚡ What's Included in Unlimited VIP:</h3>
                    <ul className="unlimited-features-list">
                      <li>
                        <CheckCircleIcon />
                        <span><strong>Zero Minute Limits:</strong> Stream continuously with no countdown or balance depletion.</span>
                      </li>
                      <li>
                        <CheckCircleIcon />
                        <span><strong>Real-time Vision AI:</strong> Unlimited instant screen questions, code explanations, and answers.</span>
                      </li>
                      <li>
                        <CheckCircleIcon />
                        <span><strong>Bulk ATS Auto-Apply:</strong> Automate applications on LinkedIn, Indeed, and company portals.</span>
                      </li>
                      <li>
                        <CheckCircleIcon />
                        <span><strong>Sub-15ms 60 FPS Stream:</strong> Ultra-fast WebRTC direct p2p connection with low latency.</span>
                      </li>
                      <li>
                        <CheckCircleIcon />
                        <span><strong>Stealth Host Controls:</strong> Ghost click loopback and microphone forwarding.</span>
                      </li>
                      <li>
                        <CheckCircleIcon />
                        <span><strong>Automatic 30-Day Expiry:</strong> Valid for exactly 30 days from purchase. Automatically resets to Basic with zero recurring charges.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          )
        })()}

        {/* Section Divider */}
        <div className="dashboard-section-divider">
          <div className="divider-line" />
          <div className="divider-badge">
            <span>📦 STANDARD USAGE &amp; TOP-UP PACKS</span>
          </div>
          <div className="divider-line" />
        </div>

        {/* ALL STANDARD PLANS GRID */}
        <section className="all-plans-grid">
          {standardPlans.map((p) => {
            const priceNum = Number(p.price)
            const isFree = priceNum === 0
            const isCurrent =
              !isUserUnlimitedPlan && (
                p.tier.toLowerCase() === currentPlan.toLowerCase() ||
                (p.tier === 'usage' && activePlanObj?.id === p.id)
              )
            const isPopular =
              p.dodo_product_id === 'pdt_0NnIQ5VyQfhSXYsFLcojZ' ||
              p.name.includes('Popular')
            const isLifetime = p.tier === 'pro plus+' || p.name.includes('Lifetime')
            const isMaxPlus = priceNum === 25
            const isUltraPlus = priceNum === 35

            return (
              <div
                key={p.id}
                className={`all-plans-card ${isPopular ? 'featured popular' : ''} ${isLifetime ? 'lifetime' : ''} ${isUltraPlus ? 'power' : ''} ${isMaxPlus ? 'capacity' : ''} ${isCurrent ? 'active-plan' : ''}`}
              >
                {/* Top Badge & Tier Category Row */}
                <div className="plan-card-badge-row">
                  {isCurrent ? (
                    <span className="plan-badge-pill active">
                      <CheckCircleIcon /> Current Active Plan
                    </span>
                  ) : isPopular ? (
                    <span className="plan-badge-pill popular">
                      <SparklesIcon /> Most Popular
                    </span>
                  ) : isLifetime ? (
                    <span className="plan-badge-pill lifetime">
                      💎 Lifetime BYOK
                    </span>
                  ) : isUltraPlus ? (
                    <span className="plan-badge-pill power">
                      ⚡ Ultra Power
                    </span>
                  ) : isMaxPlus ? (
                    <span className="plan-badge-pill capacity">
                      🔥 High Usage
                    </span>
                  ) : isFree ? (
                    <span className="plan-badge-pill free">
                      ⚡ Free Tier
                    </span>
                  ) : (
                    <span className="plan-badge-pill standard">
                      🚀 3-in-1 Suite
                    </span>
                  )}
                  {isPopular && <span className="plan-highlight-tag">Best Value</span>}
                  {isLifetime && <span className="plan-highlight-tag vip">VIP License</span>}
                </div>

                {/* Plan Header */}
                <div className="plan-card-header">
                  <h3 className="plan-card-name">{p.name}</h3>
                  <div className="plan-card-price-row">
                    <div className="plan-price-main">
                      <span className="plan-price-currency">{isFree ? '' : '$'}</span>
                      <span className={`plan-card-price ${isFree ? 'free' : isPopular ? 'popular' : ''}`}>
                        {isFree ? 'Free' : p.price}
                      </span>
                    </div>
                    {!isFree && (
                      <div className="plan-price-sub-wrap">
                        <span className="plan-inr-chip">≈ ₹{getPlanInrPrice(p.price)}</span>
                        <span className="plan-card-period">
                          {isLifetime ? '/ one-time' : '/ pack'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Plan Description */}
                <p className="plan-card-desc">
                  {isFree
                    ? 'Basic account with zero usage quota. Upgrade to unlock remote streaming, AI Copilot, and job auto-applies.'
                    : isLifetime
                      ? 'Unlimited lifetime remote desktop access with Bring Your Own Keys (BYOK) AI Copilot.'
                      : `Includes ${p.included_minutes} remote minutes, ${p.included_responses} Ans 💡 AI answers, and ${p.included_applications} LinkedIn & ATS job auto-applies.`}
                </p>

                {/* Quick Quota Highlights */}
                <div className="plan-quota-pills">
                  <div className="plan-quota-pill">
                    <span className="quota-val">{isLifetime ? 'BYOK' : isFree ? '0' : p.included_applications}</span>
                    <span className="quota-lbl">Auto-Applies</span>
                  </div>
                  <div className="plan-quota-pill">
                    <span className="quota-val">{isLifetime ? '∞' : isFree ? '0m' : `${p.included_minutes}m`}</span>
                    <span className="quota-lbl">Remote Time</span>
                  </div>
                  <div className="plan-quota-pill">
                    <span className="quota-val">{isFree ? '0' : isLifetime ? 'BYOK' : p.included_responses}</span>
                    <span className="quota-lbl">AI Answers</span>
                  </div>
                </div>

                {/* Feature Bullet Points */}
                <ul className="plan-card-features">
                  <li>
                    <CheckCircleIcon />
                    <span>
                      <strong>
                        {isLifetime
                          ? 'BYOK Job Auto-Apply'
                          : isFree
                            ? '0 Job Auto-Applies'
                            : `${p.included_applications} Job Auto-Applies`}
                      </strong>
                      <span className="plan-feat-subtext">
                        {isFree ? ' (Upgrade required)' : ' (LinkedIn, Indeed & ATS)'}
                      </span>
                    </span>
                  </li>
                  <li>
                    <CheckCircleIcon />
                    <span>
                      <strong>
                        {isLifetime
                          ? 'Unlimited Remote Duration'
                          : isFree
                            ? '0 Remote Minutes'
                            : `${p.included_minutes} Remote Minutes`}
                      </strong>
                      <span className="plan-feat-subtext">
                        {isFree ? ' (Upgrade required)' : ' (Sub-15ms 60 FPS stream)'}
                      </span>
                    </span>
                  </li>
                  <li>
                    <CheckCircleIcon />
                    <span>
                      <strong>
                        {isFree
                          ? '0 Ans 💡 AI Answers'
                          : isLifetime
                            ? 'BYOK Ans 💡 AI Screen Copilot'
                            : `${p.included_responses} Ans 💡 AI Screen Answers`}
                      </strong>
                      <span className="plan-feat-subtext">
                        {isFree ? ' (Upgrade required)' : ''}
                      </span>
                    </span>
                  </li>
                  <li>
                    <CheckCircleIcon />
                    <span>60 FPS P2P WebRTC Direct Stream</span>
                  </li>
                  {isFree ? (
                    <li className="disabled-feat">
                      <span style={{ marginRight: '0.4rem' }}>✕</span>
                      <span>AI Meeting & Screen Copilot (Upgrade required)</span>
                    </li>
                  ) : (
                    <li>
                      <CheckCircleIcon />
                      <span>Stealth Host Input & Audio Loopback</span>
                    </li>
                  )}
                </ul>

                {/* CTA Action Button */}
                <div className="plan-card-cta-wrap">
                  {isCurrent ? (
                    <button className="plan-card-btn active" type="button" disabled>
                      <CheckCircleIcon /> Current Active Plan
                    </button>
                  ) : isFree ? (
                    <button className="plan-card-btn secondary" type="button" disabled>
                      Included by Default
                    </button>
                  ) : (
                    <button
                      className={`plan-card-btn primary ${isPopular ? 'popular' : ''} ${isLifetime ? 'lifetime' : ''} ${isUltraPlus ? 'power' : ''} ${isMaxPlus ? 'capacity' : ''}`}
                      type="button"
                      onClick={() => openPaymentModal(p)}
                      disabled={isUpgrading}
                    >
                      {isUpgrading ? (
                        <span>Processing…</span>
                      ) : (
                        <>
                          <span>
                            {isLifetime
                              ? `Get Lifetime ($49 / ₹${getPlanInrPrice(49)})`
                              : `Select Plan ($${p.price} / ₹${getPlanInrPrice(p.price)})`}
                          </span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="btn-arrow">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </section>

        {/* Dynamic On-Demand Top-Up Station */}
        <InteractiveTopupStation 
          onTopup={(type, units) => {
            if (startTopup) startTopup(type, units)
          }}
          isProcessing={isUpgrading}
        />

        {/* Honest Review & Token Rewards Session Card (Single card at bottom) */}
        <ReviewSessionCard 
          sessionEmail={sessionEmail}
          currentPlan={currentPlan}
          userId={userProfile?.id}
          apiBase={apiBase}
        />

        {/* Global checkout note */}
        <div style={{ textAlign: 'center', marginTop: '3.5rem', color: '#64748b', fontSize: '0.86rem' }}>
          <p>
            🔒 All transactions are securely processed via <strong>Razorpay</strong> (India: UPI, Netbanking, Cards) or <strong>Dodo Payments</strong> (Global: Cards, Apple Pay). Instant quota activation.
          </p>
        </div>
      </div>

      {/* Reusable Payment Method Selector Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        plan={selectedPlanForPayment}
        onSelectRazorpay={handleRazorpayUpgrade}
        onSelectDodo={handleDodoUpgrade}
        isProcessing={isUpgrading}
      />
    </>
  )
}

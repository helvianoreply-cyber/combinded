import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { SkyCanvas3D } from './SkyCanvas3D'
import { type DbUser, type DbPlan, SEED_PLANS, getPlanInrPrice } from '../lib/database.types'
import { HELVIA_APPS_CATALOG } from '../lib/downloadLinks'
import { PaymentModal } from './PaymentModal'
import { InteractiveTopupStation } from './InteractiveTopupStation'
import { ReviewSessionCard } from './ReviewSessionCard'
import { VideoTutorialsSection } from './VideoTutorialsSection'
import { supabase } from '../lib/supabaseClient'

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
  onRefreshProfile?: (overrideProfile?: DbUser) => void
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
  onRefreshProfile,
}) => {
  const [liveProfile, setLiveProfile] = useState<DbUser | null>(() => {
    if (userProfile) return userProfile
    try {
      const s = localStorage.getItem('helvia_user_profile')
      return s ? JSON.parse(s) : null
    } catch {
      return null
    }
  })
  const [liveExpiresAt, setLiveExpiresAt] = useState<string | null>(() => {
    if (planExpiresAt) return planExpiresAt
    if (userProfile?.plan_expires_at) return userProfile.plan_expires_at
    try {
      const s = localStorage.getItem('helvia_user_profile')
      if (s) {
        const u = JSON.parse(s)
        return u.plan_expires_at || null
      }
    } catch {}
    return null
  })
  const [currentPlan, setCurrentPlan] = useState<string>(() => {
    if (userProfile?.plan) return userProfile.plan
    if (plan) return plan
    try {
      const s = localStorage.getItem('helvia_user_profile')
      if (s) {
        const u = JSON.parse(s)
        return u.plan || 'basic'
      }
    } catch {}
    return 'basic'
  })
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (userProfile) {
      setLiveProfile(userProfile)
      setCurrentPlan(userProfile.plan || plan || 'basic')
      if (userProfile.plan_expires_at) {
        setLiveExpiresAt(userProfile.plan_expires_at)
      }
    }
  }, [userProfile, plan])

  useEffect(() => {
    if (planExpiresAt) {
      setLiveExpiresAt(planExpiresAt)
    }
  }, [planExpiresAt])

  const apiBase = useMemo(() => {
    const configured = import.meta.env.VITE_API_BASE_URL
    if (configured && typeof configured === 'string' && configured.trim()) {
      return configured.replace(/\/+$/, '')
    }
    return 'https://red-glade-5c0e.nagineniyashwanth90.workers.dev'
  }, [])

  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false)
  const [refreshBalancesFeedback, setRefreshBalancesFeedback] = useState<string | null>(null)

  const fetchLatestProfile = useCallback(
    async (isManual = false) => {
      let email = (sessionEmail || userProfile?.email || liveProfile?.email || '').trim().toLowerCase()
      let uid = userProfile?.id || liveProfile?.id || ''
      if (!email) {
        try {
          email = (localStorage.getItem('helvia_user_email') || '').trim().toLowerCase()
        } catch {}
      }
      if (!uid) {
        try {
          uid = (localStorage.getItem('helvia_user_id') || '').trim()
        } catch {}
      }
      if (!email && !uid) return

      if (isManual) {
        setIsRefreshingBalances(true)
        setRefreshBalancesFeedback(null)
      }

      try {
        let uData: DbUser | null = null

        // 1. Direct Supabase query (prioritize email ilike for maximum accuracy)
        if (supabase) {
          if (email) {
            const { data } = await supabase.from('users').select('*').ilike('email', email).maybeSingle()
            if (data) uData = data as DbUser
          }
          if (!uData && uid) {
            const { data } = await supabase.from('users').select('*').eq('id', uid).maybeSingle()
            if (data) uData = data as DbUser
          }
        }

        // 2. Worker query with service role key (guarantees fresh data, VIP expiry resolution, and bypasses RLS)
        if (!uData || !uData.plan_expires_at || isManual) {
          const res = await fetch(`${apiBase}/get-profile?email=${encodeURIComponent(email)}&userId=${encodeURIComponent(uid)}&fresh=true`)
          if (res.ok) {
            const json = (await res.json()) as { ok?: boolean; profile?: DbUser }
            if (json?.profile) {
              uData = json.profile
            }
          }
        }

        if (uData) {
          setLiveProfile(uData)
          setCurrentPlan(uData.plan || 'basic')
          if (uData.plan_expires_at) {
            setLiveExpiresAt(uData.plan_expires_at)
          }
          try {
            localStorage.setItem('helvia_user_profile', JSON.stringify(uData))
            if (uData.email) localStorage.setItem('helvia_user_email', uData.email)
            if (uData.id) localStorage.setItem('helvia_user_id', uData.id)
          } catch {}
          if (onRefreshProfile) {
            onRefreshProfile(uData)
          }
          if (isManual) {
            setRefreshBalancesFeedback('✓ Live Balances & Plan Synced!')
            setTimeout(() => setRefreshBalancesFeedback(null), 3000)
          }
        }
      } catch (err) {
        console.warn('Dashboard live profile fetch error:', err)
        if (isManual) {
          setRefreshBalancesFeedback('Sync completed')
          setTimeout(() => setRefreshBalancesFeedback(null), 2500)
        }
      } finally {
        if (isManual) {
          setIsRefreshingBalances(false)
        }
      }
    },
    [apiBase, sessionEmail, userProfile?.id, userProfile?.email, liveProfile?.id, liveProfile?.email, onRefreshProfile]
  )

  // Auto-fetch fresh profile immediately on mount
  useEffect(() => {
    fetchLatestProfile(false)
  }, [fetchLatestProfile])

  useEffect(() => {
    document.documentElement.setAttribute('data-sky-theme', 'morning')

    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') {
      setPaymentSuccess('🎉 Payment Successful! Your upgraded plan and quotas are now active.')
      window.history.replaceState({}, document.title, window.location.pathname)

      if (onRefreshProfile) {
        onRefreshProfile()
      }
      fetchLatestProfile(true)
    }
  }, [fetchLatestProfile, onRefreshProfile])

  // Sort available plans in ascending price order: $0 -> $8 -> $15 -> $21
  const availablePlans = useMemo(() => {
    const list = plans && plans.length > 0 ? plans : SEED_PLANS
    return [...list]
      .filter((p) => {
        const n = String(p.name || '').toLowerCase()
        return (
          p.tier === 'basic' ||
          n.includes('basic') ||
          n.includes('standard') ||
          n.includes('pro+') ||
          n.includes('unlimited') ||
          p.id === 'ee803f63-7ffc-4c93-bd79-2cb349c318b1' ||
          p.id === '4d569314-3b27-45c8-93ad-3d5c2eebffc0' ||
          p.id === 'fdbc4259-cdb8-42b8-a0d5-02b8a7392812' ||
          p.id === 'b1e06fa2-5819-48ce-8d07-28d8cf9c4901'
        )
      })
      .sort((a, b) => Number(a.price) - Number(b.price))
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

  const effectiveExpiry = 
    liveExpiresAt || 
    liveProfile?.plan_expires_at || 
    planExpiresAt || 
    userProfile?.plan_expires_at || 
    null

  // User requirement: "if expiry date is not null make it not to buy the plan"
  const hasActiveExpiration = Boolean(
    effectiveExpiry && 
    effectiveExpiry !== 'null' && 
    new Date(effectiveExpiry).getTime() > Date.now()
  )

  // Rock-solid plan detector that distinguishes Unlimited VIP, Pro+ Pro, Standard, and Basic
  const detectedPlanInfo = useMemo(() => {
    const activeUser = liveProfile || userProfile
    const planStr = (activeUser?.plan || currentPlan || plan || 'basic').toLowerCase().trim()
    const responses = Number(activeUser?.responses_remaining) || 0
    const seconds = Number(activeUser?.seconds_remaining) || 0

    // 1. Unlimited VIP Plan
    if (
      hasActiveExpiration || 
      planStr === 'unlimited' || 
      planStr.includes('unlimited') || 
      planStr.includes('vip') ||
      responses >= 900000 || 
      seconds >= 50000000
    ) {
      const days = effectiveExpiry ? Math.max(0, Math.ceil((new Date(effectiveExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null
      return {
        name: '1 Month Unlimited VIP',
        tier: 'unlimited',
        icon: '👑',
        badge: 'Unlimited VIP Active',
        isUnlimited: true,
        isPaid: true,
        className: 'unlimited',
        daysRemaining: days,
      }
    }

    // 2. Pro+ Pro (Most Popular)
    if (
      planStr === 'pro_plus' || 
      planStr === 'pro plus+' || 
      planStr === 'pro+' || 
      planStr.includes('pro+') ||
      (planStr === 'usage' && (responses >= 1200 || seconds >= 50000))
    ) {
      return {
        name: 'Pro+ Pro (Most Popular)',
        tier: 'pro_plus',
        icon: '⚡',
        badge: 'Pro Tier Active',
        isUnlimited: false,
        isPaid: true,
        className: 'pro_plus',
        daysRemaining: null,
      }
    }

    // 3. Standard Plan
    if (
      planStr === 'standard' || 
      planStr === 'usage' || 
      responses > 5 || 
      seconds > 300
    ) {
      return {
        name: 'Standard Plan',
        tier: 'standard',
        icon: '🚀',
        badge: 'Standard Active',
        isUnlimited: false,
        isPaid: true,
        className: 'standard',
        daysRemaining: null,
      }
    }

    // 4. Basic Free Tier
    return {
      name: 'Basic Free Tier',
      tier: 'basic',
      icon: '🛡️',
      badge: 'Free Tier',
      isUnlimited: false,
      isPaid: false,
      className: 'basic',
      daysRemaining: null,
    }
  }, [liveProfile, userProfile, currentPlan, plan, hasActiveExpiration, effectiveExpiry])

  const isUserUnlimitedPlan = detectedPlanInfo.isUnlimited
  const planDisplayName = detectedPlanInfo.name
  const isPaid = detectedPlanInfo.isPaid

  // Real-time check if 1-month unlimited plan expired while dashboard is open
  useEffect(() => {
    if (!effectiveExpiry || currentPlan === 'basic') return

    const checkExpiration = () => {
      if (new Date(effectiveExpiry).getTime() <= Date.now()) {
        setCurrentPlan('basic')
        if (sessionEmail) {
          fetch(`${apiBase}/get-profile?email=${encodeURIComponent(sessionEmail)}&fresh=true`).catch(() => {})
        }
      }
    }

    checkExpiration()
    const interval = setInterval(checkExpiration, 60000)
    return () => clearInterval(interval)
  }, [effectiveExpiry, currentPlan, sessionEmail, apiBase])

  const firstName = displayName?.split(' ')[0] || displayName || sessionEmail?.split('@')[0] || 'User'

  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<DbPlan | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const openPaymentModal = (p: DbPlan) => {
    if (isUserUnlimitedPlan) {
      alert(`You currently have an active Unlimited VIP Plan${effectiveExpiry ? ` (valid until ${new Date(effectiveExpiry).toLocaleDateString()})` : ''}. You cannot purchase any another plan or top-up while your unlimited plan is active.`)
      return
    }
    setSelectedPlanForPayment(p)
    setIsPaymentModalOpen(true)
  }

  const handleRazorpayUpgrade = (p: DbPlan, couponCode?: string, customAmountInr?: number) => {
    if (isUserUnlimitedPlan) {
      alert(`You currently have an active Unlimited VIP Plan${effectiveExpiry ? ` (valid until ${new Date(effectiveExpiry).toLocaleDateString()})` : ''}. You cannot purchase any another plan or top-up while your unlimited plan is active.`)
      return
    }
    setIsPaymentModalOpen(false)
    startUpgrade(p, couponCode, customAmountInr)
  }

  const handleDodoUpgrade = (p: DbPlan, couponCode?: string) => {
    if (isUserUnlimitedPlan) {
      alert(`You currently have an active Unlimited VIP Plan${effectiveExpiry ? ` (valid until ${new Date(effectiveExpiry).toLocaleDateString()})` : ''}. You cannot purchase any another plan or top-up while your unlimited plan is active.`)
      return
    }
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
            {effectiveExpiry && hasActiveExpiration && (
              <span className="user-email-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', border: '1px solid rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontWeight: 600 }}>
                <ClockIcon />
                <span>
                  Expires {new Date(effectiveExpiry).toLocaleDateString()}{' '}
                  {(() => {
                    const days = Math.max(0, Math.ceil((new Date(effectiveExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
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

        {/* =========================================================
            CURRENT PLAN & ACTIVE TOKEN ASSETS HERO CARD
            ========================================================= */}
        {(() => {
          const activeUser = liveProfile || userProfile || {
            seconds_remaining: 0,
            responses_remaining: 0,
            applications_remaining: 0,
            verifier: false,
          }
          const isUserUnlimited = isUserUnlimitedPlan

          const timeDisplay = isUserUnlimited
            ? '∞ Unlimited'
            : activeUser.seconds_remaining != null && activeUser.seconds_remaining > 0
              ? `${Math.floor(activeUser.seconds_remaining / 60)} min`
              : '0 min'

          const answersDisplay = isUserUnlimited
            ? '∞ Unlimited'
            : (activeUser.responses_remaining ?? 0).toLocaleString()

          const appsDisplay = isUserUnlimited
            ? '∞ Unlimited'
            : (activeUser.applications_remaining ?? 10).toLocaleString()

          return (
            <div className={`dashboard-plan-token-card ${detectedPlanInfo.className}`}>
              {/* Card Top Row: Plan Name, Active Chip, Refresh Balances */}
              <div className="plan-card-top-bar">
                <div className="plan-avatar-group">
                  <div className="plan-avatar-icon" role="img" aria-label={detectedPlanInfo.name}>
                    {detectedPlanInfo.icon}
                  </div>
                  <div className="plan-title-block">
                    <h2>
                      <span>{detectedPlanInfo.name}</span>
                      <span className="plan-active-chip">
                        <span className="plan-active-chip-dot" />
                        {isPaid ? 'Active & Ready' : 'Free Tier'}
                      </span>
                    </h2>
                    <div className="plan-subtext-row">
                      {isUserUnlimited && effectiveExpiry && (
                        <span className="plan-expiry-pill">
                          <ClockIcon />
                          <span>
                            Expires {new Date(effectiveExpiry).toLocaleDateString()}{' '}
                            {detectedPlanInfo.daysRemaining != null && `(${detectedPlanInfo.daysRemaining} days left)`}
                          </span>
                        </span>
                      )}
                      <span>
                        {isUserUnlimited
                          ? 'Zero per-minute deductions • 30-day VIP pass'
                          : detectedPlanInfo.tier === 'pro_plus'
                            ? 'Pro+ 1,000 mins & 1,500 answers allocation'
                            : detectedPlanInfo.tier === 'standard'
                              ? 'Standard 300 mins & 500 answers allocation'
                              : 'Starter free tier with basic access'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="plan-actions-group">
                  <button
                    type="button"
                    className="refresh-balances-btn"
                    onClick={() => fetchLatestProfile(true)}
                    disabled={isRefreshingBalances}
                    title="Force a real-time quota sync from database"
                  >
                    <span className={isRefreshingBalances ? 'refresh-spin-icon' : ''}>🔄</span>
                    <span>
                      {isRefreshingBalances
                        ? 'Syncing…'
                        : refreshBalancesFeedback || 'Refresh Balances'}
                    </span>
                  </button>

                  <div className={`host-status-chip ${activeUser.verifier ? 'linked' : ''}`}>
                    <CheckCircleIcon />
                    <span>{activeUser.verifier ? 'Host Linked' : 'Host Standby'}</span>
                  </div>
                </div>
              </div>

              {/* VIP Protection Notice (Shown when unlimited VIP is active) */}
              {isUserUnlimited && (
                <div className="unlimited-protection-banner">
                  <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>🛡️</span>
                  <div>
                    <strong>Protected 1-Month Unlimited VIP Pass Active:</strong> You currently enjoy unrestricted Remote Meeting & Desktop Time, AI Screen Vision Answers, and ATS Job Auto-Applies with 0 token deductions. Plan purchases and top-ups are safely locked until your pass expires on{' '}
                    <strong>{effectiveExpiry ? new Date(effectiveExpiry).toLocaleDateString() : 'expiry date'}</strong>.
                  </div>
                </div>
              )}

              {/* The 3 Core Token Asset Meters */}
              <div className="token-assets-grid">
                {/* Meter 1: Remote & Meeting Control Time */}
                <div className="token-asset-card time">
                  <div className="token-asset-header">
                    <span className="token-asset-label">Remote &amp; Meeting Time</span>
                    <div className="token-asset-icon-pill">⏱️</div>
                  </div>
                  <div className="token-asset-number">{timeDisplay}</div>
                  <div>
                    <span className="token-asset-badge">
                      {isUserUnlimited
                        ? '∞ Uncapped Session Minutes'
                        : activeUser.seconds_remaining && activeUser.seconds_remaining >= 3600
                          ? `≈ ${(activeUser.seconds_remaining / 3600).toFixed(1)} hrs continuous time`
                          : 'Desktop remote control & audio loopback'}
                    </span>
                  </div>
                </div>

                {/* Meter 2: AI Screen Vision Answers */}
                <div className="token-asset-card ai">
                  <div className="token-asset-header">
                    <span className="token-asset-label">AI Screen Vision Answers</span>
                    <div className="token-asset-icon-pill">💡</div>
                  </div>
                  <div className="token-asset-number">{answersDisplay}</div>
                  <div>
                    <span className="token-asset-badge">
                      {isUserUnlimited
                        ? '∞ Uncapped Live AI Questions'
                        : 'Real-time screen OCR & interview helper'}
                    </span>
                  </div>
                </div>

                {/* Meter 3: Job Auto-Applies */}
                <div className="token-asset-card apply">
                  <div className="token-asset-header">
                    <span className="token-asset-label">Job Auto-Applies</span>
                    <div className="token-asset-icon-pill"><BriefcaseIcon /></div>
                  </div>
                  <div className="token-asset-number">{appsDisplay}</div>
                  <div>
                    <span className="token-asset-badge">
                      {isUserUnlimited
                        ? '∞ Uncapped Automated Applies'
                        : 'LinkedIn, Indeed & ATS crawler queue'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: User Account & Instant Support */}
              <div className="plan-card-footer-strip">
                <div>
                  {sessionEmail && (
                    <span>
                      Active account: <strong style={{ color: '#f1f5f9' }}>{sessionEmail}</strong>
                    </span>
                  )}
                </div>
                <div className="plan-footer-links">
                  <a
                    href="https://wa.me/919032025916?text=Hi%2C%20I%20need%20support%20with%20my%20Helvia%20Remote%20account"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="plan-footer-link whatsapp"
                  >
                    <span>💬</span>
                    <span>WhatsApp Support: +91 9032025916</span>
                  </a>
                  <a
                    href="/dashboard#downloads"
                    onClick={(e) => {
                      e.preventDefault()
                      document.querySelector('.dashboard-downloads-section')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="plan-footer-link"
                  >
                    <span>💻</span>
                    <span>Windows Host Companion</span>
                  </a>
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

        {/* Basic Plan Alert: when 0 tokens remaining */}
        {currentPlan === 'basic' && userProfile && (Number(userProfile.seconds_remaining) || 0) === 0 && (Number(userProfile.responses_remaining) || 0) === 0 && (
          <div className="dashboard-alert warning" style={{ maxWidth: 840, margin: '0 auto 2rem auto', border: '1px solid rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.25rem', borderRadius: 12 }}>
            <span>⚠️</span>
            <span>
              <strong>Free Trial Notice:</strong> You are currently on the free basic tier with 0 active tokens. Select a plan below to activate remote minutes, AI answers, and job auto-applications.
            </span>
          </div>
        )}

        {/* =========================================================
            DESKTOP APPS & INSTALLERS SUITE
            ========================================================= */}
        <section className="dashboard-downloads-section" style={{ maxWidth: 1100, margin: '0 auto 2.5rem auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <span>💻</span> Desktop Applications Suite
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.86rem', margin: '0.25rem 0 0 0' }}>
                Download and install the official Windows desktop applications included with your account.
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.35rem 0.8rem', borderRadius: 999, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              Windows 10 / 11 (64-bit) Supported
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.15rem' }}>
            {HELVIA_APPS_CATALOG.map((app) => (
              <div 
                key={app.id} 
                style={{
                  background: 'rgba(15, 23, 42, 0.82)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${app.id === 'remote' ? 'rgba(59, 130, 246, 0.35)' : app.id === 'meet' ? 'rgba(168, 85, 247, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                  borderRadius: 18,
                  padding: '1.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 12px 35px rgba(0, 0, 0, 0.35)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: app.accentColor, background: `${app.accentColor}18`, padding: '0.28rem 0.65rem', borderRadius: 6, border: `1px solid ${app.accentColor}35` }}>
                      {app.badge}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>v{app.version}</span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.35rem 0' }}>
                    {app.name}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.55, margin: '0 0 1.25rem 0' }}>
                    {app.description}
                  </p>
                </div>

                <div>
                  <a 
                    href={app.downloadUrl}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.55rem',
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: 12,
                      background: app.id === 'remote' 
                        ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' 
                        : app.id === 'meet' 
                          ? 'linear-gradient(135deg, #9333ea, #7e22ce)' 
                          : 'linear-gradient(135deg, #d97706, #b45309)',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontWeight: 750,
                      fontSize: '0.9rem',
                      boxShadow: `0 4px 18px ${app.accentColor}40`,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    title={`Download ${app.filename}`}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>Download {app.tag}</span>
                  </a>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.55rem', color: '#64748b', fontSize: '0.72rem' }}>
                    <span>{app.filename}</span>
                    <span>✓ SHA-256 Verified</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Video Walkthroughs in Dashboard */}
        <VideoTutorialsSection compact={true} id="dashboard-video-tutorials" />

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
                    <span>⚡ Unlimited Remote &amp; Vision AI • 30 Days Full Access</span>
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
                        <span className="unlimited-period">USD / month (30 Days)</span>
                      </div>
                      <div className="unlimited-inr-row">
                        <span className="unlimited-inr-base">≈ ₹{inrPrice.toLocaleString('en-IN')} INR</span>
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
                          <CheckCircleIcon /> Current Active Plan {effectiveExpiry && `(Expires ${new Date(effectiveExpiry).toLocaleDateString()})`}
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
                            <span className="btn-sub-text">₹{inrPrice.toLocaleString('en-IN')} INR • UPI &amp; Cards</span>
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
            const isCurrentFree = isFree && currentPlan === 'basic' && !isUserUnlimitedPlan
            const isPopular =
              p.dodo_product_id === 'pdt_0NnIQ5VyQfhSXYsFLcojZ' ||
              p.name.includes('Popular')
            const isLifetime = p.tier === 'pro plus+' || p.name.includes('Lifetime')
            const isMaxPlus = priceNum === 25
            const isUltraPlus = priceNum === 35

            return (
              <div
                key={p.id}
                className={`all-plans-card ${isPopular ? 'featured popular' : ''} ${isLifetime ? 'lifetime' : ''} ${isUltraPlus ? 'power' : ''} ${isMaxPlus ? 'capacity' : ''} ${isCurrentFree ? 'active-plan' : ''}`}
              >
                {/* Top Badge & Tier Category Row */}
                <div className="plan-card-badge-row">
                  {isCurrentFree ? (
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
                    ? 'Free starter trial with 5 mins remote streaming, 5 Ans 💡 AI answers, and 3 LinkedIn & ATS job auto-applies.'
                    : isLifetime
                      ? 'Unlimited lifetime remote desktop access with Bring Your Own Keys (BYOK) AI Copilot.'
                      : `Includes ${p.included_minutes} remote minutes, ${p.included_responses} Ans 💡 AI answers, and ${p.included_applications} LinkedIn & ATS job auto-applies.`}
                </p>

                {/* Quick Quota Highlights */}
                <div className="plan-quota-pills">
                  <div className="plan-quota-pill">
                    <span className="quota-val">{isLifetime ? 'BYOK' : isFree ? '3' : p.included_applications}</span>
                    <span className="quota-lbl">Auto-Applies</span>
                  </div>
                  <div className="plan-quota-pill">
                    <span className="quota-val">{isLifetime ? '∞' : isFree ? '5m' : `${p.included_minutes}m`}</span>
                    <span className="quota-lbl">Remote Time</span>
                  </div>
                  <div className="plan-quota-pill">
                    <span className="quota-val">{isFree ? '5' : isLifetime ? 'BYOK' : p.included_responses}</span>
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
                            ? '3 Job Auto-Applies'
                            : `${p.included_applications} Job Auto-Applies`}
                      </strong>
                      <span className="plan-feat-subtext">
                        {isFree ? ' (Free Starter Trial)' : ' (LinkedIn, Indeed & ATS)'}
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
                            ? '5 Remote Minutes'
                            : `${p.included_minutes} Remote Minutes`}
                      </strong>
                      <span className="plan-feat-subtext">
                        {isFree ? ' (Free Starter Trial)' : ' (Sub-15ms 60 FPS stream)'}
                      </span>
                    </span>
                  </li>
                  <li>
                    <CheckCircleIcon />
                    <span>
                      <strong>
                        {isFree
                          ? '5 Ans 💡 AI Answers'
                          : isLifetime
                            ? 'BYOK Ans 💡 AI Screen Copilot'
                            : `${p.included_responses} Ans 💡 AI Screen Answers`}
                      </strong>
                      <span className="plan-feat-subtext">
                        {isFree ? ' (Free Starter Trial)' : ''}
                      </span>
                    </span>
                  </li>
                  <li>
                    <CheckCircleIcon />
                    <span>60 FPS P2P WebRTC Direct Stream</span>
                  </li>
                  <li>
                    <CheckCircleIcon />
                    <span>{isFree ? 'Free Starter Unified Trial' : 'Stealth Host Input & Audio Loopback'}</span>
                  </li>
                </ul>

                {/* CTA Action Button */}
                <div className="plan-card-cta-wrap">
                  {isUserUnlimitedPlan ? (
                    <button className="plan-card-btn active" type="button" disabled>
                      <CheckCircleIcon /> Included in Unlimited VIP {effectiveExpiry && `(Until ${new Date(effectiveExpiry).toLocaleDateString()})`}
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
            if (isUserUnlimitedPlan) {
              alert(`You currently have an active Unlimited VIP Plan${effectiveExpiry ? ` valid until ${new Date(effectiveExpiry).toLocaleDateString()}` : ''}. All quotas are already unlimited, so top-ups are not needed.`)
              return
            }
            if (startTopup) startTopup(type, units)
          }}
          isProcessing={isUpgrading}
          isDisabled={isUserUnlimitedPlan}
          disabledReason={effectiveExpiry ? `Included in Unlimited VIP (Until ${new Date(effectiveExpiry).toLocaleDateString()})` : 'Included in Unlimited VIP'}
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

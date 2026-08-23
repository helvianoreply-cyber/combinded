import React, { useMemo, useState, useEffect } from 'react'
import { SkyCanvas3D } from './SkyCanvas3D'

interface DashboardProps {
  displayName: string | null
  sessionEmail: string | null
  plan: string
  planExpiresAt: string | null
  startUpgrade: (duration: '24h' | 'month') => void
  isUpgrading: boolean
  upgradeError: string | null
}

// Icon Components
const LinkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
)

const CrownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
)

const ShieldCheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <polyline points="9 12 12 15 16 10"></polyline>
  </svg>
)

export const Dashboard: React.FC<DashboardProps> = ({
  displayName,
  sessionEmail,
  plan,
  planExpiresAt,
  startUpgrade,
  isUpgrading,
  upgradeError,
}) => {
  const [linkCode, setLinkCode] = useState('')
  const [isLinking, setIsLinking] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    setAnimated(true)
    document.documentElement.setAttribute('data-sky-theme', 'morning')
  }, [])

  const apiBase = useMemo(() => {
    const configured = import.meta.env.VITE_API_BASE_URL
    if (configured && typeof configured === 'string' && configured.trim()) {
      return configured.replace(/\/+$/, '')
    }

    return 'https://dawn-cloud-c3c5.helvia-noreply.workers.dev'
  }, [])

  const submitLinkCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLinkError(null)
    setLinkSuccess(null)

    const email = (sessionEmail || '').trim().toLowerCase()
    const code = linkCode.trim()
    if (!email) {
      setLinkError('Missing account email')
      return
    }
    if (!code) {
      setLinkError('Enter the code shown in your desktop app')
      return
    }

    setIsLinking(true)
    try {
      const res = await fetch(`${apiBase}/link/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: code,
          email,
        }),
      })

      let data: { ok?: boolean; message?: string } | null = null
      try {
        data = (await res.json()) as { ok?: boolean; message?: string } | null
      } catch {
        data = null
      }

      if (!res.ok || !data?.ok) {
        const message =
          (data && typeof data.message === 'string' && data.message) ||
          `Failed to link code (status ${res.status})`
        setLinkError(message)
        setIsLinking(false)
        return
      }

      setLinkSuccess('Device connected successfully! You can now control it seamlessly.')
      setLinkCode('')
      setIsLinking(false)
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'message' in e && typeof e.message === 'string'
          ? e.message
          : 'Failed to link code'
      setLinkError(msg)
      setIsLinking(false)
    }
  }

  const isPro = plan === 'pro'
  const firstName = displayName?.split(' ')[0] || displayName || sessionEmail?.split('@')[0] || 'User'

  const formatExpiry = (dateStr: string | null) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <>
      <SkyCanvas3D scrollProgress={0} manualTimeOverride={0} />
      <div className="dashboard-page-container">
        {/* Welcome Hero Section */}
        <section className={`dashboard-hero ${animated ? 'animate-in' : ''}`}>
          <div className="dashboard-hero-content">
            <div className="dashboard-hero-badge">
              <span className={`plan-indicator ${isPro ? 'pro' : 'free'}`}>
                {isPro ? <CrownIcon /> : <ShieldCheckIcon />}
                {isPro ? 'Pro Plan Active' : 'Free Trial Mode'}
              </span>
            </div>
            <h1>Welcome back, {firstName}</h1>
            <p className="dashboard-hero-subtitle">
              {isPro 
                ? 'Your workstation is powered with full Pro capabilities. Enjoy unlimited ultra-low-latency remote sessions!' 
                : 'Connect your host PC below or unlock full Pro access with unmetered sessions and AI Copilot.'}
            </p>
            {planExpiresAt && (
              <div className="expiry-badge">
                <ClockIcon />
                <span>Pro expires on {formatExpiry(planExpiresAt)}</span>
              </div>
            )}
          </div>
          
          <div className="dashboard-stats">
            <div className="dashboard-stat-card">
              <div className="stat-icon-wrapper blue">
                <LinkIcon />
              </div>
              <div className="stat-info">
                <p className="stat-value">Ready</p>
                <p className="stat-label">Connection Status</p>
              </div>
            </div>
            <div className="dashboard-stat-card">
              <div className="stat-icon-wrapper green">
                <ShieldCheckIcon />
              </div>
              <div className="stat-info">
                <p className="stat-value">Active</p>
                <p className="stat-label">Account Status</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions Grid */}
        <section className="dashboard-grid">
          {/* Link Device Card */}
          <div className={`dashboard-card link-card ${animated ? 'animate-in stagger-1' : ''}`}>
            <div className="dashboard-card-header">
              <div className="dashboard-card-icon blue">
                <LinkIcon />
              </div>
              <div>
                <h2>Connect Desktop</h2>
                <p className="dashboard-card-subtitle">Link your Windows PC to start remote control</p>
              </div>
            </div>
            
            <form className="link-code-section" onSubmit={submitLinkCode}>
              <label className="link-code-label">
                Enter the 6-digit code displayed on your Windows host app:
              </label>
              <div className="link-code-input-group">
                <input
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="link-code-input"
                  maxLength={6}
                  disabled={isLinking}
                  autoComplete="off"
                  spellCheck="false"
                />
                <button 
                  className="link-button primary" 
                  type="submit"
                  disabled={isLinking || linkCode.length < 6}
                >
                  {isLinking ? (
                    <span className="button-spinner"></span>
                  ) : (
                    <>
                      <LinkIcon />
                      <span>Connect</span>
                    </>
                  )}
                </button>
              </div>
              {linkError && (
                <div className="dashboard-alert error">
                  <span>⚠️</span>
                  <span>{linkError}</span>
                </div>
              )}
              {linkSuccess && (
                <div className="dashboard-alert success">
                  <CheckCircleIcon />
                  <span>{linkSuccess}</span>
                </div>
              )}
            </form>

            <div className="download-app-banner">
              <div className="download-app-content">
                <div className="download-app-icon-wrap">
                  <DownloadIcon />
                </div>
                <div>
                  <p className="download-app-title">Need the Windows Host Agent?</p>
                  <p className="download-app-desc">Download and launch Helvia Remote on your PC</p>
                </div>
              </div>
              <a 
                href="https://pub-4ec430c8cdbd49ffb57191dca016c43b.r2.dev/Helvia%20Remote%20Setup%200.1.0.exe"
                className="download-host-btn"
                title="Download Windows Host"
              >
                <span>Download .exe</span>
              </a>
            </div>
          </div>

          {/* Upgrade Card */}
          <div className={`dashboard-card upgrade-card ${animated ? 'animate-in stagger-2' : ''}`}>
            <div className="dashboard-card-header">
              <div className={`dashboard-card-icon ${isPro ? 'gold' : 'blue'}`}>
                <CrownIcon />
              </div>
              <div>
                <h2>{isPro ? 'Pro Subscription' : 'Upgrade to Pro'}</h2>
                <p className="dashboard-card-subtitle">
                  {isPro ? 'Full access to unmetered sessions & AI Screen Copilot' : 'Unlock unlimited 60 FPS remote sessions & instant AI intelligence'}
                </p>
              </div>
            </div>

            {!isPro && (
              <div className="upgrade-benefits">
                <div className="benefit-item">
                  <CheckCircleIcon />
                  <span>Unlimited session duration</span>
                </div>
                <div className="benefit-item">
                  <CheckCircleIcon />
                  <span>Priority connection servers</span>
                </div>
                <div className="benefit-item">
                  <CheckCircleIcon />
                  <span>Ans 💡 AI Screen Copilot</span>
                </div>
                <div className="benefit-item">
                  <CheckCircleIcon />
                  <span>Multi-device connection pairing</span>
                </div>
              </div>
            )}

            {isPro && (
              <div className="pro-status-box">
                <div className="pro-badge-large">
                  <CrownIcon />
                  <span>Pro Member Active</span>
                </div>
                <p className="pro-thanks">Thank you for powering your remote workstation with Helvia!</p>
              </div>
            )}

            <div className="dash-pricing-grid">
              {/* 10 Min Trial */}
              <div className="dash-plan-tile">
                <div className="dash-plan-header">
                  <span className="dash-plan-name">10 Min Trial</span>
                  <div className="dash-plan-price-wrap">
                    <span className="dash-plan-price free">Free</span>
                  </div>
                </div>
                <p className="dash-plan-info">Basic remote desktop for quick verification.</p>
                <button
                  className="dash-plan-btn secondary"
                  type="button"
                  disabled
                >
                  {!isPro ? 'Active by default' : 'Included'}
                </button>
              </div>

              {/* 1 Month Pro */}
              <div className="dash-plan-tile featured">
                <div className="dash-plan-badge-pill">Best Value</div>
                <div className="dash-plan-header">
                  <span className="dash-plan-name">1 Month Pro</span>
                  <div className="dash-plan-price-wrap">
                    <span className="dash-plan-price highlight">₹999</span>
                    <span className="dash-plan-period">/ month</span>
                  </div>
                </div>
                <p className="dash-plan-info">Full unmetered access for 30 days &amp; AI Copilot.</p>
                <button
                  className="dash-plan-btn primary featured"
                  type="button"
                  onClick={() => startUpgrade('month')}
                  disabled={isUpgrading || isPro}
                >
                  {isPro ? 'Active' : 'Get Pro'}
                </button>
              </div>
            </div>

            {upgradeError && (
              <div className="dashboard-alert error" style={{ marginTop: '1rem' }}>
                <span>⚠️</span>
                <span>{upgradeError}</span>
              </div>
            )}
          </div>
        </section>

        {/* Tips Section */}
        <section className={`dashboard-tips ${animated ? 'animate-in stagger-3' : ''}`}>
          <h3>Quick Setup &amp; Operation Tips</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-number">1</div>
              <p className="tip-text">Download and run the Helvia Host agent on your Windows PC.</p>
            </div>
            <div className="tip-card">
              <div className="tip-number">2</div>
              <p className="tip-text">Copy the 6-character connection code generated by the host.</p>
            </div>
            <div className="tip-card">
              <div className="tip-number">3</div>
              <p className="tip-text">Paste the code into the connect box above to establish a direct WebRTC stream.</p>
            </div>
            <div className="tip-card">
              <div className="tip-number">4</div>
              <p className="tip-text">Enjoy zero-install remote desktop with 60 FPS hardware precision.</p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from './lib/supabaseClient'
import { LandingPage } from './components/LandingPage'
import { Dashboard } from './components/Dashboard'
import './App.css'

function PrivacyPolicyPage() {
  return (
    <section className="policy-page">
      <h1>Privacy Policy</h1>
      <p>Last updated: 2/12/2026</p>
      <p>
        Helvia respects your privacy. This Privacy Policy explains what information we collect, how we
        use it, and your rights and choices. If you have any questions, contact us at privacy@helvia.ai.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>Account info (name, email) from sign-in providers</li>
        <li>Usage data to improve product reliability and performance</li>
        <li>Content you choose to upload or connect</li>
      </ul>
      <h2>How we use information</h2>
      <ul>
        <li>Provide and improve Helvia features</li>
        <li>Security, fraud prevention, and compliance</li>
        <li>Customer support and product communications</li>
      </ul>
      <h2>Sharing</h2>
      <p>
        We do not sell personal data. We may share with service providers under contract, or when
        required by law.
      </p>
      <h2>Your choices</h2>
      <ul>
        <li>Access, export, or delete your data by contacting support</li>
        <li>Manage connected integrations from your account</li>
      </ul>
      <p>Contact: privacy@helvia.ai</p>
      <p>Founder: N Yashwanth</p>
    </section>
  )
}

function TermsOfServicePage() {
  return (
    <section className="policy-page">
      <h1>Terms of Service</h1>
      <p>Last updated: 2/12/2026</p>
      <p>
        These Terms of Service govern your access to and use of Helvia. By using Helvia, you agree to
        be bound by these Terms.
      </p>
      <h2>Use of Service</h2>
      <ul>
        <li>You must comply with all applicable laws and regulations.</li>
        <li>Do not misuse, interfere with, or disrupt the Service.</li>
        <li>You are responsible for maintaining the confidentiality of your account.</li>
      </ul>
      <h2>Content</h2>
      <p>
        You retain ownership of your content. You grant Helvia the rights necessary to provide the
        Service. Do not upload or share content you do not have rights to.
      </p>
      <h2>Disclaimers</h2>
      <p>
        The Service is provided &quot;as is&quot; without warranties of any kind. To the maximum extent
        permitted by law, Helvia disclaims all warranties and liability.
      </p>
      <h2>Termination</h2>
      <p>
        We may suspend or terminate access if these Terms are violated or for operational or security
        reasons.
      </p>
      <p>Contact: legal@helvia.ai</p>
      <p>Founder: N Yashwanth</p>
    </section>
  )
}

function RefundPolicyPage() {
  return (
    <section className="policy-page">
      <h1>Refund &amp; Cancellation Policy</h1>
      <p>Last updated: 2/12/2026</p>
      <h2>Cancellations</h2>
      <p>
        There is no in-app cancellation for current billing periods. You can stop future renewals by not
        renewing your plan at the end of the term.
      </p>
      <h2>Refunds</h2>
      <p>
        If you encounter a critical bug that prevents normal use of Helvia, you may request a refund.
        Please contact us with details and reproduction steps so we can verify and assist promptly.
      </p>
      <ul>
        <li>Refunds are considered for functionality-breaking issues.</li>
        <li>We may request logs or screenshots to diagnose the problem.</li>
        <li>Approved refunds are processed back to the original payment method.</li>
      </ul>
      <p>Contact: support@helvia.ai</p>
    </section>
  )
}

function App() {
  const [userId, setUserId] = useState<string | null>(null)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [plan, setPlan] = useState<string>('basic')
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  const isSignedIn = Boolean(userId)

  // Initialize session
  useEffect(() => {
    const sb = supabase
    if (!isSupabaseConfigured || !sb) {
      setIsAuthLoading(false)
      return
    }

    const init = async () => {
      setIsAuthLoading(true)
      try {
        const result = (await Promise.race([
          sb.auth.getSession(),
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { session: null },
                  error: null,
                }),
              5000,
            ),
          ),
        ])) as { data: { session: unknown } | null; error: { message?: string } | null }

        const data = result.data
        const error = result.error

        if (error) {
          setAuthError(error.message ?? 'Failed to load session')
          setUserId(null)
          setSessionEmail(null)
          setDisplayName(null)
          setIsAuthLoading(false)
          return
        }

        const session = data?.session as
          | {
              user: {
                id: string
                email?: string | null
                user_metadata?: { [key: string]: unknown }
              }
            }
          | null

        if (session) {
          const email = session.user.email ?? null
          const name =
            (session.user.user_metadata?.full_name as string | undefined) ??
            (session.user.user_metadata?.name as string | undefined) ??
            null
          const id = session.user.id

          setUserId(id)
          setSessionEmail(email)
          setDisplayName(name)

          try {
            const { data: profile } = await sb.from('profiles').select('*').eq('id', id).maybeSingle()
            if (profile) {
              setPlan((profile as { plan?: string | null }).plan || 'basic')
              setPlanExpiresAt((profile as { plan_expires_at?: string | null }).plan_expires_at || null)
            }
          } catch (err) {
            console.error('Profile fetch failed', err)
          }
        }

        setIsAuthLoading(false)
      } catch (err) {
        console.error('Session check failed', err)
        setIsAuthLoading(false)
      }
    }

    init()

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange(async (event, session) => {
      const email = session?.user?.email ?? null
      const name =
        (session?.user?.user_metadata?.full_name as string | undefined) ??
        (session?.user?.user_metadata?.name as string | undefined) ??
        null
      const id = session?.user?.id ?? null
      
      setUserId(id)
      setSessionEmail(email)
      setDisplayName(name)

      if (session) {
        // Upsert profile
        const fullName =
          (session.user.user_metadata?.full_name as string | undefined) ??
          (session.user.user_metadata?.name as string | undefined) ??
          null
        const avatar =
          (session.user.user_metadata?.avatar_url as string | undefined) ??
          (session.user.user_metadata?.picture as string | undefined) ??
          null

        await sb
          .from('profiles')
          .upsert(
            {
              id: session.user.id,
              email,
              full_name: fullName,
              avatar_url: avatar,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          )

        const { data: profile } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        if (profile) {
          setPlan(profile.plan || 'basic')
          setPlanExpiresAt(profile.plan_expires_at || null)
        }
        
        if (event === 'SIGNED_IN') {
          let postAuthRedirect = ''
          try {
            postAuthRedirect = window.sessionStorage.getItem('postAuthRedirect') || ''
          } catch {
            postAuthRedirect = ''
          }

          if (postAuthRedirect) {
            try {
              window.sessionStorage.removeItem('postAuthRedirect')
            } catch {
              void 0
            }
            navigate(postAuthRedirect)
          } else if (location.pathname === '/') {
            navigate('/dashboard')
          }
        }
      } else {
        setPlan('basic')
        setPlanExpiresAt(null)
        if (event === 'SIGNED_OUT') {
           navigate('/')
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, []) // Empty dependency array intentionally

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null)
    const sb = supabase
    if (!isSupabaseConfigured || !sb) {
      setAuthError('Supabase is not configured yet')
      return
    }

    const { origin, pathname, search } = window.location
    const isConnectRoute = pathname.startsWith('/connect')
    if (isConnectRoute) {
      try {
        window.sessionStorage.setItem('postAuthRedirect', `${pathname}${search}`)
      } catch {
        void 0
      }
    }
    const redirectTo = `${origin}/`

    try {
      const {
        data: { session },
      } = await sb.auth.getSession()
      if (session) {
        await sb.auth.signOut()
      }
    } catch {
      void 0
    }

    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          prompt: 'select_account',
        },
      },
    })

    if (error) {
      console.error('Supabase OAuth sign-in failed', error)
      setAuthError(error.message)
    }
  }, [])

  const signOut = useCallback(async () => {
    setAuthError(null)
    setUpgradeError(null)

    const sb = supabase
    if (sb) {
      try {
        const { error } = await sb.auth.signOut()
        if (error) {
          console.error('Supabase sign-out failed', error)
        }
      } catch (err) {
        console.error('Supabase sign-out threw', err)
      }
    }

    setUserId(null)
    setSessionEmail(null)
    setDisplayName(null)
    setPlan('basic')
    setPlanExpiresAt(null)

    if (typeof window !== 'undefined') {
      const host = window.location.hostname
      const target =
        host === 'localhost' || host === '127.0.0.1' ? '/' : 'https://helvia.in/'
      window.location.href = target
    } else {
      navigate('/')
    }
  }, [navigate])

  const loadRazorpay = useCallback(() => {
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
      return Promise.resolve(true)
    }

    return new Promise<boolean>((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }, [])

  const startUpgrade = useCallback(async (duration: '24h' | 'month') => {
    setUpgradeError(null)
    if (!userId || !sessionEmail) {
      setUpgradeError('You must be signed in to upgrade')
      return
    }

    setIsUpgrading(true)
    const scriptLoaded = await loadRazorpay()
    if (!scriptLoaded || !(window as unknown as { Razorpay?: unknown }).Razorpay) {
      console.error('Razorpay SDK failed to load')
      setIsUpgrading(false)
      setUpgradeError('Unable to load Razorpay checkout')
      return
    }

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
      const response = await fetch(`${apiBase}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receipt: `helvia_${Date.now()}`,
          duration,
        }),
      })

      if (!response.ok) {
        let details: { message?: string } | null = null
        try {
          details = (await response.json()) as { message?: string }
        } catch {
          details = null
        }
        console.error('Create order failed', response.status, details)
        setIsUpgrading(false)
        setUpgradeError(details?.message ?? 'Unable to create Razorpay order')
        return
      }

      const data = (await response.json()) as {
        orderId: string
        amount: number
        currency: string
        keyId: string
      }

      const now = Date.now()
      const expires =
        duration === '24h'
          ? new Date(now + 24 * 60 * 60 * 1000)
          : new Date(now + 30 * 24 * 60 * 60 * 1000)
      const expiresIso = expires.toISOString()

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Helvia Remote Control',
        description: 'Upgrade plan',
        order_id: data.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
            const verifyRes = await fetch(`${apiBase}/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                userId,
                plan: 'pro',
                expiresAt: expiresIso,
              }),
            })

            if (!verifyRes.ok) {
              const err = await verifyRes.json().catch(() => ({}))
              throw new Error(err.message || 'Verification failed')
            }

            setPlan('pro')
            setPlanExpiresAt(expiresIso)
            setIsUpgrading(false)
          } catch (err) {
            console.error('Payment verification failed', err)
            setIsUpgrading(false)
            setUpgradeError(err instanceof Error ? err.message : 'Payment verification failed')
          }
        },
        prefill: {
          name: displayName ?? undefined,
          email: sessionEmail ?? undefined,
        },
        theme: {
          color: '#2563eb',
        },
      }

      const RazorpayCtor = (window as unknown as { Razorpay: new (options: unknown) => { on: (event: string, cb: () => void) => void; open: () => void } }).Razorpay
      const razorpay = new RazorpayCtor(options)
      razorpay.on('payment.failed', () => {
        setIsUpgrading(false)
        setUpgradeError('Payment failed, please try again')
      })
      razorpay.open()
    } catch (err) {
      console.error('Upgrade exception', err)
      setIsUpgrading(false)
      setUpgradeError('Something went wrong while creating payment')
    }
  }, [displayName, loadRazorpay, sessionEmail, userId])

  return (
    <div className="app">
      <header className="topbar">
        <div 
          className="brand" 
          onClick={() => { 
            navigate('/'); 
            setMobileNavOpen(false); 
          }} 
          style={{ cursor: 'pointer' }}
        >
          <div className="brand-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="brand-text-wrap">
            <span className="brand-title">Helvia <span className="brand-highlight">Remote</span></span>
          </div>
        </div>

        {location.pathname === '/' ? (
          <nav className="desktop-nav">
            <a href="#features" className="nav-item-link">Features</a>
            <a href="#how-it-works" className="nav-item-link">How It Works</a>
            <a href="#comparison" className="nav-item-link">Compare</a>
            <a href="#pricing" className="nav-item-link">Pricing</a>
          </nav>
        ) : null}

        <div className="account">
          {isSignedIn ? (
            <div className="user-nav-group">
              <span className="user-status-pill">
                <span className="user-online-dot" />
                <span className="user-display-email">{displayName || sessionEmail?.split('@')[0] || 'User'}</span>
              </span>
              {location.pathname === '/' ? (
                <button className="primary nav-cta-btn" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </button>
              ) : null}
              <button className="ghost-btn nav-cta-btn" onClick={signOut}>
                Sign out
              </button>
            </div>
          ) : (
            location.pathname !== '/connect' && (
              <div className="guest-nav-group">
                <a 
                  className="download-host-nav-btn" 
                  href="https://pub-4ec430c8cdbd49ffb57191dca016c43b.r2.dev/Helvia%20Remote%20Setup%200.1.0.exe"
                  title="Download Windows Host (.exe)"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
                  </svg>
                  <span>Host .exe</span>
                </a>
                <button className="primary nav-cta-btn" onClick={signInWithGoogle} disabled={!isSupabaseConfigured}>
                  Sign in
                </button>
              </div>
            )
          )}

          {location.pathname === '/' ? (
            <button 
              className="mobile-nav-toggle"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileNavOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </button>
          ) : null}
        </div>
      </header>

      {mobileNavOpen && location.pathname === '/' ? (
        <div className="mobile-nav-drawer">
          <nav className="mobile-nav-links">
            <a href="#features" onClick={() => setMobileNavOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileNavOpen(false)}>How It Works</a>
            <a href="#comparison" onClick={() => setMobileNavOpen(false)}>Comparison</a>
            <a href="#pricing" onClick={() => setMobileNavOpen(false)}>Pricing</a>
          </nav>
          <div className="mobile-nav-actions">
            <a 
              className="secondary mobile-download-link"
              href="https://pub-4ec430c8cdbd49ffb57191dca016c43b.r2.dev/Helvia%20Remote%20Setup%200.1.0.exe"
              onClick={() => setMobileNavOpen(false)}
            >
              Download Windows Host (.exe)
            </a>
          </div>
        </div>
      ) : null}

      {authError ? (
        <section className="banner error">
          <p>{authError}</p>
        </section>
      ) : null}

      <main className="content">
        <Routes>
          <Route
            path="/"
            element={
              <LandingPage
                signInWithGoogle={signInWithGoogle}
                isSupabaseConfigured={isSupabaseConfigured}
                isAuthLoading={isAuthLoading}
              />
            }
          />
          <Route path="/dashboard" element={
            isSignedIn ? (
              <Dashboard 
                displayName={displayName}
                sessionEmail={sessionEmail}
                plan={plan}
                planExpiresAt={planExpiresAt}
                startUpgrade={startUpgrade}
                isUpgrading={isUpgrading}
                upgradeError={upgradeError}
              />
            ) : isAuthLoading ? (
              <div className="dashboard-loading" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <p className="muted">Opening Dashboard…</p>
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          } />
          <Route path="/privacypolicy" element={<PrivacyPolicyPage />} />
          <Route path="/termsofservice" element={<TermsOfServicePage />} />
          <Route path="/refundcancellation" element={<RefundPolicyPage />} />
          {/* Catch all redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

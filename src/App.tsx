import { useCallback, useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { isSupabaseConfigured, supabase, supabaseConfigError } from './lib/supabaseClient'
import { type DbUser, type DbPlan, SEED_PLANS, getPlanInrPrice, calculateCopilotTopup, calculateAutoApplyTopup } from './lib/database.types'
import { getOrCreateDeviceId } from './lib/deviceTrialLock'
import { HELVIA_DOWNLOAD_LINKS } from './lib/downloadLinks'
import { LandingPage } from './components/LandingPage'
import { Dashboard } from './components/Dashboard'
import { AdminReviewsPanel } from './components/AdminReviewsPanel'
import { Analytics } from '@vercel/analytics/react'
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
      <p>Contact: support@helvia.ai | WhatsApp: <a href="https://wa.me/919032025916" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }}>+91 9032025916</a></p>
    </section>
  )
}

const WHATSAPP_SUPPORT_URL = 'https://wa.me/919032025916?text=Hi%2C%20I%20need%20support%20with%20Helvia%20Remote'

function WhatsAppRedirectPage() {
  useEffect(() => {
    window.location.href = WHATSAPP_SUPPORT_URL
  }, [])

  return (
    <div style={{ padding: '6rem 2rem', textAlign: 'center', color: '#fff', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Redirecting to WhatsApp Support…</h2>
      <p style={{ color: '#94a3b8', maxWidth: 480, margin: '0 auto 1.5rem' }}>
        Opening WhatsApp chat with Helvia Executive Support (+91 9032025916).
      </p>
      <a 
        href={WHATSAPP_SUPPORT_URL}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.75rem 1.75rem',
          backgroundColor: '#25D366',
          color: '#ffffff',
          fontWeight: 700,
          borderRadius: '999px',
          textDecoration: 'none',
          boxShadow: '0 8px 24px rgba(37, 211, 102, 0.35)',
        }}
      >
        <span>Open WhatsApp (+91 9032025916)</span>
      </a>
    </div>
  )
}

function App() {
  const [userId, setUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('helvia_user_id') || null
    } catch {
      return null
    }
  })
  const [sessionEmail, setSessionEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem('helvia_user_email') || null
    } catch {
      return null
    }
  })
  const [displayName, setDisplayName] = useState<string | null>(() => {
    try {
      return localStorage.getItem('helvia_display_name') || null
    } catch {
      return null
    }
  })
  const [userProfile, setUserProfile] = useState<DbUser | null>(() => {
    try {
      const saved = localStorage.getItem('helvia_user_profile')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [plans, setPlans] = useState<DbPlan[]>(SEED_PLANS)
  const [plan, setPlan] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('helvia_user_profile')
      if (saved) {
        const u = JSON.parse(saved)
        return u.plan || 'basic'
      }
    } catch {}
    return 'basic'
  })
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('helvia_user_profile')
      if (saved) {
        const u = JSON.parse(saved)
        return u.plan_expires_at || null
      }
    } catch {}
    return null
  })
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(supabaseConfigError)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  const isSignedIn = Boolean(userId || sessionEmail)

  // Fetch plans from Supabase public.plans (with fallback to SEED_PLANS)
  useEffect(() => {
    const sb = supabase
    if (!isSupabaseConfigured || !sb) return

    const loadPlans = async () => {
      try {
        const { data, error } = await sb.from('plans').select('*').order('price', { ascending: true })
        if (!error && Array.isArray(data) && data.length > 0) {
          // Strictly allow ONLY the 4 official plans: Basic, Standard ($8), Pro+ Pro ($15), 1 Month Unlimited VIP ($21)
          const filtered = data.filter((p: any) => {
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
          const normalized = filtered.map((plan: any) => {
            const n = String(plan.name || '').toLowerCase()
            if (Number(plan.price) === 0 || plan.tier === 'basic' || n.includes('basic')) {
              return { ...plan, price: 0, included_minutes: 5, included_responses: 5, included_applications: 3 }
            }
            if (plan.id === '4d569314-3b27-45c8-93ad-3d5c2eebffc0' || n.includes('standard')) {
              return { ...plan, price: 8, included_minutes: 300, included_responses: 500, included_applications: 200 }
            }
            if (plan.id === 'fdbc4259-cdb8-42b8-a0d5-02b8a7392812' || n.includes('pro+')) {
              return { ...plan, price: 15, included_minutes: 1000, included_responses: 1500, included_applications: 600 }
            }
            if (plan.id === 'b1e06fa2-5819-48ce-8d07-28d8cf9c4901' || n.includes('unlimited')) {
              return { ...plan, price: 21, included_minutes: 999999, included_responses: 999999, included_applications: 999999 }
            }
            return plan
          })
          setPlans(normalized as DbPlan[])
        }
      } catch (err) {
        console.warn('Could not fetch plans from Supabase:', err)
      }
    }
    loadPlans()
  }, [])

  // Sync / upsert user record with public.users
  const syncUserWithDatabase = useCallback(async (id: string, email: string | null) => {
    const sb = supabase
    if (!sb || !isSupabaseConfigured || !email) return null

    const normalizedEmail = email.toLowerCase().trim()
    let userRow: DbUser | null = null

    try {
      // 1. Try finding by Email first (case-insensitive - canonical identity)
      const { data: byEmail } = await sb.from('users').select('*').ilike('email', normalizedEmail).maybeSingle()
      if (byEmail) {
        userRow = byEmail as DbUser
      }

      // 2. Try finding by ID if not found by Email
      if (!userRow && id) {
        const { data: byId } = await sb.from('users').select('*').eq('id', id).maybeSingle()
        if (byId) {
          userRow = byId as DbUser
        }
      }

      // 3. If found by either ID or Email, check expiration & update login_verifier
      if (userRow) {
        let isExpired = false
        let expiryDateStr = userRow.plan_expires_at || null

        // Check if user has unlimited quotas but plan_expires_at was not yet saved on the row
        if (!expiryDateStr && (
          (userRow.responses_remaining != null && userRow.responses_remaining >= 900000) ||
          (userRow.seconds_remaining != null && userRow.seconds_remaining >= 50000000)
        )) {
          try {
            const { data: payRows } = await sb
              .from('processed_payments')
              .select('created_at')
              .eq('user_id', userRow.id)
              .order('created_at', { ascending: false })
              .limit(1)

            if (payRows && payRows.length > 0 && payRows[0].created_at) {
              const paidTime = new Date(payRows[0].created_at).getTime()
              const expiryTime = paidTime + (30 * 24 * 60 * 60 * 1000)
              expiryDateStr = new Date(expiryTime).toISOString()
            }
          } catch {
            // Ignore
          }
        }

        if (expiryDateStr) {
          if (new Date(expiryDateStr).getTime() <= Date.now()) {
            isExpired = true
          }
        }

        if (isExpired) {
          // 1 Month has passed! Automatically downgrade back to basic with NO tokens
          try {
            await sb
              .from('users')
              .update({
                plan: 'basic',
                seconds_remaining: 0,
                responses_remaining: 0,
                applications_remaining: 0,
                plan_expires_at: null,
                login_verifier: false,
                updated_at: new Date().toISOString(),
              })
              .eq('id', userRow.id)
          } catch {
            try {
              await sb
                .from('users')
                .update({
                  plan: 'basic',
                  seconds_remaining: 0,
                  responses_remaining: 0,
                  applications_remaining: 0,
                  login_verifier: false,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', userRow.id)
            } catch (err) {
              console.warn('Downgrade error:', err)
            }
          }

          userRow = {
            ...userRow,
            plan: 'basic',
            seconds_remaining: 0,
            responses_remaining: 0,
            applications_remaining: 0,
            plan_expires_at: null,
            login_verifier: false,
          }
          setPlanExpiresAt(null)
          setPlan('basic')
        } else {
          setPlanExpiresAt(expiryDateStr)
          
          // Auto-award starter trial quotas to new/fresh basic users who haven't used any tokens yet
          const needsStarterQuotas = 
            userRow.plan === 'basic' &&
            !userRow.plan_expires_at &&
            (Number(userRow.seconds_used) || 0) === 0 &&
            (Number(userRow.responses_used) || 0) === 0 &&
            (Number(userRow.applications_applied) || 0) === 0 &&
            (
              ((Number(userRow.seconds_remaining) || 0) === 0 && (Number(userRow.responses_remaining) || 0) === 0) ||
              (Number(userRow.applications_remaining) || 0) === 10
            )

          const shouldFixLoginVerifier = userRow.login_verifier === true

          if (needsStarterQuotas) {
            const starterSeconds = 300
            const starterResponses = 5
            const starterApps = 3

            userRow = {
              ...userRow,
              seconds_remaining: starterSeconds,
              responses_remaining: starterResponses,
              applications_remaining: starterApps,
              verifier: false,
              login_verifier: false,
            }

            // Sync with Worker using Service Role Key to guarantee persistence in Supabase bypassing RLS
            try {
              const apiBase =
                import.meta.env.VITE_API_BASE_URL || 'https://red-glade-5c0e.nagineniyashwanth90.workers.dev'
              const deviceId = getOrCreateDeviceId()
              fetch(
                `${apiBase}/get-profile?email=${encodeURIComponent(normalizedEmail)}&userId=${encodeURIComponent(id)}&deviceId=${encodeURIComponent(deviceId)}&fresh=true`
              ).catch(() => {})
            } catch (_) {}
          } else if (shouldFixLoginVerifier) {
            try {
              await sb
                .from('users')
                .update({
                  login_verifier: false,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', userRow.id)

              userRow = {
                ...userRow,
                login_verifier: false,
              }
            } catch (e) {
              console.warn('Non-fatal login_verifier fix error:', e)
            }
          }
        }
        return userRow
      }

      // 4. Worker fallback with Service Role Key (vital if direct anon query choked)
      if (!userRow) {
        try {
          const apiBase =
            import.meta.env.VITE_API_BASE_URL || 'https://red-glade-5c0e.nagineniyashwanth90.workers.dev'
          const deviceId = getOrCreateDeviceId()
          const res = await fetch(
            `${apiBase}/get-profile?email=${encodeURIComponent(normalizedEmail)}&userId=${encodeURIComponent(id)}&deviceId=${encodeURIComponent(deviceId)}&fresh=true`
          )
          if (res.ok) {
            const json = (await res.json()) as { ok?: boolean; profile?: DbUser }
            if (json?.profile) {
              userRow = json.profile
            }
          }
        } catch (workerErr) {
          console.warn('Worker get-profile fallback error:', workerErr)
        }
      }

      // 5. Only if user does NOT exist anywhere in database: insert new record with starter trial tokens
      if (!userRow) {
        const starterSeconds = 300 // 5 minutes free trial
        const starterResponses = 5 // 5 free AI answers
        const starterApps = 3      // 3 free job auto-applies

        const newRecord: Partial<DbUser> = {
          id,
          email: normalizedEmail,
          plan: 'basic',
          verifier: false,
          login_verifier: false,
          session_verifier: false,
          responses_remaining: starterResponses,
          responses_used: 0,
          seconds_remaining: starterSeconds,
          seconds_used: 0,
          applications_remaining: starterApps,
          applications_applied: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        try {
          // Double-check by email ilike before insert to never overwrite
          const { data: existing } = await sb.from('users').select('*').ilike('email', normalizedEmail).maybeSingle()
          if (existing) {
            userRow = existing as DbUser
          } else {
            const { data: created } = await sb
              .from('users')
              .insert(newRecord)
              .select('*')
              .maybeSingle()

            if (created) {
              userRow = created as DbUser
            }
          }
        } catch (e) {
          const { data: existing } = await sb.from('users').select('*').ilike('email', normalizedEmail).maybeSingle()
          if (existing) {
            userRow = existing as DbUser
          }
        }

        // 6. Guarantee a non-null userRow so login NEVER hangs
        if (!userRow) {
          userRow = {
            id,
            email: normalizedEmail,
            plan: 'basic',
            verifier: false,
            login_verifier: false,
            session_verifier: false,
            responses_remaining: starterResponses,
            responses_used: 0,
            seconds_remaining: starterSeconds,
            seconds_used: 0,
            applications_remaining: starterApps,
            applications_applied: 0,
          }
        }
      }

      return userRow
    } catch (err) {
      console.error('Error syncing user record:', err)
      return {
        id,
        email: normalizedEmail,
        plan: 'basic',
        verifier: false,
        login_verifier: false,
        session_verifier: false,
        responses_remaining: 5,
        responses_used: 0,
        seconds_remaining: 300,
        seconds_used: 0,
        applications_remaining: 3,
        applications_applied: 0,
      } as DbUser
    }
  }, [])

  // Initialize session
  useEffect(() => {
    // 0. Check for OAuth error in URL query or hash
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const hashClean = window.location.hash.replace(/^#/, '')
      const hashParams = new URLSearchParams(hashClean)
      const err =
        searchParams.get('error_description') ||
        hashParams.get('error_description') ||
        searchParams.get('error') ||
        hashParams.get('error')

      if (err) {
        const decoded = decodeURIComponent(err).replace(/\+/g, ' ')
        console.error('Supabase OAuth error:', decoded)
        setAuthError(decoded)
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }

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
          console.warn('Session check notice:', error.message)
          // If error occurs, do NOT aggressively wipe local storage if cached session exists
          const cachedEmail = localStorage.getItem('helvia_user_email')
          const cachedId = localStorage.getItem('helvia_user_id')
          if (!cachedEmail && !cachedId) {
            setUserId(null)
            setSessionEmail(null)
            setDisplayName(null)
            setUserProfile(null)
          }
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

        if (session && session.user) {
          const email = session.user.email ?? null
          const name =
            (session.user.user_metadata?.full_name as string | undefined) ??
            (session.user.user_metadata?.name as string | undefined) ??
            null
          const id = session.user.id

          setUserId(id)
          setSessionEmail(email)
          setDisplayName(name)

          const userRow = await syncUserWithDatabase(id, email)
          if (userRow) {
            setUserProfile(userRow)
            setPlan(userRow.plan || 'basic')
            if (userRow.plan_expires_at) {
              setPlanExpiresAt(userRow.plan_expires_at)
            }
            try {
              if (userRow.id) localStorage.setItem('helvia_user_id', userRow.id)
              if (email) localStorage.setItem('helvia_user_email', email)
              if (name) localStorage.setItem('helvia_display_name', name)
              localStorage.setItem('helvia_user_profile', JSON.stringify(userRow))
            } catch (_) {}
          }

          // Move existing or newly signed-in user to dashboard if on root
          const currentPath = window.location.pathname || location.pathname
          if (currentPath === '/' || currentPath === '') {
            navigate('/dashboard', { replace: true })
          }
        } else {
          // If Supabase session is null, verify and sync using cached credentials from localStorage
          const cachedEmail = localStorage.getItem('helvia_user_email')
          const cachedId = localStorage.getItem('helvia_user_id')
          if (cachedEmail || cachedId) {
            if (cachedId) setUserId(cachedId)
            if (cachedEmail) setSessionEmail(cachedEmail)
            const userRow = await syncUserWithDatabase(cachedId || '', cachedEmail)
            if (userRow) {
              setUserProfile(userRow)
              setPlan(userRow.plan || 'basic')
              if (userRow.plan_expires_at) {
                setPlanExpiresAt(userRow.plan_expires_at)
              }
              try {
                if (userRow.id) localStorage.setItem('helvia_user_id', userRow.id)
                if (cachedEmail) localStorage.setItem('helvia_user_email', cachedEmail)
                localStorage.setItem('helvia_user_profile', JSON.stringify(userRow))
              } catch (_) {}
            }
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
      // ONLY update state when there is a real session or explicit signed out event.
      // Never wipe state to null on INITIAL_SESSION when session is pending.
      if (session?.user) {
        const email = session.user.email ?? null
        const name =
          (session.user.user_metadata?.full_name as string | undefined) ??
          (session.user.user_metadata?.name as string | undefined) ??
          null
        const id = session.user.id
        
        setUserId(id)
        setSessionEmail(email)
        setDisplayName(name)

        const userRow = await syncUserWithDatabase(id, email)
        if (userRow) {
          setUserProfile(userRow)
          setPlan(userRow.plan || 'basic')
          if (userRow.plan_expires_at) {
            setPlanExpiresAt(userRow.plan_expires_at)
          }
          try {
            if (userRow.id) localStorage.setItem('helvia_user_id', userRow.id)
            if (email) localStorage.setItem('helvia_user_email', email)
            if (name) localStorage.setItem('helvia_display_name', name)
            localStorage.setItem('helvia_user_profile', JSON.stringify(userRow))
          } catch (_) {}
        }
        
        // Auto-navigate to dashboard on sign-in event
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
            navigate(postAuthRedirect, { replace: true })
          } else {
            const currentPath = window.location.pathname
            if (currentPath === '/' || currentPath === '') {
              navigate('/dashboard', { replace: true })
            }
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUserId(null)
        setSessionEmail(null)
        setDisplayName(null)
        setPlan('basic')
        setPlanExpiresAt(null)
        setUserProfile(null)
        try {
          localStorage.removeItem('helvia_user_id')
          localStorage.removeItem('helvia_user_email')
          localStorage.removeItem('helvia_display_name')
          localStorage.removeItem('helvia_user_profile')
        } catch (_) {}
        navigate('/')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [navigate, syncUserWithDatabase])

  const refreshProfile = useCallback(async (overrideProfile?: DbUser) => {
    if (overrideProfile) {
      setUserProfile(overrideProfile)
      setPlan(overrideProfile.plan || 'basic')
      if (overrideProfile.plan_expires_at) {
        setPlanExpiresAt(overrideProfile.plan_expires_at)
      }
      try {
        if (overrideProfile.id) localStorage.setItem('helvia_user_id', overrideProfile.id)
        if (overrideProfile.email) localStorage.setItem('helvia_user_email', overrideProfile.email)
        localStorage.setItem('helvia_user_profile', JSON.stringify(overrideProfile))
      } catch (_) {}
      return
    }

    const activeId = userId || localStorage.getItem('helvia_user_id')
    const activeEmail = sessionEmail || localStorage.getItem('helvia_user_email')
    if (activeId || activeEmail) {
      const updated = await syncUserWithDatabase(activeId || '', activeEmail)
      if (updated) {
        setUserProfile(updated)
        setPlan(updated.plan || 'basic')
        if (updated.plan_expires_at) {
          setPlanExpiresAt(updated.plan_expires_at)
        }
        try {
          if (updated.id) localStorage.setItem('helvia_user_id', updated.id)
          if (activeEmail || updated.email) localStorage.setItem('helvia_user_email', activeEmail || updated.email || '')
          localStorage.setItem('helvia_user_profile', JSON.stringify(updated))
        } catch (_) {}
      }
    }
  }, [userId, sessionEmail, syncUserWithDatabase])

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null)
    const sb = supabase
    if (!isSupabaseConfigured || !sb) {
      setAuthError('Supabase is not configured yet')
      return
    }

    // If session already exists, navigate to dashboard immediately
    try {
      const {
        data: { session },
      } = await sb.auth.getSession()
      if (session) {
        navigate('/dashboard', { replace: true })
        return
      }
    } catch {
      // Continue to OAuth
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
    const redirectTo = `${origin}/dashboard`

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
  }, [navigate])

  const signOut = useCallback(async () => {
    setAuthError(null)
    setUpgradeError(null)

    // 1. Force clear all Supabase auth tokens from localStorage and sessionStorage
    try {
      if (typeof window !== 'undefined') {
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k && (k.startsWith('sb-') || k.includes('supabase') || k.includes('auth') || k.includes('helvia_trial') || k.includes('helvia_device'))) {
            keysToRemove.push(k)
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k))
        localStorage.removeItem('helvia_trial_claimed_v1')
        localStorage.removeItem('helvia_user_id')
        localStorage.removeItem('helvia_user_email')
        localStorage.removeItem('helvia_display_name')
        localStorage.removeItem('helvia_user_profile')
        sessionStorage.clear()
      }
    } catch {
      // Ignore storage errors
    }

    // 2. Call Supabase signOut
    const sb = supabase
    if (sb) {
      try {
        if (userId) {
          await sb.from('users').update({
            login_verifier: false,
            updated_at: new Date().toISOString()
          }).eq('id', userId)
        }
        await sb.auth.signOut({ scope: 'local' })
      } catch (err) {
        console.error('Supabase sign-out threw', err)
      }
    }

    // 3. Clear local state
    setUserId(null)
    setSessionEmail(null)
    setDisplayName(null)
    setUserProfile(null)
    setPlan('basic')
    setPlanExpiresAt(null)

    // 4. Force clean reload to home page
    if (typeof window !== 'undefined') {
      window.location.replace('/')
    } else {
      navigate('/', { replace: true })
    }
  }, [navigate, userId])

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

  const startUpgrade = useCallback(async (
    planInput: DbPlan | '24h' | 'month',
    couponCode?: string,
    customAmountInr?: number
  ) => {
    setUpgradeError(null)
    if (!userId || !sessionEmail) {
      setUpgradeError('You must be signed in to upgrade')
      return
    }

    const effectiveExpiry = planExpiresAt || userProfile?.plan_expires_at || null
    const hasActiveExpiry = Boolean(effectiveExpiry && new Date(effectiveExpiry).getTime() > Date.now())
    if (hasActiveExpiry) {
      const expStr = new Date(effectiveExpiry!).toLocaleDateString()
      setUpgradeError(`You currently have an active Unlimited VIP Plan (expires ${expStr}). You cannot purchase any another plan while your unlimited plan is active.`)
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
      const apiBase =
        import.meta.env.VITE_API_BASE_URL || 'https://red-glade-5c0e.nagineniyashwanth90.workers.dev'
      
      const isPlanObj = typeof planInput === 'object' && planInput !== null
      const planId = isPlanObj ? planInput.id : undefined
      const tier = isPlanObj ? planInput.tier : (planInput === '24h' ? 'standard' : 'pro_plus')
      const priceUsd = isPlanObj ? Number(planInput.price) : (planInput === '24h' ? 2 : 15)
      const duration = typeof planInput === 'string' ? planInput : undefined

      const expectedInr = customAmountInr || (isPlanObj ? getPlanInrPrice(priceUsd, planInput.name) : (duration === '24h' ? 169 : 1999))

      const orderPayload: Record<string, unknown> = {
        receipt: `helvia_${Date.now()}`,
        planId,
        tier,
        priceUsd,
        duration,
        userId,
        email: sessionEmail,
        couponCode: couponCode || undefined,
        customAmountInr: customAmountInr || undefined,
      }

      let orderId = ''
      let orderAmount = expectedInr * 100
      let orderCurrency = 'INR'
      let keyId = 'rzp_live_SF5P93aBJVjkFB'

      try {
        const response = await fetch(`${apiBase}/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderPayload),
        })

        if (response.ok) {
          const data = await response.json()
          if (data?.orderId) orderId = data.orderId
          if (data?.keyId) keyId = data.keyId
          if (data?.amount) orderAmount = data.amount
          if (data?.currency) orderCurrency = data.currency
        }
      } catch (e) {
        console.warn('Backend order call failed, continuing with direct checkout:', e)
      }

      const planTitle = isPlanObj ? planInput.name : 'Helvia Remote Pro'

      const options = {
        key: keyId,
        amount: orderAmount,
        currency: orderCurrency,
        name: 'Helvia Remote Control',
        description: `Upgrade to ${planTitle}${couponCode ? ` (Coupon: ${couponCode})` : ''}`,
        ...(orderId ? { order_id: orderId } : {}),
        handler: async (response: { razorpay_order_id?: string; razorpay_payment_id: string; razorpay_signature?: string }) => {
          try {
            let verifiedProfile: DbUser | null = null

            // 1. Backend verification with automatic quota crediting
            try {
              const verifyRes = await fetch(`${apiBase}/verify-payment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  orderId: response.razorpay_order_id || orderId,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  userId,
                  planId,
                  plan: tier,
                  email: sessionEmail,
                  couponCode: couponCode || undefined,
                }),
              })
              if (verifyRes.ok) {
                const data = await verifyRes.json()
                if (data?.profile) {
                  verifiedProfile = data.profile as DbUser
                }
              }
            } catch (vErr) {
              console.warn('Backend verify payment call error:', vErr)
            }

            // 2. Direct Supabase Activation Fallback (if backend did not return updated profile)
            if (!verifiedProfile) {
              const sb = supabase
              if (sb && (userId || sessionEmail)) {
                let targetUserRow: DbUser | null = null
                if (userId) {
                  const { data } = await sb.from('users').select('*').eq('id', userId).maybeSingle()
                  if (data) targetUserRow = data as DbUser
                }
                if (!targetUserRow && sessionEmail) {
                  const { data } = await sb.from('users').select('*').eq('email', sessionEmail.toLowerCase().trim()).maybeSingle()
                  if (data) targetUserRow = data as DbUser
                }

                if (targetUserRow) {
                  const isUnlimited = 
                    planId === 'b1e06fa2-5819-48ce-8d07-28d8cf9c4901' || 
                    (isPlanObj && planInput.name.toLowerCase().includes('unlimited'))

                  let incMinutes = 300
                  let incResponses = 500
                  let incApps = 200

                  if (isUnlimited) {
                    incMinutes = 999999
                    incResponses = 999999
                    incApps = 999999
                  } else if (isPlanObj) {
                    if (planInput.included_minutes) incMinutes = Number(planInput.included_minutes)
                    if (planInput.included_responses) incResponses = Number(planInput.included_responses)
                    if (planInput.included_applications) incApps = Number(planInput.included_applications)
                  }

                  const expiresAt = isUnlimited 
                    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    : null

                  const existingSec = Number(targetUserRow.seconds_remaining) || 0
                  const existingResp = Number(targetUserRow.responses_remaining) || 0
                  const existingApps = Number(targetUserRow.applications_remaining) || 0

                  const updatePayload = {
                    plan: 'usage',
                    seconds_remaining: isUnlimited ? (999999 * 60) : (existingSec + (incMinutes * 60)),
                    responses_remaining: isUnlimited ? 999999 : (existingResp + incResponses),
                    applications_remaining: isUnlimited ? 999999 : (existingApps + incApps),
                    verifier: true,
                    login_verifier: false,
                    plan_expires_at: expiresAt || targetUserRow.plan_expires_at || null,
                    updated_at: new Date().toISOString(),
                  }

                  const { data: updated } = await sb.from('users').update(updatePayload).eq('id', targetUserRow.id).select('*').maybeSingle()
                  if (updated) {
                    verifiedProfile = updated as DbUser
                  }
                }
              }
            }

            // Record payment in processed_payments
            if (supabase && (userId || sessionEmail)) {
              try {
                await supabase.from('processed_payments').insert({
                  payment_id: response.razorpay_payment_id,
                  gateway: 'razorpay',
                  user_id: String(verifiedProfile?.id || userId),
                  amount: orderAmount ? (orderAmount / 100) : expectedInr,
                  created_at: new Date().toISOString(),
                })
              } catch {
                // Ignore duplicate
              }
            }

            if (verifiedProfile) {
              setUserProfile(verifiedProfile)
              setPlan(verifiedProfile.plan || 'usage')
              if (verifiedProfile.plan_expires_at) {
                setPlanExpiresAt(verifiedProfile.plan_expires_at)
              }
            } else if (userId && sessionEmail) {
              const updated = await syncUserWithDatabase(userId, sessionEmail)
              if (updated) {
                setUserProfile(updated)
                setPlan(updated.plan || 'usage')
              }
            }

            setIsUpgrading(false)
            navigate('/dashboard?payment=success', { replace: true })
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
        setUpgradeError('Payment was not completed. Please try again.')
      })
      razorpay.open()
    } catch (err) {
      console.error('Upgrade exception', err)
      setIsUpgrading(false)
      setUpgradeError('Something went wrong while creating payment')
    }
  }, [displayName, loadRazorpay, navigate, sessionEmail, syncUserWithDatabase, userId, userProfile, planExpiresAt])

  const startTopup = useCallback(async (
    topupType: 'copilot' | 'autoapply',
    units: number
  ) => {
    setUpgradeError(null)
    if (!userId || !sessionEmail) {
      setUpgradeError('You must be signed in to purchase a top-up')
      return
    }

    const effectiveExpiry = planExpiresAt || userProfile?.plan_expires_at || null
    const hasActiveExpiry = Boolean(effectiveExpiry && new Date(effectiveExpiry).getTime() > Date.now())
    if (hasActiveExpiry) {
      const expStr = new Date(effectiveExpiry!).toLocaleDateString()
      setUpgradeError(`You currently have an active Unlimited VIP Plan (expires ${expStr}). All quotas are already unlimited, so top-ups are not needed.`)
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
      const apiBase =
        import.meta.env.VITE_API_BASE_URL || 'https://red-glade-5c0e.nagineniyashwanth90.workers.dev'

      const quote = topupType === 'copilot' ? calculateCopilotTopup(units) : calculateAutoApplyTopup(units)
      const expectedInr = quote.priceInr

      const orderPayload: Record<string, unknown> = {
        receipt: `topup_${Date.now()}`,
        isTopup: true,
        type: 'topup',
        topupType,
        minutes: topupType === 'copilot' ? units : undefined,
        applications: topupType === 'autoapply' ? units : undefined,
        userId,
        email: sessionEmail,
        amountInr: expectedInr,
      }

      let orderId = ''
      let orderAmount = expectedInr * 100
      let orderCurrency = 'INR'
      let keyId = 'rzp_live_SF5P93aBJVjkFB'

      try {
        const response = await fetch(`${apiBase}/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderPayload),
        })

        if (response.ok) {
          const data = await response.json()
          if (data?.orderId) orderId = data.orderId
          if (data?.keyId) keyId = data.keyId
          if (data?.amount) orderAmount = data.amount
          if (data?.currency) orderCurrency = data.currency
        }
      } catch (e) {
        console.warn('Backend topup order call failed, continuing with direct checkout:', e)
      }

      const topupTitle = topupType === 'copilot'
        ? `${units} Mins AI Meeting Copilot Top-Up`
        : `${units} Jobs Auto-Apply Top-Up`

      const options = {
        key: keyId,
        amount: orderAmount,
        currency: orderCurrency,
        name: 'Helvia Quota Top-Up',
        description: topupTitle,
        ...(orderId ? { order_id: orderId } : {}),
        handler: async (response: { razorpay_order_id?: string; razorpay_payment_id: string; razorpay_signature?: string }) => {
          try {
            let verifiedProfile: DbUser | null = null

            // 1. Backend verification with automatic quota crediting
            try {
              const verifyRes = await fetch(`${apiBase}/verify-payment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  orderId: response.razorpay_order_id || orderId,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  userId,
                  email: sessionEmail,
                }),
              })
              if (verifyRes.ok) {
                const data = await verifyRes.json()
                if (data?.profile) {
                  verifiedProfile = data.profile as DbUser
                }
              }
            } catch (vErr) {
              console.warn('Backend verify topup error:', vErr)
            }

            // 2. Direct Supabase Activation Fallback (if backend did not return updated profile)
            if (!verifiedProfile) {
              const sb = supabase
              if (sb && (userId || sessionEmail)) {
                let targetUserRow: DbUser | null = null
                if (userId) {
                  const { data } = await sb.from('users').select('*').eq('id', userId).maybeSingle()
                  if (data) targetUserRow = data as DbUser
                }
                if (!targetUserRow && sessionEmail) {
                  const { data } = await sb.from('users').select('*').eq('email', sessionEmail.toLowerCase().trim()).maybeSingle()
                  if (data) targetUserRow = data as DbUser
                }

                if (targetUserRow) {
                  const existingSec = Number(targetUserRow.seconds_remaining) || 0
                  const existingResp = Number(targetUserRow.responses_remaining) || 0
                  const existingApps = Number(targetUserRow.applications_remaining) || 0

                  const addSec = topupType === 'copilot' ? (units * 60) : 0
                  const addResp = topupType === 'copilot' ? Math.round(units * 1.8) : 0
                  const addApps = topupType === 'autoapply' ? units : 0

                  const updatePayload = {
                    plan: targetUserRow.plan && targetUserRow.plan !== 'basic' ? targetUserRow.plan : 'usage',
                    seconds_remaining: existingSec + addSec,
                    responses_remaining: existingResp + addResp,
                    applications_remaining: existingApps + addApps,
                    verifier: true,
                    login_verifier: false,
                    updated_at: new Date().toISOString(),
                  }

                  const { data: updated } = await sb.from('users').update(updatePayload).eq('id', targetUserRow.id).select('*').maybeSingle()
                  if (updated) {
                    verifiedProfile = updated as DbUser
                  }
                }
              }
            }

            // Record payment in processed_payments
            if (supabase && (userId || sessionEmail)) {
              try {
                await supabase.from('processed_payments').insert({
                  payment_id: response.razorpay_payment_id,
                  gateway: 'razorpay',
                  user_id: String(verifiedProfile?.id || userId),
                  amount: orderAmount ? (orderAmount / 100) : expectedInr,
                  created_at: new Date().toISOString(),
                })
              } catch {
                // Ignore duplicate
              }
            }

            if (verifiedProfile) {
              setUserProfile(verifiedProfile)
              setPlan(verifiedProfile.plan || 'usage')
              if (verifiedProfile.plan_expires_at) {
                setPlanExpiresAt(verifiedProfile.plan_expires_at)
              }
            } else if (userId && sessionEmail) {
              const updated = await syncUserWithDatabase(userId, sessionEmail)
              if (updated) {
                setUserProfile(updated)
                setPlan(updated.plan || 'usage')
              }
            }

            setIsUpgrading(false)
            navigate('/dashboard?payment=success', { replace: true })
          } catch (err) {
            console.error('Verify payment failed:', err)
            setIsUpgrading(false)
            setUpgradeError('Payment was completed, but verification failed')
          } finally {
            setIsUpgrading(false)
          }
        },
        prefill: {
          name: displayName ?? undefined,
          email: sessionEmail ?? undefined,
        },
        theme: {
          color: '#6366f1',
        },
      }

      const RazorpayCtor = (window as unknown as { Razorpay: new (options: unknown) => { on: (event: string, cb: () => void) => void; open: () => void } }).Razorpay
      const razorpay = new RazorpayCtor(options)
      razorpay.on('payment.failed', () => {
        setIsUpgrading(false)
        setUpgradeError('Payment was not completed. Please try again.')
      })
      razorpay.open()
    } catch (err) {
      console.error('Top-up exception', err)
      setIsUpgrading(false)
      setUpgradeError('Something went wrong while initiating top-up payment')
    }
  }, [displayName, loadRazorpay, navigate, sessionEmail, syncUserWithDatabase, userId, userProfile, planExpiresAt])

  const startDodoUpgrade = useCallback(async (productId?: string, couponCode?: string, planObj?: DbPlan) => {
    setUpgradeError(null)
    if (!userId || !sessionEmail) {
      setUpgradeError('You must be signed in to upgrade')
      return
    }

    const effectiveExpiry = planExpiresAt || userProfile?.plan_expires_at || null
    const hasActiveExpiry = Boolean(effectiveExpiry && new Date(effectiveExpiry).getTime() > Date.now())
    if (hasActiveExpiry) {
      const expStr = new Date(effectiveExpiry!).toLocaleDateString()
      setUpgradeError(`You currently have an active Unlimited VIP Plan (expires ${expStr}). You cannot purchase any another plan while your unlimited plan is active.`)
      return
    }

    setIsUpgrading(true)
    try {
      const apiBase =
        import.meta.env.VITE_API_BASE_URL || 'https://red-glade-5c0e.nagineniyashwanth90.workers.dev'
      const isUnlimited = 
        productId === 'pdt_0Nmfh6M8mQGJT0VvCHDzO' ||
        productId === 'pdt_0NnIQ_unlimited_vip' ||
        planObj?.id === 'b1e06fa2-5819-48ce-8d07-28d8cf9c4901' ||
        Boolean(planObj?.name && planObj.name.toLowerCase().includes('unlimited'))

      const targetProductId = productId || (isUnlimited ? 'pdt_0Nmfh6M8mQGJT0VvCHDzO' : 'pdt_0NnIQ5VyQfhSXYsFLcojZ')
      const response = await fetch(`${apiBase}/create-dodo-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email: sessionEmail,
          name: displayName || sessionEmail.split('@')[0],
          productId: targetProductId,
          dodo_product_id: targetProductId,
          planId: planObj?.id || (isUnlimited ? 'b1e06fa2-5819-48ce-8d07-28d8cf9c4901' : undefined),
          plan: isUnlimited ? 'usage' : (planObj?.tier || 'usage'),
          planTitle: planObj?.name || (isUnlimited ? '1 Month Unlimited VIP' : undefined),
          isUnlimited: isUnlimited ? 'true' : 'false',
          couponCode: couponCode || undefined,
          discount_code: couponCode || undefined,
          returnUrl: `${window.location.origin}/dashboard?payment=success`,
        }),
      })

      if (!response.ok) {
        let details: { message?: string } | null = null
        try {
          details = (await response.json()) as { message?: string }
        } catch {
          details = null
        }
        console.error('Create Dodo checkout failed', response.status, details)
        setIsUpgrading(false)
        setUpgradeError(details?.message ?? 'Unable to initialize Dodo Payments checkout')
        return
      }

      const data = (await response.json()) as { checkoutUrl?: string; payment_link?: string }
      const redirectUrl = data.checkoutUrl || data.payment_link || ''

      if (redirectUrl) {
        window.location.href = redirectUrl
      } else {
        setIsUpgrading(false)
        setUpgradeError('No checkout URL returned from payment gateway')
      }
    } catch (err) {
      console.error('Dodo checkout exception', err)
      setIsUpgrading(false)
      setUpgradeError('Something went wrong while connecting to Dodo Payments')
    }
  }, [displayName, sessionEmail, userId, userProfile, planExpiresAt])

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
            <span className="brand-title">Helvia <span className="brand-highlight">Enterprise</span></span>
            <span className="brand-badge-3in1">PRO</span>
          </div>
        </div>

        {location.pathname === '/' ? (
          <nav className="desktop-nav">
            <a href="#apps" className="nav-item-link">Platforms</a>
            <a href="#practical-remote" className="nav-item-link">Remote PC</a>
            <a href="#meeting-copilot-details" className="nav-item-link">Meeting Copilot</a>
            <a href="#auto-apply-details" className="nav-item-link">Auto Apply</a>
            <a href="#how-to-use" className="nav-item-link">Video Guides</a>
            <a href="#pricing" className="nav-item-link">Pricing</a>
          </nav>
        ) : null}

        <div className="account">
          <a 
            className="download-host-nav-btn" 
            href={HELVIA_DOWNLOAD_LINKS.remote}
            title="Download Helvia Remote Host (.exe v0.2.5)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
            </svg>
            <span>Host v0.2.5</span>
          </a>

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

      {mobileNavOpen ? (
        <div className="mobile-nav-drawer">
          {location.pathname === '/' && (
            <nav className="mobile-nav-links">
              <a href="#apps" onClick={() => setMobileNavOpen(false)}>🚀 Platforms</a>
              <a href="#practical-remote" onClick={() => setMobileNavOpen(false)}>🖥️ Remote PC</a>
              <a href="#meeting-copilot-details" onClick={() => setMobileNavOpen(false)}>🎙️ Meeting Copilot</a>
              <a href="#auto-apply-details" onClick={() => setMobileNavOpen(false)}>📄 Auto Apply</a>
              <a href="#how-to-use" onClick={() => setMobileNavOpen(false)}>🎬 Video Guides</a>
              <a href="#pricing" onClick={() => setMobileNavOpen(false)}>💎 Pricing</a>
            </nav>
          )}
          <div className="mobile-nav-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <a 
              className="secondary mobile-download-link"
              href={HELVIA_DOWNLOAD_LINKS.remote}
              onClick={() => setMobileNavOpen(false)}
            >
              📥 Download Helvia Remote (v0.2.5)
            </a>
            <a 
              className="secondary mobile-download-link"
              href={HELVIA_DOWNLOAD_LINKS.meet}
              onClick={() => setMobileNavOpen(false)}
            >
              🎙️ Download Helvia Meet (.exe)
            </a>
            <a 
              className="secondary mobile-download-link"
              href={HELVIA_DOWNLOAD_LINKS.apply}
              onClick={() => setMobileNavOpen(false)}
            >
              📄 Download Helvia Apply (.exe)
            </a>
            {isSignedIn ? (
              <>
                {location.pathname === '/' && (
                  <button 
                    className="primary nav-cta-btn" 
                    style={{ width: '100%', marginTop: '0.5rem' }} 
                    onClick={() => { setMobileNavOpen(false); navigate('/dashboard'); }}
                  >
                    Dashboard
                  </button>
                )}
                <button 
                  className="ghost-btn nav-cta-btn" 
                  style={{ width: '100%', marginTop: '0.5rem' }} 
                  onClick={() => { setMobileNavOpen(false); signOut(); }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <button 
                className="primary nav-cta-btn" 
                style={{ width: '100%', marginTop: '0.5rem' }} 
                onClick={() => { setMobileNavOpen(false); signInWithGoogle(); }}
                disabled={!isSupabaseConfigured}
              >
                Sign in
              </button>
            )}
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
              isSignedIn ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LandingPage
                  signInWithGoogle={signInWithGoogle}
                  isSupabaseConfigured={isSupabaseConfigured}
                  isAuthLoading={isAuthLoading}
                  plans={plans}
                  startUpgrade={startUpgrade}
                  startTopup={startTopup}
                  startDodoUpgrade={startDodoUpgrade}
                  isSignedIn={isSignedIn}
                  userPlan={plan}
                />
              )
            }
          />
          <Route path="/dashboard" element={
            isAuthLoading && !sessionEmail && !userId ? (
              <div className="dashboard-loading" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <p className="muted">Opening Dashboard…</p>
              </div>
            ) : isSignedIn || sessionEmail ? (
              <Dashboard 
                displayName={displayName}
                sessionEmail={sessionEmail}
                userProfile={userProfile}
                plans={plans}
                plan={plan}
                planExpiresAt={planExpiresAt}
                startUpgrade={startUpgrade}
                startTopup={startTopup}
                startDodoUpgrade={startDodoUpgrade}
                isUpgrading={isUpgrading}
                upgradeError={upgradeError}
                onRefreshProfile={refreshProfile}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } />
          <Route path="/privacypolicy" element={<PrivacyPolicyPage />} />
          <Route path="/termsofservice" element={<TermsOfServicePage />} />
          <Route path="/refundcancellation" element={<RefundPolicyPage />} />
          <Route path="/support" element={<WhatsAppRedirectPage />} />
          <Route path="/whatsapp" element={<WhatsAppRedirectPage />} />
          <Route path="/admin/reviews" element={<AdminReviewsPanel />} />
          <Route path="/reviews" element={<AdminReviewsPanel />} />
          {/* Catch all redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Floating 24/7 WhatsApp Support Pill */}
      <a
        href={WHATSAPP_SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-whatsapp-btn"
        aria-label="WhatsApp Support (+91 9032025916)"
        title="WhatsApp Support: +91 9032025916"
      >
        <span className="wa-icon-bubble">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2Z" fill="#25D366"/>
            <path d="M17.52 14.33C17.22 14.18 15.75 13.45 15.47 13.35C15.2 13.25 15 13.2 14.81 13.5C14.61 13.8 14.04 14.47 13.86 14.67C13.69 14.87 13.51 14.9 13.21 14.75C12.91 14.6 11.96 14.29 10.83 13.28C9.95 12.49 9.35 11.52 9.18 11.22C9.01 10.92 9.16 10.76 9.31 10.61C9.45 10.48 9.61 10.26 9.76 10.09C9.91 9.92 9.96 9.79 10.06 9.59C10.16 9.39 10.11 9.22 10.04 9.07C9.96 8.92 9.39 7.52 9.15 6.94C8.92 6.38 8.68 6.45 8.5 6.44C8.33 6.43 8.13 6.43 7.94 6.43C7.74 6.43 7.42 6.5 7.15 6.8C6.88 7.1 6.12 7.81 6.12 9.26C6.12 10.71 7.18 12.11 7.32 12.31C7.47 12.51 9.4 15.48 12.35 16.76C13.06 17.06 13.61 17.25 14.04 17.38C14.74 17.61 15.38 17.57 15.89 17.5C16.45 17.41 17.62 16.79 17.86 16.11C18.11 15.43 18.11 14.86 18.03 14.73C17.96 14.61 17.82 14.48 17.52 14.33Z" fill="white"/>
          </svg>
        </span>
        <span className="wa-text-label">Support</span>
      </a>

      {/* Vercel Web Analytics for Visitor Tracking */}
      <Analytics />
    </div>
  )
}

export default App

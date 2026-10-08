import { useCallback, useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { isSupabaseConfigured, supabase, supabaseConfigError } from './lib/supabaseClient'
import { type DbUser, type DbPlan, SEED_PLANS } from './lib/database.types'
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
  const [userProfile, setUserProfile] = useState<DbUser | null>(null)
  const [plans, setPlans] = useState<DbPlan[]>(SEED_PLANS)
  const [plan, setPlan] = useState<string>('basic')
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(supabaseConfigError)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  const isSignedIn = Boolean(userId)

  // Fetch plans from Supabase public.plans (with fallback to SEED_PLANS)
  useEffect(() => {
    const sb = supabase
    if (!isSupabaseConfigured || !sb) return

    const loadPlans = async () => {
      try {
        const { data, error } = await sb.from('plans').select('*').order('price', { ascending: true })
        if (!error && Array.isArray(data) && data.length > 0) {
          const normalized = data.map((plan: any) => {
            if (Number(plan.price) === 0 || plan.tier === 'basic') {
              return { ...plan, included_minutes: 0, included_responses: 0, included_applications: 0 }
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
      // 1. Try finding by ID
      const { data: byId } = await sb.from('users').select('*').eq('id', id).maybeSingle()
      if (byId) {
        userRow = byId as DbUser
      }

      // 2. Try finding by Email if not found by ID
      if (!userRow) {
        const { data: byEmail } = await sb.from('users').select('*').eq('email', normalizedEmail).maybeSingle()
        if (byEmail) {
          userRow = byEmail as DbUser
        }
      }

      // 3. If found by either ID or Email, safely update login_verifier without failing login
      if (userRow) {
        try {
          await sb
            .from('users')
            .update({
              login_verifier: true,
              updated_at: new Date().toISOString(),
            })
            .eq('email', normalizedEmail)
        } catch (e) {
          console.warn('Non-fatal update login_verifier error:', e)
        }
        return userRow
      }

      // 4. Only if user does NOT exist: insert new record
      const newRecord: Partial<DbUser> = {
        id,
        email: normalizedEmail,
        plan: 'basic',
        verifier: false,
        login_verifier: true,
        session_verifier: false,
        responses_remaining: 0,
        responses_used: 0,
        seconds_remaining: 0,
        seconds_used: 0,
        applications_remaining: 0,
        applications_applied: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      try {
        const { data: created, error: insertErr } = await sb
          .from('users')
          .upsert(newRecord, { onConflict: 'email' })
          .select('*')
          .maybeSingle()

        if (created) {
          userRow = created as DbUser
        } else if (insertErr) {
          // If conflict occurred, fetch existing user row
          const { data: existing } = await sb.from('users').select('*').eq('email', normalizedEmail).maybeSingle()
          if (existing) {
            userRow = existing as DbUser
          }
        }
      } catch (e) {
        const { data: existing } = await sb.from('users').select('*').eq('email', normalizedEmail).maybeSingle()
        if (existing) {
          userRow = existing as DbUser
        }
      }

      // 5. Worker fallback if direct query didn't return
      if (!userRow) {
        const apiBase =
          import.meta.env.VITE_API_BASE_URL || 'https://red-glade-5c0e.nagineniyashwanth90.workers.dev'
        const res = await fetch(
          `${apiBase}/get-profile?email=${encodeURIComponent(normalizedEmail)}&userId=${encodeURIComponent(id)}`
        )
        if (res.ok) {
          const json = (await res.json()) as { ok?: boolean; profile?: DbUser }
          if (json?.profile) {
            userRow = json.profile
          }
        }
      }

      // 6. Guarantee a non-null userRow so login NEVER hangs
      if (!userRow) {
        userRow = {
          id,
          email: normalizedEmail,
          plan: 'basic',
          verifier: false,
          login_verifier: true,
          session_verifier: false,
          responses_remaining: 0,
          responses_used: 0,
          seconds_remaining: 0,
          seconds_used: 0,
          applications_remaining: 0,
          applications_applied: 0,
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
        login_verifier: true,
        session_verifier: false,
        responses_remaining: 0,
        responses_used: 0,
        seconds_remaining: 0,
        seconds_used: 0,
        applications_remaining: 0,
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
          setAuthError(error.message ?? 'Failed to load session')
          setUserId(null)
          setSessionEmail(null)
          setDisplayName(null)
          setUserProfile(null)
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

          const userRow = await syncUserWithDatabase(id, email)
          if (userRow) {
            setUserProfile(userRow)
            setPlan(userRow.plan || 'basic')
          }

          // Move existing or newly signed-in user to dashboard if on root
          const currentPath = window.location.pathname || location.pathname
          if (currentPath === '/' || currentPath === '') {
            navigate('/dashboard', { replace: true })
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

      if (session && id) {
        const userRow = await syncUserWithDatabase(id, email)
        if (userRow) {
          setUserProfile(userRow)
          setPlan(userRow.plan || 'basic')
        }
        
        // Auto-navigate to dashboard on any authentication event
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
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
            const currentPath = window.location.pathname || location.pathname
            if (currentPath === '/' || currentPath === '') {
              navigate('/dashboard', { replace: true })
            }
          }
        }
      } else {
        setPlan('basic')
        setPlanExpiresAt(null)
        setUserProfile(null)
        if (event === 'SIGNED_OUT') {
           navigate('/')
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [navigate, location.pathname, syncUserWithDatabase])

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
          if (k && (k.startsWith('sb-') || k.includes('supabase') || k.includes('auth'))) {
            keysToRemove.push(k)
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k))
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
    _customAmountInr?: number
  ) => {
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
      const apiBase =
        import.meta.env.VITE_API_BASE_URL || 'https://red-glade-5c0e.nagineniyashwanth90.workers.dev'
      
      const isPlanObj = typeof planInput === 'object' && planInput !== null
      const planId = isPlanObj ? planInput.id : undefined
      const tier = isPlanObj ? planInput.tier : (planInput === '24h' ? 'standard' : 'pro_plus')
      const priceUsd = isPlanObj ? Number(planInput.price) : (planInput === '24h' ? 2 : 15)
      const duration = typeof planInput === 'string' ? planInput : undefined

      const orderPayload: Record<string, unknown> = {
        receipt: `helvia_${Date.now()}`,
        planId,
        tier,
        priceUsd,
        duration,
        userId,
        email: sessionEmail,
        couponCode: couponCode || undefined,
      }

      const response = await fetch(`${apiBase}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
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

      const planTitle = isPlanObj ? planInput.name : 'Helvia Remote Pro'

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Helvia Remote Control',
        description: `Upgrade to ${planTitle}${couponCode ? ` (Coupon: ${couponCode})` : ''}`,
        order_id: data.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
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
                planId,
                plan: tier,
                email: sessionEmail,
                couponCode: couponCode || undefined,
              }),
            })

            if (!verifyRes.ok) {
              const err = await verifyRes.json().catch(() => ({}))
              throw new Error(err.message || 'Verification failed')
            }

            setPlan(tier)
            setIsUpgrading(false)
            if (userId && sessionEmail) {
              const updated = await syncUserWithDatabase(userId, sessionEmail)
              if (updated) {
                setUserProfile(updated)
              }
            }
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
  }, [displayName, loadRazorpay, navigate, sessionEmail, syncUserWithDatabase, userId])

  const startTopup = useCallback(async (
    topupType: 'copilot' | 'autoapply',
    units: number
  ) => {
    setUpgradeError(null)
    if (!userId || !sessionEmail) {
      setUpgradeError('You must be signed in to purchase a top-up')
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

      const orderPayload: Record<string, unknown> = {
        receipt: `topup_${Date.now()}`,
        isTopup: true,
        topupType,
        minutes: topupType === 'copilot' ? units : undefined,
        applications: topupType === 'autoapply' ? units : undefined,
        userId,
        email: sessionEmail,
      }

      const response = await fetch(`${apiBase}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      })

      if (!response.ok) {
        let details: { message?: string } | null = null
        try {
          details = (await response.json()) as { message?: string }
        } catch {
          details = null
        }
        console.error('Create top-up order failed', response.status, details)
        setIsUpgrading(false)
        setUpgradeError(details?.message ?? 'Unable to create Razorpay top-up order')
        return
      }

      const data = (await response.json()) as {
        orderId: string
        amount: number
        currency: string
        keyId: string
      }

      const topupTitle = topupType === 'copilot'
        ? `${units} Mins AI Meeting Copilot Top-Up`
        : `${units} Jobs Auto-Apply Top-Up`

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Helvia Quota Top-Up',
        description: topupTitle,
        order_id: data.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
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
                email: sessionEmail,
              }),
            })

            const verifyData = await verifyRes.json()
            if (verifyRes.ok && verifyData.ok) {
              await syncUserWithDatabase(userId, sessionEmail)
              navigate('/dashboard', { replace: true })
            } else {
              setUpgradeError(verifyData?.message || 'Payment verification failed')
            }
          } catch (err) {
            console.error('Verify payment failed:', err)
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
  }, [displayName, loadRazorpay, navigate, sessionEmail, syncUserWithDatabase, userId])

  const startDodoUpgrade = useCallback(async (productId?: string, couponCode?: string) => {
    setUpgradeError(null)
    if (!userId || !sessionEmail) {
      setUpgradeError('You must be signed in to upgrade')
      return
    }

    setIsUpgrading(true)
    try {
      const apiBase =
        import.meta.env.VITE_API_BASE_URL || 'https://red-glade-5c0e.nagineniyashwanth90.workers.dev'
      const targetProductId = productId || 'pdt_0NnIQ5VyQfhSXYsFLcojZ'
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
  }, [displayName, sessionEmail, userId])

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
            <a href="#apps" className="nav-item-link highlight-apps-nav">Platforms</a>
            <a href="#practical-remote" className="nav-item-link">Remote Desktop</a>
            <a href="#meeting-copilot" className="nav-item-link">Executive Copilot</a>
            <a href="#auto-apply" className="nav-item-link">Talent Mobility</a>
            <a href="#features" className="nav-item-link">Architecture & Security</a>
            <a href="#pricing" className="nav-item-link">Pricing</a>
          </nav>
        ) : null}

        <div className="account">
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
              <a href="#apps" onClick={() => setMobileNavOpen(false)}>Enterprise Platforms</a>
              <a href="#practical-remote" onClick={() => setMobileNavOpen(false)}>Zero-Trust Remote Desktop</a>
              <a href="#meeting-copilot" onClick={() => setMobileNavOpen(false)}>Executive Meeting Copilot</a>
              <a href="#auto-apply" onClick={() => setMobileNavOpen(false)}>Talent Mobility &amp; ATS</a>
              <a href="#features" onClick={() => setMobileNavOpen(false)}>Security &amp; Architecture</a>
              <a href="#pricing" onClick={() => setMobileNavOpen(false)}>Enterprise Pricing</a>
            </nav>
          )}
          <div className="mobile-nav-actions">
            <a 
              className="secondary mobile-download-link"
              href="https://pub-4ec430c8cdbd49ffb57191dca016c43b.r2.dev/Helvia%20Remote%20Setup%200.1.0.exe"
              onClick={() => setMobileNavOpen(false)}
            >
              Download Windows Host (.exe)
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
            isSignedIn ? (
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
              />
            ) : isAuthLoading ? (
              <div className="dashboard-loading" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <p className="muted">Opening Dashboard…</p>
              </div>
            ) : (
              <Dashboard 
                displayName={displayName || 'Pro User'}
                sessionEmail={sessionEmail || 'guest@helvia.ai'}
                userProfile={userProfile || {
                  id: 'guest',
                  email: 'guest@helvia.ai',
                  plan: 'basic',
                  verifier: false,
                  login_verifier: true,
                  session_verifier: false,
                  seconds_remaining: 0,
                  seconds_used: 0,
                  responses_remaining: 0,
                  responses_used: 0,
                  applications_remaining: 0,
                  applications_applied: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }}
                plans={plans}
                plan={plan}
                planExpiresAt={planExpiresAt}
                startUpgrade={startUpgrade}
                startTopup={startTopup}
                startDodoUpgrade={startDodoUpgrade}
                isUpgrading={isUpgrading}
                upgradeError={upgradeError}
              />
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

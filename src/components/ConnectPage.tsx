import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

interface ConnectPageProps {
  userId: string | null
  sessionEmail: string | null
  displayName: string | null
  plan: string
  isSignedIn: boolean
  isSupabaseConfigured: boolean
  isAuthLoading: boolean
  signInWithGoogle: () => Promise<void>
}

export const ConnectPage: React.FC<ConnectPageProps> = ({
  userId,
  sessionEmail,
  displayName,
  plan,
  isSignedIn,
  isSupabaseConfigured,
  isAuthLoading,
  signInWithGoogle,
}) => {
  const resolvedApiBase = (() => {
    const configured = import.meta.env.VITE_API_BASE_URL
    if (configured && typeof configured === 'string' && configured.trim()) {
      return configured.replace(/\/+$/, '')
    }

    if (typeof window !== 'undefined' && window.location.hostname) {
      const host = window.location.hostname.toLowerCase()
      if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')) {
        return '/api'
      }
    }

    return 'https://red-glade-5c0e.nagineniyashwanth90.workers.dev'
  })()

  const [searchParams] = useSearchParams()
  let linkToken =
    searchParams.get('t') ??
    searchParams.get('token') ??
    searchParams.get('code') ??
    ''

  if (!linkToken) {
    const firstEntry = Array.from(searchParams.entries())[0]
    if (firstEntry && firstEntry[1]) {
      linkToken = firstEntry[1]
    }
  }

  const [isConnectedToApp, setIsConnectedToApp] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkErrorDetails, setLinkErrorDetails] = useState<string | null>(null)
  const [hasActiveConnection, setHasActiveConnection] = useState(false)

  // Check for existing active connection
  useEffect(() => {
    const sb = supabase
    if (!sb || !userId) {
      return
    }

    const checkConnection = async () => {
      try {
        const { data, error } = await sb.from('users').select('verifier').eq('id', userId).maybeSingle()
        if (!error && data && typeof data.verifier === 'boolean') {
          setHasActiveConnection(data.verifier)
        }
      } catch (err) {
        console.error('Failed to check existing connection', err)
      }
    }

    checkConnection()
  }, [userId])

  const handleConnectToApp = async () => {
    if (!isSignedIn || !linkToken) {
      return
    }

    setLinkError(null)
    setLinkErrorDetails(null)
    setIsLinking(true)

    let effectiveEmail: string | null = sessionEmail
    let effectivePlan: string = plan || 'basic'

    try {
      const sb = supabase
      if (sb && userId) {
        const { data } = await sb.from('users').select('email, plan').eq('id', userId).maybeSingle()

        if (data) {
          const profileEmail = (data.email as string | null | undefined) ?? null
          const profilePlan = (data.plan as string | null | undefined) ?? null

          if (!effectiveEmail && profileEmail) {
            effectiveEmail = profileEmail
          }

          if (profilePlan) {
            effectivePlan = profilePlan
          }
        }
      }

      if (!effectiveEmail) {
        setIsLinking(false)
        setLinkError('Failed to read account email')
        return
      }

      const normalizedEmail = effectiveEmail.trim().toLowerCase()
      if (!normalizedEmail) {
        setIsLinking(false)
        setLinkError('Failed to read account email')
        return
      }

      const localTargets = ['http://localhost:8080/api/link/complete', 'http://127.0.0.1:8080/api/link/complete']

      let response: Response | null = null
      let lastFailureDetails = ''

      const payload = {
        token: linkToken,
        email: normalizedEmail,
        plan: effectivePlan || 'basic',
      }

      let authHeaderValue = `Bearer ${normalizedEmail}`
      try {
        const sb = supabase
        if (sb) {
          const {
            data: { session },
          } = await sb.auth.getSession()
          const accessToken = session?.access_token || ''
          if (accessToken) {
            authHeaderValue = `Bearer ${accessToken}`
          }
        }
      } catch {
        void 0
      }

      for (const target of localTargets) {
        try {
          const localRes = await fetch(target, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: authHeaderValue,
              'X-Helvia-Email': normalizedEmail,
            },
            body: JSON.stringify(payload),
          })
          if (localRes.ok) {
            response = localRes
            break
          }

          let failureText = ''
          try {
            failureText = await localRes.text()
          } catch {
            failureText = ''
          }

          lastFailureDetails = `POST ${target}\nStatus: ${localRes.status}\nResponse: ${failureText || '(empty)'}`
        } catch (err) {
          const msg =
            err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
              ? err.message
              : String(err)
          lastFailureDetails = `POST ${target}\nNetwork error: ${msg}`
          response = null
        }
      }

      if (!response) {
        try {
          const remoteRes = await fetch(`${resolvedApiBase}/link/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: linkToken,
              email: normalizedEmail,
              plan: effectivePlan || 'basic',
              userId,
            }),
          })
          response = remoteRes
        } catch {
          response = null
        }
      }

      if (!response) {
        setIsLinking(false)
        setLinkError('Unable to reach Helvia app on this device')
        setLinkErrorDetails(
          lastFailureDetails ||
            'The browser could not contact http://localhost:8080. Make sure the app is running and allowing web requests.'
        )
        return
      }

      let body: { ok?: boolean; message?: string } | null = null
      let responseText = ''
      try {
        body = (await response.clone().json()) as { ok?: boolean; message?: string } | null
      } catch {
        body = null
      }
      try {
        responseText = await response.text()
      } catch {
        responseText = ''
      }

      if (!response.ok || !body?.ok) {
        const message =
          (body && typeof body.message === 'string' && body.message) ||
          'Failed to connect app. Please try again.'
        console.error('Link complete failed', {
          status: response.status,
          body,
        })
        setIsLinking(false)
        setLinkError(message)
        setLinkErrorDetails(
          `Request: POST ${response.url}\nStatus: ${response.status}\nResponse: ${responseText || '(no json/text body)'}`
        )
        return
      }

      setHasActiveConnection(true)
      setIsConnectedToApp(true)
      setIsLinking(false)
    } catch {
      setIsLinking(false)
      setLinkError('Failed to connect app. Please try again.')
    }
  }

  return isSignedIn ? (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">HEL VIA</p>
        <h1>Continue to Helvia app</h1>
        <p className="subtitle">
          You are signed in as <span className="mono">{sessionEmail ?? displayName ?? 'Helvia user'}</span>. Continue to
          link this desktop session to your account.
        </p>
        {!linkToken ? (
          <p className="muted" style={{ marginTop: '0.5rem', color: '#f97373' }}>
            Invalid or missing link token
          </p>
        ) : null}
        {hasActiveConnection ? (
          <p className="muted" style={{ marginTop: '0.5rem' }}>
            This account is already connected to a Helvia app. Continuing will refresh the connection for this session.
          </p>
        ) : null}
        {linkError ? (
          <>
            <p className="muted" style={{ marginTop: '0.5rem', color: '#f97373' }}>
              {linkError}
            </p>
            {linkErrorDetails ? (
              <pre
                className="muted"
                style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem 0.9rem',
                  background: 'rgba(15, 23, 42, 0.06)',
                  borderRadius: '12px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {linkErrorDetails}
              </pre>
            ) : null}
          </>
        ) : null}
        <div className="cta-row">
          <button
            type="button"
            className="primary"
            onClick={handleConnectToApp}
            disabled={!linkToken || isLinking}
          >
            Continue to app
          </button>
        </div>
        {isConnectedToApp ? (
          <p className="muted" style={{ marginTop: '0.75rem' }}>
            You can return to the desktop app now. It should log in automatically.
          </p>
        ) : null}
      </div>
    </section>
  ) : (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">HEL VIA</p>
        <h1>Sign in to continue</h1>
        <p className="subtitle">Sign in so we can link your Helvia desktop session to your account.</p>
        {!linkToken ? (
          <p className="muted" style={{ marginTop: '0.5rem', color: '#f97373' }}>
            Invalid or missing link token
          </p>
        ) : null}
        {linkError ? (
          <p className="muted" style={{ marginTop: '0.5rem', color: '#f97373' }}>
            {linkError}
          </p>
        ) : null}
        {!isAuthLoading ? (
          <div className="cta-row">
            <button className="primary" onClick={signInWithGoogle} disabled={!isSupabaseConfigured}>
              Sign in with Google
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}

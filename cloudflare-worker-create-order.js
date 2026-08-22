export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    const origin = request.headers.get('Origin') || '*'

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      })
    }

    if (url.pathname === '/') {
      return new Response('OK', {
        status: 200,
        headers: corsHeaders(origin),
      })
    }

    if (url.pathname === '/create-order' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}))

        const durationRaw =
          typeof body.duration === 'string'
            ? body.duration
            : ''
        const duration = durationRaw === '24h' || durationRaw === 'month' ? durationRaw : ''

        if (!duration) {
          return json({ message: 'Invalid duration' }, 400, origin)
        }

        const amount = duration === '24h' ? 169 * 100 : 999 * 100
        const currency = 'INR'
        let receipt = String(body.receipt || `rcpt_${Date.now()}`)

        if (receipt.length > 40) {
          receipt = receipt.slice(0, 40)
        }

        const keyId = env.RAZORPAY_KEY_ID
        const keySecret = env.RAZORPAY_KEY_SECRET

        if (!keyId || !keySecret) {
          return json({ message: 'Razorpay is not configured' }, 500, origin)
        }

        const authToken = btoa(`${keyId}:${keySecret}`)

        const razorRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${authToken}`,
          },
          body: JSON.stringify({
            amount,
            currency,
            receipt,
            notes: {
              project: 'helvia-remote',
            },
          }),
        })

        if (!razorRes.ok) {
          let error
          try {
            error = await razorRes.json()
          } catch {
            error = null
          }
          const message =
            error?.error?.description ||
            error?.error?.reason ||
            'Failed to create order'
          return json({ message }, 500, origin)
        }

        const order = await razorRes.json()

        return json(
          {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId,
          },
          200,
          origin
        )
      } catch (e) {
        let message = 'Failed to create order'
        if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
          message = e.message
        }
        return json({ message }, 500, origin)
      }
    }

    if ((url.pathname === '/link-complete' || url.pathname === '/link/complete') && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}))

        const tokenRaw =
          typeof body.token === 'string'
            ? body.token
            : typeof body.code === 'string'
              ? body.code
              : ''
        const token = tokenRaw.trim()
        const email = typeof body.email === 'string' ? body.email : ''
        const normalizedEmail = email.trim().toLowerCase()

        if (!token || !normalizedEmail) {
          return json({ ok: false, message: 'Missing token or email' }, 400, origin)
        }

        if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
          return json({ ok: false, message: 'Supabase is not configured' }, 500, origin)
        }

        const supabaseBase = env.SUPABASE_URL.replace(/\/+$/, '')
        const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

        try {
          const profileUrl = `${supabaseBase}/rest/v1/profiles?select=verifier&email=eq.${encodeURIComponent(
            normalizedEmail
          )}`

          const profileRes = await fetch(profileUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
            },
          })

          if (profileRes.ok) {
            let rows = null
            try {
              rows = await profileRes.json()
            } catch {
              rows = null
            }
            const row = Array.isArray(rows) ? rows[0] : null
            const verifier =
              row && typeof row === 'object' && 'verifier' in row && typeof row.verifier === 'boolean'
                ? row.verifier
                : false

            if (verifier) {
              return json(
                {
                  ok: false,
                  message: 'This account is already connected to a device',
                },
                200,
                origin
              )
            }
          }
        } catch {
        }

        const upsertUrl = `${supabaseBase}/rest/v1/link_codes?on_conflict=code`
        const upsertRes = await fetch(upsertUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            Prefer: 'resolution=merge-duplicates,return=minimal',
          },
          body: JSON.stringify({
            code: token,
            email: normalizedEmail,
            created_at: new Date().toISOString(),
          }),
        })

        if (!upsertRes.ok) {
          let detail = null
          try {
            detail = await upsertRes.text()
          } catch {
            detail = null
          }
          return json(
            {
              ok: false,
              message: 'Failed to save link code',
              status: upsertRes.status,
              detail,
            },
            200,
            origin
          )
        }

        return json({ ok: true }, 200, origin)
      } catch (e) {
        let message = 'Failed to complete link'
        if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
          message = e.message
        }
        return json({ ok: false, message }, 500, origin)
      }
    }

    if (
      (url.pathname === '/link/status' || url.pathname === '/link-status') &&
      (request.method === 'GET' || request.method === 'POST')
    ) {
      try {
        let token = url.searchParams.get('token') || url.searchParams.get('t') || ''
        if (!token && request.method === 'POST') {
          const body = await request.json().catch(() => ({}))
          token = typeof body.token === 'string' ? body.token : typeof body.t === 'string' ? body.t : ''
        }
        token = token.trim()
        if (!token) {
          return json({ ok: false, message: 'Missing token' }, 400, origin)
        }

        if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
          return json({ ok: true, linked: false }, 200, origin)
        }

        const supabaseBase = env.SUPABASE_URL.replace(/\/+$/, '')
        const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

        const readCodeUrl = `${supabaseBase}/rest/v1/link_codes?select=email&code=eq.${encodeURIComponent(token)}`
        const codeRes = await fetch(readCodeUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        })

        let rows = null
        try {
          rows = await codeRes.json()
        } catch {
          rows = null
        }

        const row = Array.isArray(rows) ? rows[0] : null
        const email =
          row && typeof row === 'object' && 'email' in row && typeof row.email === 'string' ? row.email.trim().toLowerCase() : ''

        if (!email) {
          return json({ ok: true, linked: false }, 200, origin)
        }

        let plan = 'basic'
        try {
          const profileUrl = `${supabaseBase}/rest/v1/profiles?select=plan&email=eq.${encodeURIComponent(email)}`
          const profileRes = await fetch(profileUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
            },
          })

          let profileRows = null
          try {
            profileRows = await profileRes.json()
          } catch {
            profileRows = null
          }
          const profileRow = Array.isArray(profileRows) ? profileRows[0] : null
          const planValue =
            profileRow && typeof profileRow === 'object' && 'plan' in profileRow && typeof profileRow.plan === 'string'
              ? profileRow.plan
              : ''
          if (planValue) {
            plan = planValue
          }
        } catch {
        }

        return json({ ok: true, linked: true, email, plan }, 200, origin)
      } catch (e) {
        return json({ ok: true, linked: false }, 200, origin)
      }
    }

    if (url.pathname === '/link/request-code' && request.method === 'POST') {
      return json({ ok: false, error: 'deprecated' }, 410, origin)
    }

    if (url.pathname === '/link/complete-code' && request.method === 'POST') {
      return json({ ok: false, error: 'deprecated' }, 410, origin)
    }

    if (url.pathname === '/link/logout' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}))
        const emailRaw = typeof body.email === 'string' ? body.email : ''
        const email = emailRaw.toLowerCase().trim()

        if (!email) {
          return json({ ok: false, error: 'missing-email' }, 400, origin)
        }

        const supabaseUrl = env.SUPABASE_URL
        const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !serviceKey) {
          return json({ ok: false, error: 'supabase-not-configured' }, 500, origin)
        }

        const profilesUrl = `${supabaseUrl.replace(
          /\/+$/,
          ''
        )}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}`

        const res = await fetch(profilesUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            verifier: false,
            updated_at: new Date().toISOString(),
          }),
        })

        if (!res.ok) {
          let detail = null
          try {
            detail = await res.text()
          } catch {
            detail = null
          }
          return json(
            {
              ok: false,
              error: 'failed-to-logout',
              detail,
            },
            500,
            origin
          )
        }

        return json({ ok: true }, 200, origin)
      } catch (e) {
        let message = 'Failed to logout'
        if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
          message = e.message
        }
        return json({ ok: false, error: 'logout-failed', message }, 500, origin)
      }
    }

    if (url.pathname === '/verify-payment' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}))
        const { orderId, paymentId, signature, userId, plan, expiresAt } = body

        if (!orderId || !paymentId || !signature || !userId || !plan) {
          return json({ message: 'Missing required fields' }, 400, origin)
        }

        const keySecret = env.RAZORPAY_KEY_SECRET
        if (!keySecret) {
          return json({ message: 'Razorpay secret not configured' }, 500, origin)
        }

        const generatedSignature = await generateSignature(keySecret, orderId, paymentId)
        if (generatedSignature !== signature) {
          return json({ message: 'Invalid signature' }, 400, origin)
        }

        if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
          try {
            const supabaseUrl = env.SUPABASE_URL
            const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
            const profilesUrl = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`

            const updateBody = {
              plan,
              updated_at: new Date().toISOString(),
            }

            if (expiresAt) {
              updateBody.plan_expires_at = expiresAt
            }

            const res = await fetch(profilesUrl, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
                Prefer: 'return=minimal',
              },
              body: JSON.stringify(updateBody),
            })

            if (!res.ok) {
              console.error('Failed to update profile', await res.text())
              return json({ message: 'Failed to update profile' }, 500, origin)
            }
          } catch (err) {
            console.error('Supabase update error', err)
            return json({ message: 'Database error' }, 500, origin)
          }
        }

        return json({ ok: true }, 200, origin)
      } catch (e) {
        let message = 'Failed to verify payment'
        if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
          message = e.message
        }
        return json({ message }, 500, origin)
      }
    }

    return new Response('Not found', {
      status: 404,
      headers: corsHeaders(origin),
    })
  },
}

async function generateSignature(secret, orderId, paymentId) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const data = encoder.encode(`${orderId}|${paymentId}`)
  const signature = await crypto.subtle.sign('HMAC', key, data)
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function generateLinkCode() {
  let code = ''
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  for (let i = 0; i < 8; i += 1) {
    const idx = Math.floor(Math.random() * chars.length)
    code += chars[idx]
  }
  return code
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
  }
}

function json(data, status = 200, origin = '*') {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(origin),
  })
}

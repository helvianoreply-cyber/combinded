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

    // =========================================================
    // GET USER PROFILE BY EMAIL OR USER ID
    // =========================================================
    if ((url.pathname === '/get-profile' || url.pathname === '/profile') && (request.method === 'GET' || request.method === 'POST')) {
      try {
        let email = (url.searchParams.get('email') || '').trim().toLowerCase()
        let userId = (url.searchParams.get('userId') || url.searchParams.get('id') || '').trim()

        if (request.method === 'POST') {
          const body = await request.json().catch(() => ({}))
          if (!email && typeof body.email === 'string') email = body.email.trim().toLowerCase()
          if (!userId && typeof body.userId === 'string') userId = body.userId.trim()
          if (!userId && typeof body.id === 'string') userId = body.id.trim()
        }

        if (!email && !userId) {
          return json({ ok: false, message: 'Missing email or userId parameter' }, 400, origin)
        }

        if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
          return json({ ok: false, message: 'Supabase not configured' }, 500, origin)
        }

        const supabaseBase = env.SUPABASE_URL.replace(/\/+$/, '')
        const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

        let query = ''
        if (email) {
          query = `email=eq.${encodeURIComponent(email)}`
        } else {
          query = `id=eq.${encodeURIComponent(userId)}`
        }

        const profileRes = await fetch(`${supabaseBase}/rest/v1/profiles?${query}&select=*`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        })

        if (!profileRes.ok) {
          return json({ ok: false, message: 'Database query failed' }, profileRes.status, origin)
        }

        const rows = await profileRes.json()
        const profile = Array.isArray(rows) && rows.length > 0 ? rows[0] : null

        return json({ ok: true, profile }, 200, origin)
      } catch (err) {
        return json({ ok: false, message: err?.message || 'Failed to get profile' }, 500, origin)
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

    // =========================================================
    // DODO PAYMENTS: CREATE SUBSCRIPTION CHECKOUT
    // =========================================================
    if (url.pathname === '/create-dodo-checkout' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}))
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
        const name = typeof body.name === 'string' ? body.name.trim() : ''
        const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
        const returnUrl = typeof body.returnUrl === 'string' && body.returnUrl.trim() 
          ? body.returnUrl.trim() 
          : 'https://helvia.in/dashboard?payment=success'

        if (!email) {
          return json({ ok: false, message: 'Missing customer email' }, 400, origin)
        }

        const apiKey = env.DODO_PAYMENTS_API_KEY || 'fUkRC9TuMSF47Ov2.zKFg-nE3Xk32dthnOueK6T514FtuoIlgNZBT7x7SF3ytn0En'
        const productId = env.DODO_PRODUCT_ID || 'pdt_0Nmfh6M8mQGJT0VvCHDzO'
        const isTest = env.DODO_PAYMENTS_MODE === 'test'
        const dodoBase = isTest ? 'https://test.dodopayments.com' : 'https://live.dodopayments.com'

        // 1. Try Dodo Checkout Sessions endpoint (client.checkoutSessions.create)
        let dodoRes = await fetch(`${dodoBase}/checkouts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            billing: {
              country: 'US',
            },
            customer: {
              email,
              name: name || email.split('@')[0] || 'Customer',
            },
            product_cart: [
              {
                product_id: productId,
                quantity: 1,
              },
            ],
            feature_flags: {
              allow_discount_code: true,
            },
            metadata: {
              userId,
              email,
              plan: 'pro',
            },
            return_url: returnUrl,
          }),
        })

        // 2. Fallback to /subscriptions if needed
        if (!dodoRes.ok) {
          dodoRes = await fetch(`${dodoBase}/subscriptions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              billing: {
                country: 'US',
              },
              customer: {
                email,
                name: name || email.split('@')[0] || 'Customer',
              },
              product_id: productId,
              quantity: 1,
              payment_link: true,
              feature_flags: {
                allow_discount_code: true,
              },
              metadata: {
                userId,
                email,
                plan: 'pro',
              },
              return_url: returnUrl,
            }),
          })
        }

        // 3. Fallback to /payments if needed
        if (!dodoRes.ok) {
          dodoRes = await fetch(`${dodoBase}/payments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              billing: {
                country: 'US',
              },
              customer: {
                email,
                name: name || email.split('@')[0] || 'Customer',
              },
              product_cart: [
                {
                  product_id: productId,
                  quantity: 1,
                },
              ],
              payment_link: true,
              feature_flags: {
                allow_discount_code: true,
              },
              metadata: {
                userId,
                email,
                plan: 'pro',
              },
              return_url: returnUrl,
            }),
          })
        }

        if (!dodoRes.ok) {
          const errText = await dodoRes.text()
          console.error('Dodo checkout creation error:', dodoRes.status, errText)
          return json({ ok: false, message: 'Failed to create Dodo Payments checkout', detail: errText }, 500, origin)
        }

        const data = await dodoRes.json().catch(() => ({}))
        const checkoutHost = isTest ? 'https://test.checkout.dodopayments.com' : 'https://checkout.dodopayments.com'

        let checkoutUrl = 
          data.payment_link || 
          data.checkout_url || 
          data.url || 
          data.link || 
          data.hosted_url ||
          data.data?.payment_link ||
          data.data?.checkout_url ||
          data.data?.url ||
          data.subscription?.payment_link ||
          data.subscription?.checkout_url ||
          data.payment?.payment_link ||
          data.payment?.checkout_url ||
          ''

        // If Dodo returned a subscription_id / payment_id or object, build hosted checkout URL
        if (!checkoutUrl) {
          const directParams = new URLSearchParams()
          if (email) directParams.set('email', email)
          if (name) directParams.set('name', name)
          if (returnUrl) directParams.set('return_url', returnUrl)
          if (userId) directParams.set('userId', userId)
          if (data.subscription_id) directParams.set('subscription_id', data.subscription_id)
          if (data.payment_id) directParams.set('payment_id', data.payment_id)

          const qs = directParams.toString()
          checkoutUrl = `${checkoutHost}/buy/${productId}${qs ? `?${qs}` : ''}`
        }

        return json({ 
          ok: true, 
          checkoutUrl, 
          paymentId: data.payment_id || data.subscription_id || '',
          data 
        }, 200, origin)
      } catch (err) {
        console.error('Dodo checkout exception:', err)
        return json({ ok: false, message: err?.message || 'Error processing Dodo checkout' }, 500, origin)
      }
    }

    // =========================================================
    // DODO PAYMENTS: WEBHOOK LISTENER & SUPABASE AUTO-UPGRADE
    // =========================================================
    if (url.pathname === '/dodo-webhook' && request.method === 'POST') {
      try {
        const payloadText = await request.text()
        let event = null
        try {
          event = JSON.parse(payloadText)
        } catch {
          event = null
        }

        if (!event) {
          return new Response('Invalid JSON', { status: 400 })
        }

        const eventType = event.type || event.event || ''
        const dataObj = event.data || {}
        const metadata = dataObj.metadata || {}
        const userId = metadata.userId || metadata.user_id || ''
        const customerEmail = dataObj.customer?.email || metadata.email || ''

        // Check if event indicates successful payment or active subscription
        const isSuccessEvent = 
          eventType === 'subscription.active' ||
          eventType === 'subscription.renewed' ||
          eventType === 'payment.succeeded' ||
          eventType === 'checkout.session.completed'

        if (isSuccessEvent && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
          const supabaseUrl = env.SUPABASE_URL.replace(/\/+$/, '')
          const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

          // 30 days from now
          const expiresDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          const expiresIso = expiresDate.toISOString()

          const updateBody = {
            plan: 'pro',
            plan_expires_at: expiresIso,
            updated_at: new Date().toISOString(),
          }

          // Target by userId if available, else by email
          let targetUrl = ''
          if (userId) {
            targetUrl = `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`
          } else if (customerEmail) {
            targetUrl = `${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(customerEmail.toLowerCase())}`
          }

          if (targetUrl) {
            const updateRes = await fetch(targetUrl, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
                Prefer: 'return=minimal',
              },
              body: JSON.stringify(updateBody),
            })

            if (!updateRes.ok) {
              console.error('Supabase profile upgrade failed via Dodo webhook:', await updateRes.text())
            }
          }
        }

        return json({ ok: true, received: true, event: eventType }, 200, origin)
      } catch (err) {
        console.error('Dodo webhook processing error:', err)
        return json({ ok: false, error: err?.message }, 500, origin)
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

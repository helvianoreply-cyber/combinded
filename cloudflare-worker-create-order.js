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

        const durationRaw = typeof body.duration === 'string' ? body.duration : ''
        const duration = durationRaw === '24h' || durationRaw === 'month' ? durationRaw : ''

        let baseInr = 0
        let targetPlanId = String(body.planId || '').trim()
        let targetTier = String(body.planTier || body.tier || 'usage')

        const isTopup = body.isTopup === true || body.type === 'topup' || body.topupType === 'copilot' || body.topupType === 'autoapply'
        let topupType = String(body.topupType || '').toLowerCase()
        let topupMinutes = 0
        let topupResponses = 0
        let topupApplications = 0

        // Hardcoded official catalog for resilient fallback and strict validation
        const OFFICIAL_PLANS_BY_ID = {
          '4d569314-3b27-45c8-93ad-3d5c2eebffc0': { name: 'Standard Plan', priceUsd: 8, tier: 'usage' },
          'fdbc4259-cdb8-42b8-a0d5-02b8a7392812': { name: 'Pro+ Pro (Most Popular)', priceUsd: 15, tier: 'usage' },
          '13969aad-7309-40ec-9b54-70b39d5b13f6': { name: 'Pro Plus+ Lifetime (BYOK)', priceUsd: 49, tier: 'pro plus+' },
        }

        if (isTopup) {
          targetPlanId = 'topup'
          targetTier = 'usage'
          if (topupType === 'copilot' || body.minutes != null) {
            topupType = 'copilot'
            const m = Math.max(120, Math.min(6000, Number(body.minutes) || 600))
            const quote = calculateCopilotTopup(m)
            topupMinutes = quote.minutes
            topupResponses = quote.responses
            baseInr = quote.priceInr
          } else if (topupType === 'autoapply' || body.applications != null) {
            topupType = 'autoapply'
            const a = Math.max(100, Math.min(6000, Number(body.applications) || 500))
            const quote = calculateAutoApplyTopup(a)
            topupApplications = quote.applications
            baseInr = quote.priceInr
          } else {
            return json({ message: 'Invalid top-up type. Expected copilot or autoapply' }, 400, origin)
          }

          // EXPLICIT CHECK: Promotional coupons and discount offers cannot be used on top-up plans!
          const rawCoupon = String(body.couponCode || body.coupon || '').trim()
          if (rawCoupon) {
            return json({ message: 'Promotional coupons and offers cannot be applied to quota top-up plans. Top-ups are billed at standard on-demand rates.' }, 400, origin)
          }
        } else {
          if (!targetPlanId && duration !== '24h') {
            return json({ message: 'Missing required planId' }, 400, origin)
          }

          // 1. If planId provided, fetch official price from Supabase
          if (targetPlanId && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
            try {
              const planRes = await fetch(`${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/plans?id=eq.${encodeURIComponent(targetPlanId)}&select=*`, {
                headers: {
                  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
                  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
                }
              })
              if (planRes.ok) {
                const pRows = await planRes.json()
                if (Array.isArray(pRows) && pRows.length > 0) {
                  const p = pRows[0]
                  const priceUsd = Number(p.price)
                  if (priceUsd === 0) {
                    return json({ message: 'Free tier cannot be purchased' }, 400, origin)
                  }
                  baseInr = getOfficialPlanInrPrice(priceUsd)
                  targetTier = p.tier || targetTier
                }
              }
            } catch (e) {
              console.warn('Supabase plan lookup failed in create-order:', e)
            }
          }

          // 2. Resilient fallback to official catalog if DB call failed
          if (!baseInr && targetPlanId && OFFICIAL_PLANS_BY_ID[targetPlanId]) {
            const off = OFFICIAL_PLANS_BY_ID[targetPlanId]
            baseInr = getOfficialPlanInrPrice(off.priceUsd)
            targetTier = off.tier || targetTier
          } else if (!baseInr && duration === '24h') {
            baseInr = 169
            targetTier = 'standard'
          }
        }

        if (!baseInr || baseInr <= 0) {
          return json({ message: 'Invalid or unknown plan' }, 400, origin)
        }

        const basePlanAmount = baseInr * 100 // convert to paise

        // 3. SERVER-SIDE ONLY Coupon Validation (NEVER TRUST CLIENT-PROVIDED AMOUNTS OR CUSTOM DISCOUNTS!)
        const rawCoupon = String(body.couponCode || body.coupon || '').trim()
        // Top-ups are strictly excluded from discounts; coupons only apply to core subscription plans
        const hasValidCoupon = !isTopup && isValidDiscountCoupon(rawCoupon)
        const discountFraction = hasValidCoupon ? 0.5 : 0

        // Strict calculation: base price minus verified discount (top-ups always 100% full rate)
        // We completely ignore body.amount or customAmountInr!
        const amount = Math.round(basePlanAmount * (1 - discountFraction))

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

        const orderPayload = {
          amount,
          currency,
          receipt,
          notes: {
            project: 'helvia-remote',
            isTopup: isTopup ? 'true' : 'false',
            topupType: isTopup ? topupType : '',
            topupMinutes: isTopup ? String(topupMinutes) : '0',
            topupResponses: isTopup ? String(topupResponses) : '0',
            topupApplications: isTopup ? String(topupApplications) : '0',
            planId: targetPlanId,
            planTier: targetTier,
            expectedAmount: String(amount),
            baseAmount: String(basePlanAmount),
            userId: String(body.userId || '').trim(),
            email: String(body.email || '').toLowerCase().trim(),
            coupon: hasValidCoupon ? rawCoupon : '',
            processed: 'false',
          },
        }

        const razorRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${authToken}`,
          },
          body: JSON.stringify(orderPayload),
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

        const profileRes = await fetch(`${supabaseBase}/rest/v1/users?${query}&select=*`, {
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
          const profileUrl = `${supabaseBase}/rest/v1/users?select=verifier&email=eq.${encodeURIComponent(
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
          const profileUrl = `${supabaseBase}/rest/v1/users?select=plan,responses_remaining,seconds_remaining,applications_remaining&email=eq.${encodeURIComponent(email)}`
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
        )}/rest/v1/users?email=eq.${encodeURIComponent(email)}`

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
            login_verifier: false,
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
        const { orderId, paymentId, signature, userId } = body

        if (!orderId || !paymentId || !signature) {
          return json({ message: 'Missing required orderId, paymentId, or signature' }, 400, origin)
        }

        const keyId = env.RAZORPAY_KEY_ID
        const keySecret = env.RAZORPAY_KEY_SECRET
        if (!keySecret || !keyId) {
          return json({ message: 'Razorpay credentials not configured' }, 500, origin)
        }

        // 1. Verify Razorpay Signature (HMAC-SHA256)
        const generatedSignature = await generateSignature(keySecret, orderId, paymentId)
        if (generatedSignature !== signature) {
          return json({ message: 'Invalid payment signature' }, 400, origin)
        }

        const authToken = btoa(`${keyId}:${keySecret}`)

        // 2. Fetch Payment directly from Razorpay API
        const paymentRes = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
          headers: { Authorization: `Basic ${authToken}` },
        })
        if (!paymentRes.ok) {
          return json({ message: 'Payment verification with gateway failed' }, 400, origin)
        }
        const paymentData = await paymentRes.json()

        // 3. Fetch Order directly from Razorpay API
        const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
          headers: { Authorization: `Basic ${authToken}` },
        })
        if (!orderRes.ok) {
          return json({ message: 'Order verification with gateway failed' }, 400, origin)
        }
        const orderData = await orderRes.json()

        // 4. Verify payment integrity
        if (paymentData.status !== 'captured' && paymentData.status !== 'authorized') {
          return json({ message: `Payment is not captured (current: ${paymentData.status})` }, 400, origin)
        }
        if (paymentData.order_id !== orderId) {
          return json({ message: 'Payment order ID mismatch' }, 400, origin)
        }
        if (paymentData.amount !== orderData.amount) {
          return json({ message: 'Payment amount does not match order amount' }, 400, origin)
        }
        if (paymentData.currency !== 'INR') {
          return json({ message: 'Invalid payment currency' }, 400, origin)
        }

        // 5. Replay Attack Prevention (check if already processed)
        if (orderData.notes && orderData.notes.processed === 'true') {
          return json({ ok: true, message: 'Payment already processed and credited' }, 200, origin)
        }

        const isTopupOrder = orderData.notes?.isTopup === 'true'
        const topupType = String(orderData.notes?.topupType || '').toLowerCase()
        const topupMinutes = Number(orderData.notes?.topupMinutes) || 0
        const topupResponses = Number(orderData.notes?.topupResponses) || 0
        const topupApplications = Number(orderData.notes?.topupApplications) || 0

        // 6. Trusted Plan ID & Quota Lookup
        // Read strictly from immutable orderData.notes! (Never trust client body.planId or body.plan!)
        const trustedPlanId = orderData.notes?.planId || ''
        if (!trustedPlanId && !isTopupOrder) {
          return json({ message: 'Order verification failed: planId is missing from order notes' }, 400, origin)
        }
        const trustedUserId = orderData.notes?.userId || userId || ''
        const trustedEmail = (orderData.notes?.email || body.email || '').toLowerCase().trim()
        let planTier = orderData.notes?.planTier || 'usage'

        if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
          try {
            const supabaseUrl = env.SUPABASE_URL.replace(/\/+$/, '')
            const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

            // Idempotent duplicate check via database (if processed_payments table exists)
            try {
              const dedupRes = await fetch(`${supabaseUrl}/rest/v1/processed_payments`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  apikey: serviceKey,
                  Authorization: `Bearer ${serviceKey}`,
                  Prefer: 'return=minimal',
                },
                body: JSON.stringify({
                  payment_id: paymentId,
                  gateway: 'razorpay',
                  user_id: trustedUserId || null,
                  amount: paymentData.amount,
                  created_at: new Date().toISOString(),
                }),
              })
              if (dedupRes.status === 409) {
                return json({ ok: true, message: 'Payment already processed and credited' }, 200, origin)
              }
            } catch (dErr) {
              console.warn('processed_payments check skipped:', dErr)
            }

            let incMinutes = 0
            let incResponses = 0
            let incApplications = 0

            if (isTopupOrder) {
              if (topupType === 'copilot') {
                incMinutes = topupMinutes
                incResponses = topupResponses
                const quote = calculateCopilotTopup(topupMinutes)
                const exactRequiredPaise = quote.priceInr * 100
                // Top-ups MUST be paid at exact full price. No discounts or coupon offers permitted!
                if (orderData.amount < exactRequiredPaise - 200) {
                  return json({ message: 'Amount paid does not match required top-up price. Offers and coupons cannot be applied to top-up plans.' }, 400, origin)
                }
              } else if (topupType === 'autoapply') {
                incApplications = topupApplications
                const quote = calculateAutoApplyTopup(topupApplications)
                const exactRequiredPaise = quote.priceInr * 100
                // Top-ups MUST be paid at exact full price. No discounts or coupon offers permitted!
                if (orderData.amount < exactRequiredPaise - 200) {
                  return json({ message: 'Amount paid does not match required top-up price. Offers and coupons cannot be applied to top-up plans.' }, 400, origin)
                }
              }
              planTier = 'usage'
            } else if (trustedPlanId) {
              try {
                const planRes = await fetch(`${supabaseUrl}/rest/v1/plans?id=eq.${encodeURIComponent(trustedPlanId)}&select=*`, {
                  headers: {
                    'Content-Type': 'application/json',
                    apikey: serviceKey,
                    Authorization: `Bearer ${serviceKey}`,
                  },
                })
                if (planRes.ok) {
                  const pRows = await planRes.json()
                  if (Array.isArray(pRows) && pRows.length > 0) {
                    const p = pRows[0]
                    planTier = p.tier || planTier
                    incMinutes = Number(p.included_minutes) || 0
                    incResponses = Number(p.included_responses) || 0
                    incApplications = Number(p.included_applications) || 0

                    // Double-check: Make sure the amount paid meets minimum price for this plan!
                    const officialPrice = getOfficialPlanInrPrice(Number(p.price))
                    const minimumAllowedPaise = Math.round(officialPrice * 0.45 * 100) // allowing for up to 50% discount plus rounding
                    if (officialPrice > 0 && orderData.amount < minimumAllowedPaise) {
                      return json({ message: 'Amount paid does not meet minimum plan price requirement' }, 400, origin)
                    }
                  }
                }
              } catch (e) {
                console.error('Failed to fetch plan in verify-payment:', e)
              }
            }

            const validTiers = ['basic', 'pro plus+', 'usage', 'standard', 'pro_plus', 'max_plus', 'ultra_plus']
            if (!validTiers.includes(planTier)) {
              planTier = 'usage'
            }

            let targetUrl = ''
            if (trustedUserId) {
              targetUrl = `${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(trustedUserId)}`
            } else if (trustedEmail) {
              targetUrl = `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(trustedEmail)}`
            }

            // Fetch existing user quota balances to accumulate tokens instead of overwriting
            let existingSeconds = 0
            let existingResponses = 0
            let existingApplications = 0

            let existingPlan = null
            if (targetUrl) {
              try {
                const userGetRes = await fetch(`${targetUrl}&select=seconds_remaining,responses_remaining,applications_remaining,plan`, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    apikey: serviceKey,
                    Authorization: `Bearer ${serviceKey}`,
                  },
                })
                if (userGetRes.ok) {
                  const uRows = await userGetRes.json()
                  if (Array.isArray(uRows) && uRows.length > 0) {
                    existingPlan = uRows[0].plan
                    existingSeconds = Math.max(0, Number(uRows[0].seconds_remaining) || 0)
                    existingResponses = Math.max(0, Number(uRows[0].responses_remaining) || 0)
                    existingApplications = Math.max(0, Number(uRows[0].applications_remaining) || 0)
                  }
                }
              } catch (uErr) {
                console.warn('Could not read existing user quotas in verify-payment:', uErr)
              }
            }

            // For top-ups: Free/Basic users upgrade to 'usage'.
            // Lifetime BYOK ('pro plus+') users preserve their lifetime tier while adding credits.
            let finalPlan = planTier
            if (isTopupOrder && existingPlan === 'pro plus+') {
              finalPlan = 'pro plus+'
            }

            const updateBody = {
              plan: finalPlan,
              login_verifier: true,
              updated_at: new Date().toISOString(),
            }

            // ADD tokens to existing balance instead of replacing
            if (incMinutes > 0) {
              updateBody.seconds_remaining = existingSeconds + (incMinutes * 60)
            } else if (existingSeconds > 0) {
              updateBody.seconds_remaining = existingSeconds
            }

            if (incResponses > 0) {
              updateBody.responses_remaining = existingResponses + incResponses
            } else if (existingResponses > 0) {
              updateBody.responses_remaining = existingResponses
            }

            if (incApplications > 0) {
              updateBody.applications_remaining = existingApplications + incApplications
            } else if (existingApplications > 0) {
              updateBody.applications_remaining = existingApplications
            }

            if (targetUrl) {
              const res = await fetch(targetUrl, {
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
                console.error('Failed to update user in verify-payment:', await res.text())
              }
            }

            // 7. Mark Order as Processed in Razorpay to prevent replay attacks
            try {
              await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Basic ${authToken}`,
                },
                body: JSON.stringify({
                  notes: {
                    ...orderData.notes,
                    processed: 'true',
                    processed_at: new Date().toISOString(),
                    verified_payment_id: paymentId,
                  },
                }),
              })
            } catch (patchErr) {
              console.warn('Non-fatal: could not patch order notes in Razorpay:', patchErr)
            }

          } catch (err) {
            console.error('Supabase update error in verify-payment:', err)
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

        const apiKey = env.DODO_PAYMENTS_API_KEY || ''
        if (!apiKey) {
          return json({ ok: false, message: 'Dodo Payments is not configured' }, 500, origin)
        }
        const productId = 
          body.productId || 
          body.dodo_product_id || 
          body.product_id || 
          env.DODO_PRODUCT_ID || 
          'pdt_0NnIQ5VyQfhSXYsFLcojZ'
        const planTier = typeof body.plan === 'string' ? body.plan : 'usage'
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
              allow_discount_code: false,
            },
            metadata: {
              userId,
              email,
              productId,
              plan: planTier,
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
        const paymentId = dataObj.payment_id || dataObj.paymentId || ''
        const subscriptionId = dataObj.subscription_id || dataObj.subscriptionId || ''

        // Check if event indicates successful payment or active subscription
        const isSuccessEvent = 
          eventType === 'subscription.active' ||
          eventType === 'subscription.renewed' ||
          eventType === 'payment.succeeded' ||
          eventType === 'checkout.session.completed'

        if (!isSuccessEvent) {
          return new Response('Ignored non-success event', { status: 200 })
        }

        // SECURITY CHECK: Verify with Dodo Payments API using server's secret API key
        const apiKey = env.DODO_PAYMENTS_API_KEY || ''
        if (!apiKey) {
          return new Response('Dodo Payments is not configured', { status: 500 })
        }
        const isTest = env.DODO_PAYMENTS_MODE === 'test'
        const dodoBase = isTest ? 'https://test.dodopayments.com' : 'https://live.dodopayments.com'

        let verifiedProductId = ''
        let verifiedCustomerEmail = ''
        let verifiedUserId = dataObj.metadata?.userId || dataObj.metadata?.user_id || ''

        if (paymentId) {
          try {
            const dodoRes = await fetch(`${dodoBase}/payments/${encodeURIComponent(paymentId)}`, {
              headers: { Authorization: `Bearer ${apiKey}` },
            })
            if (!dodoRes.ok) {
              console.error('Failed to verify payment with Dodo API:', paymentId)
              return new Response('Unauthorized payment verification failed', { status: 401 })
            }
            const dodoData = await dodoRes.json()
            if (dodoData.status !== 'succeeded') {
              return new Response('Payment is not in succeeded status', { status: 400 })
            }
            verifiedProductId = dodoData.product_cart?.[0]?.product_id || dodoData.product_id || ''
            verifiedCustomerEmail = dodoData.customer?.email || ''
            verifiedUserId = dodoData.metadata?.userId || verifiedUserId
          } catch (dErr) {
            console.error('Dodo API fetch error:', dErr)
            return new Response('Dodo verification error', { status: 500 })
          }
        } else if (subscriptionId) {
          try {
            const dodoRes = await fetch(`${dodoBase}/subscriptions/${encodeURIComponent(subscriptionId)}`, {
              headers: { Authorization: `Bearer ${apiKey}` },
            })
            if (!dodoRes.ok) {
              console.error('Failed to verify subscription with Dodo API:', subscriptionId)
              return new Response('Unauthorized subscription verification failed', { status: 401 })
            }
            const dodoData = await dodoRes.json()
            if (dodoData.status !== 'active' && dodoData.status !== 'renewed') {
              return new Response('Subscription is not active', { status: 400 })
            }
            verifiedProductId = dodoData.product_id || ''
            verifiedCustomerEmail = dodoData.customer?.email || ''
            verifiedUserId = dodoData.metadata?.userId || verifiedUserId
          } catch (dErr) {
            console.error('Dodo API fetch error:', dErr)
            return new Response('Dodo verification error', { status: 500 })
          }
        } else {
          return new Response('Missing payment ID for Dodo verification', { status: 400 })
        }

        const metadata = dataObj.metadata || {}
        const userId = verifiedUserId || metadata.userId || metadata.user_id || ''
        const customerEmail = verifiedCustomerEmail || dataObj.customer?.email || metadata.email || ''
        // Strictly from verified Dodo API response! Never trust client-supplied event metadata!
        const planProductId = verifiedProductId
        if (!planProductId) {
          return new Response('Unable to identify product ID from verified Dodo transaction', { status: 400 })
        }

        if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
          const supabaseUrl = env.SUPABASE_URL.replace(/\/+$/, '')
          const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

          // Replay attack prevention: Deduplicate using processed_payments table
          const transId = paymentId || subscriptionId
          if (transId) {
            try {
              const dedupRes = await fetch(`${supabaseUrl}/rest/v1/processed_payments`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  apikey: serviceKey,
                  Authorization: `Bearer ${serviceKey}`,
                  Prefer: 'return=minimal',
                },
                body: JSON.stringify({
                  payment_id: transId,
                  gateway: 'dodo',
                  user_id: userId || null,
                  amount: null,
                  created_at: new Date().toISOString(),
                }),
              })
              if (dedupRes.status === 409) {
                return json({ ok: true, received: true, message: 'Dodo transaction already processed' }, 200, origin)
              }
            } catch (dErr) {
              console.warn('Dodo dedup check skipped:', dErr)
            }
          }

          let planTier = metadata.plan || 'usage'
          let incMinutes = 0
          let incResponses = 0
          let incApplications = 0

          if (planProductId) {
            try {
              const planFetch = await fetch(`${supabaseUrl}/rest/v1/plans?dodo_product_id=eq.${encodeURIComponent(planProductId)}&select=*`, {
                headers: {
                  apikey: serviceKey,
                  Authorization: `Bearer ${serviceKey}`,
                },
              })
              if (planFetch.ok) {
                const planRows = await planFetch.json()
                if (Array.isArray(planRows) && planRows.length > 0) {
                  const p = planRows[0]
                  planTier = p.tier || 'usage'
                  incMinutes = Number(p.included_minutes) || 0
                  incResponses = Number(p.included_responses) || 0
                  incApplications = Number(p.included_applications) || 0
                }
              }
            } catch (planErr) {
              console.error('Plan lookup in webhook failed:', planErr)
            }
          }

          // Ensure planTier satisfies CHECK constraint:
          // ['basic', 'pro plus+', 'usage', 'standard', 'pro_plus', 'max_plus', 'ultra_plus']
          const validTiers = ['basic', 'pro plus+', 'usage', 'standard', 'pro_plus', 'max_plus', 'ultra_plus']
          if (!validTiers.includes(planTier)) {
            planTier = 'usage'
          }

          // Target by userId if available, else by email
          let targetUrl = ''
          if (userId) {
            targetUrl = `${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(userId)}`
          } else if (customerEmail) {
            targetUrl = `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(customerEmail.toLowerCase())}`
          }

          let existingSeconds = 0
          let existingResponses = 0
          let existingApplications = 0

          let existingPlan = null
          if (targetUrl) {
            try {
              const userRes = await fetch(`${targetUrl}&select=seconds_remaining,responses_remaining,applications_remaining,plan`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  apikey: serviceKey,
                  Authorization: `Bearer ${serviceKey}`,
                },
              })
              if (userRes.ok) {
                const uRows = await userRes.json()
                if (Array.isArray(uRows) && uRows.length > 0) {
                  existingPlan = uRows[0].plan
                  existingSeconds = Math.max(0, Number(uRows[0].seconds_remaining) || 0)
                  existingResponses = Math.max(0, Number(uRows[0].responses_remaining) || 0)
                  existingApplications = Math.max(0, Number(uRows[0].applications_remaining) || 0)
                }
              }
            } catch (uErr) {
              console.warn('Could not read existing user quotas in dodo-webhook:', uErr)
            }
          }

          let finalPlan = planTier
          if (existingPlan === 'pro plus+' && planTier === 'usage') {
            finalPlan = 'pro plus+'
          }

          const updateBody = {
            plan: finalPlan,
            updated_at: new Date().toISOString(),
          }

          // ADD tokens to existing balance instead of replacing
          if (incMinutes > 0) {
            updateBody.seconds_remaining = existingSeconds + (incMinutes * 60)
          } else if (existingSeconds > 0) {
            updateBody.seconds_remaining = existingSeconds
          }

          if (incResponses > 0) {
            updateBody.responses_remaining = existingResponses + incResponses
          } else if (existingResponses > 0) {
            updateBody.responses_remaining = existingResponses
          }

          if (incApplications > 0) {
            updateBody.applications_remaining = existingApplications + incApplications
          } else if (existingApplications > 0) {
            updateBody.applications_remaining = existingApplications
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
              console.error('Supabase user upgrade failed via Dodo webhook:', await updateRes.text())
            }
          }
        }

        return json({ ok: true, received: true, event: eventType }, 200, origin)
      } catch (err) {
        console.error('Dodo webhook processing error:', err)
        return json({ ok: false, error: err?.message }, 500, origin)
      }
    }

    // =========================================================
    // GET PLANS LIST (PUBLIC)
    // =========================================================
    if (url.pathname === '/plans' && (request.method === 'GET' || request.method === 'OPTIONS')) {
      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const plansRes = await fetch(`${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/plans?select=*&order=price.asc`, {
            headers: {
              'Content-Type': 'application/json',
              apikey: env.SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
          })
          if (plansRes.ok) {
            const rows = await plansRes.json()
            return json({ ok: true, plans: rows }, 200, origin)
          }
        } catch {}
      }

      return json({ 
        ok: true, 
        plans: [
          { id: 'ee803f63-7ffc-4c93-bd79-2cb349c318b1', tier: 'basic', name: 'Basic Free Tier', price: 0, included_minutes: 5, included_responses: 5, dodo_product_id: null, included_applications: 5 },
          { id: '4d569314-3b27-45c8-93ad-3d5c2eebffc0', tier: 'usage', name: 'Standard Plan', price: 8, included_minutes: 300, included_responses: 500, dodo_product_id: 'pdt_0NnIPft32K3WxEEJbH04J', included_applications: 200 },
          { id: 'fdbc4259-cdb8-42b8-a0d5-02b8a7392812', tier: 'usage', name: 'Pro+ Pro (Most Popular)', price: 15, included_minutes: 1000, included_responses: 1500, dodo_product_id: 'pdt_0NnIQ5VyQfhSXYsFLcojZ', included_applications: 600 },
          { id: '13969aad-7309-40ec-9b54-70b39d5b13f6', tier: 'pro plus+', name: 'Pro Plus+ Lifetime (BYOK)', price: 49, included_minutes: 0, included_responses: 0, dodo_product_id: 'pdt_0NnIQqc0EzhEoVKHtBWTx', included_applications: 0 }
        ] 
      }, 200, origin)
    }

    return new Response('Not found', {
      status: 404,
      headers: corsHeaders(origin),
    })
  },
}

function calculateCopilotTopup(minutes) {
  const m = Math.max(120, Math.min(6000, Math.round(Number(minutes) || 600)))
  const responses = Math.round(m * 1.8)
  let inr = 99 + Math.round(m * 0.525)
  if (m >= 2000) inr = Math.round(inr * 0.9)
  if (m >= 4000) inr = Math.round(inr * 0.85)
  const usd = Math.max(2, Math.round((inr / 84) * 10) / 10)
  return { minutes: m, responses, priceInr: inr, priceUsd: usd }
}

function calculateAutoApplyTopup(applications) {
  const a = Math.max(100, Math.min(6000, Math.round(Number(applications) || 500)))
  let inr = 99 + Math.round(a * 0.7)
  if (a >= 1000) inr = Math.round(inr * 0.9)
  if (a >= 2000) inr = Math.round(inr * 0.85)
  if (a >= 4000) inr = Math.round(inr * 0.8)
  const usd = Math.max(2, Math.round((inr / 84) * 10) / 10)
  return { applications: a, priceInr: inr, priceUsd: usd }
}

function getOfficialPlanInrPrice(priceUsd) {
  const p = Number(priceUsd)
  if (p <= 0) return 0
  if (p <= 8) return 699
  if (p <= 15) return 1299
  if (p <= 25) return 2199
  if (p <= 35) return 2999
  if (p <= 49) return 4199
  return Math.round(p * 86)
}

function isValidDiscountCoupon(couponCode) {
  if (!couponCode || typeof couponCode !== 'string') return false
  const norm = couponCode.toUpperCase().replace(/\s+/g, '').replace(/_/g, '')
  return (
    norm === 'FIRST50' ||
    norm === 'APPLY50OFF' ||
    norm === 'APPLY50' ||
    norm === '50OFF' ||
    norm === 'OFFERTHTIX0UT4RHPCT' ||
    norm === 'OFFERTGYKVWY8HYZTTZ'
  )
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

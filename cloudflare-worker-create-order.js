// In-Memory Edge Cache to shield Supabase from connection exhaustion during traffic spikes
const PROFILE_CACHE = new Map() // key: email/userId -> { profile, expiresAt }

// Anti-Abuse IP Guard: Tracks free tier registrations per IP (Max 2 free accounts per IP per 24 hours)
const IP_FREE_REGISTRATIONS = new Map() // key: client IP -> [timestamps]

// Hardcoded official catalog for resilient fallback and strict validation
const OFFICIAL_PLANS_BY_ID = {
  '4d569314-3b27-45c8-93ad-3d5c2eebffc0': {
    name: 'Standard Plan',
    priceUsd: 8,
    tier: 'usage',
    included_minutes: 300,
    included_responses: 500,
    included_applications: 200,
  },
  'fdbc4259-cdb8-42b8-a0d5-02b8a7392812': {
    name: 'Pro+ Pro (Most Popular)',
    priceUsd: 15,
    tier: 'usage',
    included_minutes: 1000,
    included_responses: 1500,
    included_applications: 600,
  },
  'b1e06fa2-5819-48ce-8d07-28d8cf9c4901': {
    name: '1 Month Unlimited VIP',
    priceUsd: 21,
    tier: 'usage',
    included_minutes: 999999,
    included_responses: 999999,
    included_applications: 999999,
  },
}

function invalidateProfileCache(emailOrUserId) {
  if (!emailOrUserId) return
  const key = String(emailOrUserId).trim().toLowerCase()
  PROFILE_CACHE.delete(key)
}

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

    if (url.pathname === '/support' || url.pathname === '/whatsapp') {
      return Response.redirect('https://wa.me/919032025916?text=Hi%2C%20I%20need%20support%20with%20Helvia%20Remote', 302)
    }

    if (url.pathname === '/create-order' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}))

        // Reject if user already has an active unlimited plan (plan_expires_at > now)
        const checkEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
        const checkUserId = typeof body.userId === 'string' ? body.userId.trim() : ''
        if ((checkUserId || checkEmail) && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
          try {
            const queryParam = checkUserId ? `id=eq.${encodeURIComponent(checkUserId)}` : `email=eq.${encodeURIComponent(checkEmail)}`
            let uRes = await fetch(`${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/users?${queryParam}&select=*`, {
              headers: {
                apikey: env.SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
              }
            })
            let uRows = uRes.ok ? await uRes.json() : []
            if ((!uRows || uRows.length === 0) && checkEmail && checkUserId) {
              uRes = await fetch(`${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/users?email=eq.${encodeURIComponent(checkEmail)}&select=*`, {
                headers: {
                  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
                  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
                }
              })
              uRows = uRes.ok ? await uRes.json() : []
            }
            if (Array.isArray(uRows) && uRows.length > 0) {
              const u = uRows[0]
              if (u.plan_expires_at) {
                const expMs = new Date(u.plan_expires_at).getTime()
                if (!isNaN(expMs) && expMs > Date.now()) {
                  const expDateStr = new Date(expMs).toISOString().split('T')[0]
                  return json({
                    message: `You currently have an active Unlimited VIP Plan (expires on ${expDateStr}). You cannot purchase any another plan or top-up while your unlimited plan is active.`
                  }, 400, origin)
                }
              }
            }
          } catch (chkErr) {
            console.warn('Active unlimited expiry check in create-order error:', chkErr)
          }
        }

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
                  baseInr = getOfficialPlanInrPrice(priceUsd, targetPlanId)
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
            baseInr = getOfficialPlanInrPrice(off.priceUsd, targetPlanId)
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
        let amount = Math.round(basePlanAmount * (1 - discountFraction))
        if (baseInr === 1999 && hasValidCoupon) {
          amount = 999 * 100 // exactly ₹999 with 50% discount offer for 1-Month Unlimited VIP
        }

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
    // GET USER PROFILE BY EMAIL OR USER ID (SHIELDED WITH EDGE CACHE)
    // =========================================================
    if ((url.pathname === '/get-profile' || url.pathname === '/profile') && (request.method === 'GET' || request.method === 'POST')) {
      let email = (url.searchParams.get('email') || '').trim().toLowerCase()
      let userId = (url.searchParams.get('userId') || url.searchParams.get('id') || '').trim()

      try {
        if (request.method === 'POST') {
          const body = await request.json().catch(() => ({}))
          if (!email && typeof body.email === 'string') email = body.email.trim().toLowerCase()
          if (!userId && typeof body.userId === 'string') userId = body.userId.trim()
          if (!userId && typeof body.id === 'string') userId = body.id.trim()
        }

        if (!email && !userId) {
          return json({ ok: false, message: 'Missing email or userId parameter' }, 400, origin)
        }

        // ISSUE 2 PROTECTION: Check Edge Cache (20s TTL absorbs 95%+ traffic spikes)
        const forceFresh = url.searchParams.get('fresh') === 'true' || url.searchParams.get('nocache') === '1'
        const cacheKey = (email || userId).toLowerCase()
        const now = Date.now()
        const cached = PROFILE_CACHE.get(cacheKey)
        if (!forceFresh && cached && cached.expiresAt > now) {
          return json({ ok: true, profile: cached.profile, cached: true }, 200, origin)
        }

        if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
          if (cached && cached.profile) {
            return json({ ok: true, profile: cached.profile, stale: true }, 200, origin)
          }
          return json({ ok: false, message: 'Supabase not configured' }, 500, origin)
        }

        const supabaseBase = env.SUPABASE_URL.replace(/\/+$/, '')
        const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

        let profile = null

        // 1. Try finding by email (case-insensitive with ilike)
        if (email) {
          try {
            const profileRes = await fetch(`${supabaseBase}/rest/v1/users?email=ilike.${encodeURIComponent(email)}&select=*`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
              },
            })
            if (profileRes.ok) {
              const rows = await profileRes.json()
              if (Array.isArray(rows) && rows.length > 0) {
                profile = rows[0]
              }
            }
          } catch (_) {}
        }

        // 2. If not found by email and userId provided, try by id
        if (!profile && userId) {
          try {
            const profileRes = await fetch(`${supabaseBase}/rest/v1/users?id=eq.${encodeURIComponent(userId)}&select=*`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
              },
            })
            if (profileRes.ok) {
              const rows = await profileRes.json()
              if (Array.isArray(rows) && rows.length > 0) {
                profile = rows[0]
              }
            }
          } catch (_) {}
        }

        // 3. If not found by email or id, create fresh basic user record with starter quotas
        if (!profile && email) {
          try {
            const newRecord = {
              id: userId || undefined,
              email: email.trim().toLowerCase(),
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
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            const createRes = await fetch(`${supabaseBase}/rest/v1/users`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
                Prefer: 'return=representation',
              },
              body: JSON.stringify(newRecord),
            })
            if (createRes.ok) {
              const rows = await createRes.json()
              if (Array.isArray(rows) && rows.length > 0) {
                profile = rows[0]
              }
            }
          } catch (_) {}
        }

        if (profile) {
          let isExpired = false
          let expiryIso = profile.plan_expires_at || null

          if (expiryIso) {
            if (new Date(expiryIso).getTime() <= Date.now()) {
              isExpired = true
            }
          } else if (
            profile.plan === 'usage' && (
              Number(profile.responses_remaining) >= 900000 ||
              Number(profile.seconds_remaining) >= 50000000
            )
          ) {
            try {
              const payRes = await fetch(`${supabaseBase}/rest/v1/processed_payments?user_id=eq.${encodeURIComponent(profile.id)}&order=created_at.desc&limit=1`, {
                headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
              })
              if (payRes.ok) {
                const payRows = await payRes.json()
                if (Array.isArray(payRows) && payRows.length > 0 && payRows[0].created_at) {
                  const paidAt = new Date(payRows[0].created_at).getTime()
                  const expiry = paidAt + (30 * 24 * 60 * 60 * 1000)
                  if (Date.now() >= expiry) {
                    isExpired = true
                  } else {
                    expiryIso = new Date(expiry).toISOString()
                  }
                }
              }
            } catch (_) {}
          }

          if (isExpired) {
            // Automatically downgrade back to basic with 0 tokens!
            try {
              await fetch(`${supabaseBase}/rest/v1/users?id=eq.${encodeURIComponent(profile.id)}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  apikey: serviceKey,
                  Authorization: `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({
                  plan: 'basic',
                  seconds_remaining: 0,
                  responses_remaining: 0,
                  applications_remaining: 0,
                  plan_expires_at: null,
                  updated_at: new Date().toISOString(),
                }),
              })
            } catch (_) {}

            profile.plan = 'basic'
            profile.seconds_remaining = 0
            profile.responses_remaining = 0
            profile.applications_remaining = 0
            profile.plan_expires_at = null
          } else if (expiryIso) {
            profile.plan_expires_at = expiryIso
          }

          // Auto-award starter trial quotas to new/fresh basic users who haven't used any tokens yet
          const isFreshBasicUser =
            (!profile.plan || profile.plan === 'basic') &&
            !profile.plan_expires_at &&
            (Number(profile.seconds_used) || 0) === 0 &&
            (Number(profile.responses_used) || 0) === 0 &&
            (Number(profile.applications_applied) || 0) === 0 &&
            (
              ((Number(profile.seconds_remaining) || 0) === 0 && (Number(profile.responses_remaining) || 0) === 0) ||
              (Number(profile.applications_remaining) || 0) === 10
            )

          if (!isExpired && isFreshBasicUser) {
            const starterSeconds = 300 // 5 minutes free trial
            const starterResponses = 5 // 5 free AI answers
            const starterApps = 3      // 3 free job auto-applies

            try {
              await fetch(`${supabaseBase}/rest/v1/users?id=eq.${encodeURIComponent(profile.id)}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  apikey: serviceKey,
                  Authorization: `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({
                  plan: 'basic',
                  seconds_remaining: starterSeconds,
                  responses_remaining: starterResponses,
                  applications_remaining: starterApps,
                  updated_at: new Date().toISOString(),
                }),
              })
            } catch (_) {}

            profile.seconds_remaining = starterSeconds
            profile.responses_remaining = starterResponses
            profile.applications_remaining = starterApps
            profile.plan = 'basic'
          }

          // Compute friendly detected plan metadata
          let detectedPlan = 'Basic Free Tier'
          let detectedTier = 'basic'
          if (!isExpired && (profile.plan_expires_at || Number(profile.responses_remaining) >= 900000 || Number(profile.seconds_remaining) >= 50000000)) {
            detectedPlan = '1 Month Unlimited VIP'
            detectedTier = 'unlimited'
          } else if (profile.plan === 'pro_plus' || profile.plan === 'pro plus+' || (profile.plan === 'usage' && Number(profile.responses_remaining) >= 1200)) {
            detectedPlan = 'Pro+ Pro (Most Popular)'
            detectedTier = 'pro_plus'
          } else if (profile.plan === 'standard' || profile.plan === 'usage' || Number(profile.responses_remaining) > 5) {
            detectedPlan = 'Standard Plan'
            detectedTier = 'standard'
          }
          profile.detected_plan = detectedPlan
          profile.detected_tier = detectedTier

          // Save in Edge Memory Cache for 20 seconds to eliminate redundant Supabase round-trips
          PROFILE_CACHE.set(cacheKey, { profile, expiresAt: now + 20000 })
          if (profile.email) {
            PROFILE_CACHE.set(profile.email.toLowerCase(), { profile, expiresAt: now + 20000 })
          }
          if (profile.id) {
            PROFILE_CACHE.set(profile.id.toLowerCase(), { profile, expiresAt: now + 20000 })
          }
        }

        return json({ ok: true, profile }, 200, origin)
      } catch (err) {
        const fallbackKey = (email || userId || '').toLowerCase()
        if (fallbackKey && PROFILE_CACHE.has(fallbackKey)) {
          return json({ ok: true, profile: PROFILE_CACHE.get(fallbackKey).profile, stale: true }, 200, origin)
        }
        return json({ ok: false, message: err?.message || 'Failed to get profile' }, 500, origin)
      }
    }

    // =========================================================
    // ISSUE 1: FREE TRIAL ABUSE GUARD (IP LEVEL PROTECTION)
    // =========================================================
    if (url.pathname === '/check-trial-eligibility' && (request.method === 'GET' || request.method === 'POST')) {
      try {
        let email = (url.searchParams.get('email') || '').trim().toLowerCase()
        let claim = url.searchParams.get('claim') === 'true'

        if (request.method === 'POST') {
          const body = await request.json().catch(() => ({}))
          if (!email && typeof body.email === 'string') email = body.email.trim().toLowerCase()
          if (body.claim === true) claim = true
        }

        const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('x-real-ip') || '127.0.0.1'
        const now = Date.now()
        const oneDayAgo = now - (24 * 60 * 60 * 1000)

        // Prune older IP registration timestamps beyond 24 hours
        const rawHistory = IP_FREE_REGISTRATIONS.get(clientIp) || []
        const ipHistory = rawHistory.filter(item => item.timestamp > oneDayAgo)
        IP_FREE_REGISTRATIONS.set(clientIp, ipHistory)

        const isExistingIpUser = email ? ipHistory.some(item => item.email === email) : false

        // Max 2 free trial accounts per IP per 24 hours
        if (!isExistingIpUser && ipHistory.length >= 2) {
          return json({
            eligible: false,
            reason: 'Free trial limit reached for this network/IP in 24 hours. Choose a plan to continue.',
            limitType: 'ip_rate_limit'
          }, 200, origin)
        }

        if (claim && email && !isExistingIpUser) {
          ipHistory.push({ email, timestamp: now })
          IP_FREE_REGISTRATIONS.set(clientIp, ipHistory)
        }

        return json({ eligible: true, ip: clientIp, registeredCount: ipHistory.length }, 200, origin)
      } catch (err) {
        return json({ eligible: true, error: err?.message }, 200, origin)
      }
    }

    // =========================================================
    // SUBMIT USER HONEST REVIEW (EARN 2 HOURS + 300 ANSWERS + 50 APPS)
    // =========================================================
    if (url.pathname === '/submit-review' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}))
        const email = String(body.email || '').trim().toLowerCase()
        if (!email) {
          return json({ ok: false, message: 'Missing user email' }, 400, origin)
        }

        const supabaseBase = (env.SUPABASE_URL || '').replace(/\/+$/, '')
        const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseBase || !serviceKey) {
          return json({ ok: false, message: 'Database configuration missing' }, 500, origin)
        }

        // Look up user's active plan if not provided
        let plan = String(body.plan || 'basic').toLowerCase()
        try {
          const uRes = await fetch(`${supabaseBase}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=plan`, {
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
          })
          if (uRes.ok) {
            const uRows = await uRes.json()
            if (Array.isArray(uRows) && uRows.length > 0 && uRows[0].plan) {
              plan = uRows[0].plan
            }
          }
        } catch (_) {}

        const reviewRecord = {
          user_id: body.userId || null,
          email,
          plan,
          rating: Number(body.rating) || 5,
          issues_faced: String(body.issuesFaced || body.issues || '').trim(),
          improvements_suggested: String(body.improvementsSuggested || body.improvements || '').trim(),
          detailed_feedback: String(body.detailedFeedback || body.feedback || '').trim(),
          tokens_awarded: false,
          created_at: new Date().toISOString()
        }

        const insertRes = await fetch(`${supabaseBase}/rest/v1/user_reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            Prefer: 'return=representation'
          },
          body: JSON.stringify(reviewRecord)
        })

        if (!insertRes.ok) {
          const errDetail = await insertRes.text()
          console.warn('Failed to insert user review:', insertRes.status, errDetail)
          return json({ ok: false, message: 'Failed to record review in database: ' + errDetail }, insertRes.status, origin)
        }

        const inserted = await insertRes.json()
        return json({ ok: true, message: 'Review submitted successfully', review: inserted[0] }, 200, origin)
      } catch (e) {
        return json({ ok: false, message: e?.message || 'Failed to submit review' }, 500, origin)
      }
    }

    // =========================================================
    // GET ALL USER REVIEWS (FOR ADMIN DASHBOARD / EXPORT)
    // =========================================================
    if (url.pathname === '/get-reviews' && (request.method === 'GET' || request.method === 'POST')) {
      try {
        const supabaseBase = (env.SUPABASE_URL || '').replace(/\/+$/, '')
        const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseBase || !serviceKey) {
          return json({ ok: false, message: 'Database configuration missing' }, 500, origin)
        }

        const fetchRes = await fetch(`${supabaseBase}/rest/v1/user_reviews?select=*&order=created_at.desc`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`
          }
        })

        if (!fetchRes.ok) {
          const errDetail = await fetchRes.text()
          return json({ ok: false, message: 'Failed to query reviews: ' + errDetail }, fetchRes.status, origin)
        }

        const reviews = await fetchRes.json()
        return json({ ok: true, reviews: Array.isArray(reviews) ? reviews : [] }, 200, origin)
      } catch (e) {
        return json({ ok: false, message: e?.message || 'Failed to retrieve reviews' }, 500, origin)
      }
    }

    // =========================================================
    // AWARD REVIEW TOKENS (ADMIN ACTION: +2H, +300 ANS, +50 APPS)
    // =========================================================
    if (url.pathname === '/award-review-tokens' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}))
        const email = String(body.email || '').trim().toLowerCase()
        const reviewId = body.reviewId

        if (!email) {
          return json({ ok: false, message: 'Missing user email' }, 400, origin)
        }

        const supabaseBase = (env.SUPABASE_URL || '').replace(/\/+$/, '')
        const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseBase || !serviceKey) {
          return json({ ok: false, message: 'Database configuration missing' }, 500, origin)
        }

        // 1. Get user balance
        const uRes = await fetch(`${supabaseBase}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=*`, {
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
        })
        if (!uRes.ok) {
          return json({ ok: false, message: 'User lookup failed' }, 404, origin)
        }
        const uRows = await uRes.json()
        if (!Array.isArray(uRows) || uRows.length === 0) {
          return json({ ok: false, message: `User ${email} not found in database` }, 404, origin)
        }

        const u = uRows[0]
        const existingSeconds = Math.max(0, Number(u.seconds_remaining) || 0)
        const existingResponses = Math.max(0, Number(u.responses_remaining) || 0)
        const existingApplications = Math.max(0, Number(u.applications_remaining) || 0)
        const currentPlan = u.plan || 'basic'

        // Award +2 Hours (7,200s), +300 AI Answers, +50 Job Applies
        // Upgrade to 'usage' if on basic
        const newSeconds = existingSeconds + (2 * 3600)
        const newResponses = existingResponses + 300
        const newApplications = existingApplications + 50
        const newPlan = currentPlan === 'basic' ? 'usage' : currentPlan

        const updateBody = {
          plan: newPlan,
          login_verifier: true,
          verifier: true,
          seconds_remaining: newSeconds,
          responses_remaining: newResponses,
          applications_remaining: newApplications,
          updated_at: new Date().toISOString(),
        }

        const updateRes = await fetch(`${supabaseBase}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            Prefer: 'return=representation'
          },
          body: JSON.stringify(updateBody)
        })

        if (!updateRes.ok) {
          return json({ ok: false, message: 'Failed to update user quotas' }, 500, origin)
        }

        invalidateProfileCache(email)

        // Mark review as awarded if reviewId provided or by email
        try {
          const rQuery = reviewId ? `id=eq.${encodeURIComponent(reviewId)}` : `email=eq.${encodeURIComponent(email)}`
          await fetch(`${supabaseBase}/rest/v1/user_reviews?${rQuery}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`
            },
            body: JSON.stringify({
              tokens_awarded: true,
              awarded_at: new Date().toISOString()
            })
          })
        } catch (_) {}

        return json({
          ok: true,
          message: `Successfully awarded +2h, +300 answers, +50 applications to ${email}`,
          awarded: {
            email,
            plan: newPlan,
            seconds_remaining: newSeconds,
            responses_remaining: newResponses,
            applications_remaining: newApplications
          }
        }, 200, origin)
      } catch (e) {
        return json({ ok: false, message: e?.message || 'Failed to award tokens' }, 500, origin)
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

        invalidateProfileCache(normalizedEmail)
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
          if (profileRow) {
            let isExpired = false
            let expiryIso = profileRow.plan_expires_at || null
            if (expiryIso && new Date(expiryIso).getTime() <= Date.now()) {
              isExpired = true
            } else if (
              profileRow.plan === 'usage' && (
                Number(profileRow.responses_remaining) >= 900000 ||
                Number(profileRow.seconds_remaining) >= 50000000
              )
            ) {
              try {
                const payRes = await fetch(`${supabaseBase}/rest/v1/processed_payments?user_id=eq.${encodeURIComponent(profileRow.id || '')}&order=created_at.desc&limit=1`, {
                  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
                })
                if (payRes.ok) {
                  const payRows = await payRes.json()
                  if (Array.isArray(payRows) && payRows.length > 0 && payRows[0].created_at) {
                    const paidAt = new Date(payRows[0].created_at).getTime()
                    if (Date.now() >= paidAt + (30 * 24 * 60 * 60 * 1000)) {
                      isExpired = true
                    }
                  }
                }
              } catch (_) {}
            }

            if (isExpired) {
              plan = 'basic'
              try {
                await fetch(`${supabaseBase}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    apikey: serviceKey,
                    Authorization: `Bearer ${serviceKey}`,
                  },
                  body: JSON.stringify({
                    plan: 'basic',
                    seconds_remaining: 0,
                    responses_remaining: 0,
                    applications_remaining: 0,
                    plan_expires_at: null,
                    updated_at: new Date().toISOString(),
                  }),
                })
              } catch (_) {}
            } else {
              const planValue = typeof profileRow.plan === 'string' ? profileRow.plan : ''
              if (planValue) plan = planValue
            }
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

        invalidateProfileCache(email)
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
        const trustedPlanId = orderData.notes?.planId || body.planId || ''
        if (!trustedPlanId && !isTopupOrder) {
          return json({ message: 'Order verification failed: planId is missing from order notes' }, 400, origin)
        }
        const trustedUserId = orderData.notes?.userId || userId || body.userId || ''
        const trustedEmail = (orderData.notes?.email || body.email || '').toLowerCase().trim()
        let planTier = orderData.notes?.planTier || body.plan || 'usage'

        let updatedProfile = null

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
              } else if (topupType === 'autoapply') {
                incApplications = topupApplications
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
                  }
                }
              } catch (e) {
                console.error('Failed to fetch plan in verify-payment:', e)
              }

              // Resilient Fallback to official catalog if DB call had 0 tokens or timed out
              if (!incMinutes && OFFICIAL_PLANS_BY_ID[trustedPlanId]) {
                const off = OFFICIAL_PLANS_BY_ID[trustedPlanId]
                planTier = off.tier || planTier
                incMinutes = off.included_minutes || 0
                incResponses = off.included_responses || 0
                incApplications = off.included_applications || 0
              }
            }

            const validTiers = ['basic', 'pro plus+', 'usage', 'standard', 'pro_plus', 'max_plus', 'ultra_plus']
            if (!validTiers.includes(planTier)) {
              planTier = 'usage'
            }

            // Resilient User Lookup: Try by ID first, then fallback to Email
            let targetUser = null
            if (trustedUserId) {
              try {
                const uRes = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(trustedUserId)}&select=*`, {
                  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
                })
                if (uRes.ok) {
                  const rows = await uRes.json()
                  if (Array.isArray(rows) && rows.length > 0) targetUser = rows[0]
                }
              } catch (_) {}
            }

            if (!targetUser && trustedEmail) {
              try {
                const uRes = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(trustedEmail)}&select=*`, {
                  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
                })
                if (uRes.ok) {
                  const rows = await uRes.json()
                  if (Array.isArray(rows) && rows.length > 0) targetUser = rows[0]
                }
              } catch (_) {}
            }

            if (!targetUser) {
              console.error('Target user not found in Supabase for payment:', trustedUserId, trustedEmail)
              return json({ ok: false, message: 'User record not found in database' }, 404, origin)
            }

            const existingSeconds = Math.max(0, Number(targetUser.seconds_remaining) || 0)
            const existingResponses = Math.max(0, Number(targetUser.responses_remaining) || 0)
            const existingApplications = Math.max(0, Number(targetUser.applications_remaining) || 0)
            const existingPlan = targetUser.plan

            let finalPlan = planTier
            if (trustedPlanId === 'fdbc4259-cdb8-42b8-a0d5-02b8a7392812' || incMinutes === 1000) {
              finalPlan = 'pro_plus'
            } else if (trustedPlanId === '4d569314-3b27-45c8-93ad-3d5c2eebffc0' || incMinutes === 300) {
              finalPlan = 'standard'
            } else if (isTopupOrder) {
              finalPlan = existingPlan && existingPlan !== 'basic' ? existingPlan : 'usage'
            }

            const isUnlimitedOrder = 
              trustedPlanId === 'b1e06fa2-5819-48ce-8d07-28d8cf9c4901' || 
              (planTier === 'usage' && incMinutes >= 900000)

            // If user currently has an active unlimited VIP plan, prevent buying or clobbering with standard packs
            if (targetUser.plan_expires_at && new Date(targetUser.plan_expires_at).getTime() > Date.now()) {
              if (!isUnlimitedOrder) {
                return json({
                  ok: true,
                  message: 'User currently has an active Unlimited VIP Plan. All quotas are already unlimited.',
                  profile: targetUser,
                }, 200, origin)
              }
            }

            const updateBody = {
              plan: finalPlan,
              verifier: true,
              login_verifier: false,
              updated_at: new Date().toISOString(),
            }

            if (isUnlimitedOrder) {
              // 30 Days expiration from payment date
              const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              updateBody.plan = 'usage'
              updateBody.plan_expires_at = expiresAt
              updateBody.seconds_remaining = 999999 * 60
              updateBody.responses_remaining = 999999
              updateBody.applications_remaining = 999999
            } else {
              // ACCUMULATE tokens onto existing balance
              updateBody.seconds_remaining = existingSeconds + (incMinutes * 60)
              updateBody.responses_remaining = existingResponses + incResponses
              updateBody.applications_remaining = existingApplications + incApplications
              // Preserve any existing non-expired VIP pass if user had one, otherwise null
              if (targetUser.plan_expires_at && new Date(targetUser.plan_expires_at).getTime() > Date.now()) {
                updateBody.plan_expires_at = targetUser.plan_expires_at
              } else {
                updateBody.plan_expires_at = null
              }
            }

            const targetUrl = `${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(targetUser.id)}`
            let res = await fetch(targetUrl, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
                Prefer: 'return=representation',
              },
              body: JSON.stringify(updateBody),
            })

            // Graceful fallback if plan_expires_at column is missing
            if (!res.ok && updateBody.plan_expires_at) {
              const errText = await res.text()
              if (errText.includes('plan_expires_at')) {
                const { plan_expires_at, ...safeBody } = updateBody
                res = await fetch(targetUrl, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    apikey: serviceKey,
                    Authorization: `Bearer ${serviceKey}`,
                    Prefer: 'return=representation',
                  },
                  body: JSON.stringify(safeBody),
                })
              }
            }

            if (res.ok) {
              const resRows = await res.json().catch(() => [])
              if (Array.isArray(resRows) && resRows.length > 0) {
                updatedProfile = resRows[0]
              }
            }

            if (!updatedProfile) {
              updatedProfile = { ...targetUser, ...updateBody }
            }

            // Immediately prime Edge cache with the freshest profile
            if (targetUser.email) {
              PROFILE_CACHE.set(targetUser.email.toLowerCase(), { profile: updatedProfile, expiresAt: Date.now() + 20000 })
            }
            if (targetUser.id) {
              PROFILE_CACHE.set(targetUser.id.toLowerCase(), { profile: updatedProfile, expiresAt: Date.now() + 20000 })
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

        invalidateProfileCache(trustedEmail)
        if (trustedUserId) invalidateProfileCache(trustedUserId)

        return json({
          ok: true,
          message: 'Payment verified and quota credited successfully',
          profile: updatedProfile,
        }, 200, origin)
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

        // Reject if user already has an active unlimited plan (plan_expires_at > now)
        if ((userId || email) && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
          try {
            const queryParam = userId ? `id=eq.${encodeURIComponent(userId)}` : `email=eq.${encodeURIComponent(email)}`
            let uRes = await fetch(`${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/users?${queryParam}&select=*`, {
              headers: {
                apikey: env.SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
              }
            })
            let uRows = uRes.ok ? await uRes.json() : []
            if ((!uRows || uRows.length === 0) && email && userId) {
              uRes = await fetch(`${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=*`, {
                headers: {
                  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
                  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
                }
              })
              uRows = uRes.ok ? await uRes.json() : []
            }
            if (Array.isArray(uRows) && uRows.length > 0) {
              const u = uRows[0]
              if (u.plan_expires_at) {
                const expMs = new Date(u.plan_expires_at).getTime()
                if (!isNaN(expMs) && expMs > Date.now()) {
                  const expDateStr = new Date(expMs).toISOString().split('T')[0]
                  return json({
                    ok: false,
                    message: `You currently have an active Unlimited VIP Plan (expires on ${expDateStr}). You cannot purchase any another plan while your unlimited plan is active.`
                  }, 400, origin)
                }
              }
            }
          } catch (chkErr) {
            console.warn('Active unlimited expiry check in create-dodo-checkout error:', chkErr)
          }
        }
        const isUnlimited = 
          body.isUnlimited === 'true' || 
          body.isUnlimited === true || 
          body.planId === 'b1e06fa2-5819-48ce-8d07-28d8cf9c4901' ||
          body.productId === 'pdt_0Nmfh6M8mQGJT0VvCHDzO' ||
          body.dodo_product_id === 'pdt_0Nmfh6M8mQGJT0VvCHDzO' ||
          (typeof body.planTitle === 'string' && body.planTitle.toLowerCase().includes('unlimited'))

        const productId = 
          body.productId || 
          body.dodo_product_id || 
          body.product_id || 
          (isUnlimited ? (env.DODO_PRODUCT_ID_UNLIMITED || 'pdt_0Nmfh6M8mQGJT0VvCHDzO') : (env.DODO_PRODUCT_ID || 'pdt_0NnIQ5VyQfhSXYsFLcojZ'))
        const planTier = typeof body.plan === 'string' ? body.plan : 'usage'
        const isTest = env.DODO_PAYMENTS_MODE === 'test'
        const dodoBase = isTest ? 'https://test.dodopayments.com' : 'https://live.dodopayments.com'

        const rawDiscountCode = String(body.discount_code || body.discountCode || body.couponCode || body.coupon || '').trim()
        const discountCodes = rawDiscountCode ? [rawDiscountCode] : []

        const checkoutPayload = {
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
            productId,
            planId: body.planId || (isUnlimited ? 'b1e06fa2-5819-48ce-8d07-28d8cf9c4901' : ''),
            plan: planTier,
            isUnlimited: isUnlimited ? 'true' : 'false',
          },
          return_url: returnUrl,
        }

        if (discountCodes.length > 0) {
          checkoutPayload.discount_codes = discountCodes
        }

        // 1. Try Dodo Checkout Sessions endpoint (client.checkoutSessions.create)
        let dodoRes = await fetch(`${dodoBase}/checkouts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(checkoutPayload),
        })

        // If checkout creation failed with pre-applied code (e.g. code not created in Dodo yet), retry without discount_codes
        // but KEEP allow_discount_code: true so customer can still enter valid codes on the checkout page
        if (!dodoRes.ok && checkoutPayload.discount_codes) {
          delete checkoutPayload.discount_codes
          dodoRes = await fetch(`${dodoBase}/checkouts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(checkoutPayload),
          })
        }

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
                productId,
                planId: body.planId || (isUnlimited ? 'b1e06fa2-5819-48ce-8d07-28d8cf9c4901' : ''),
                plan: planTier,
                isUnlimited: isUnlimited ? 'true' : 'false',
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
                productId,
                planId: body.planId || (isUnlimited ? 'b1e06fa2-5819-48ce-8d07-28d8cf9c4901' : ''),
                plan: planTier,
                isUnlimited: isUnlimited ? 'true' : 'false',
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

          // Resilient User Lookup: Try by ID first, then fallback to Email
          let targetUser = null
          if (userId) {
            try {
              const uRes = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(userId)}&select=*`, {
                headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
              })
              if (uRes.ok) {
                const rows = await uRes.json()
                if (Array.isArray(rows) && rows.length > 0) targetUser = rows[0]
              }
            } catch (_) {}
          }
          if (!targetUser && customerEmail) {
            try {
              const uRes = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(customerEmail.toLowerCase())}&select=*`, {
                headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
              })
              if (uRes.ok) {
                const rows = await uRes.json()
                if (Array.isArray(rows) && rows.length > 0) targetUser = rows[0]
              }
            } catch (_) {}
          }

          if (targetUser) {
            const existingSeconds = Math.max(0, Number(targetUser.seconds_remaining) || 0)
            const existingResponses = Math.max(0, Number(targetUser.responses_remaining) || 0)
            const existingApplications = Math.max(0, Number(targetUser.applications_remaining) || 0)
            const existingPlan = targetUser.plan

            let finalPlan = planTier
            if (existingPlan === 'pro plus+' && planTier === 'usage') {
              finalPlan = 'pro plus+'
            }

            const isUnlimitedEvent = 
              metadata.isUnlimited === 'true' || 
              metadata.planId === 'b1e06fa2-5819-48ce-8d07-28d8cf9c4901' || 
              productId === 'pdt_0Nmfh6M8mQGJT0VvCHDzO' ||
              productId === 'pdt_0NnIQ_unlimited_vip' ||
              incMinutes >= 900000

            const updateBody = {
              plan: finalPlan,
              verifier: true,
              login_verifier: false,
              updated_at: new Date().toISOString(),
            }

            if (isUnlimitedEvent) {
              updateBody.plan = 'usage'
              updateBody.seconds_remaining = 999999 * 60
              updateBody.responses_remaining = 999999
              updateBody.applications_remaining = 999999
              updateBody.plan_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            } else {
              // ADD tokens to existing balance instead of replacing
              updateBody.seconds_remaining = existingSeconds + (incMinutes * 60)
              updateBody.responses_remaining = existingResponses + incResponses
              updateBody.applications_remaining = existingApplications + incApplications
              if (targetUser.plan_expires_at && new Date(targetUser.plan_expires_at).getTime() > Date.now()) {
                updateBody.plan_expires_at = targetUser.plan_expires_at
              } else {
                updateBody.plan_expires_at = null
              }
            }

            const targetUrl = `${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(targetUser.id)}`
            let updateRes = await fetch(targetUrl, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
                Prefer: 'return=minimal',
              },
              body: JSON.stringify(updateBody),
            })

            // Fallback if plan_expires_at column is missing
            if (!updateRes.ok && updateBody.plan_expires_at) {
              const errText = await updateRes.text()
              if (errText.includes('plan_expires_at')) {
                const { plan_expires_at, ...cleanUpdate } = updateBody
                updateRes = await fetch(targetUrl, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    apikey: serviceKey,
                    Authorization: `Bearer ${serviceKey}`,
                    Prefer: 'return=minimal',
                  },
                  body: JSON.stringify(cleanUpdate),
                })
              }
            }

            if (!updateRes.ok) {
              console.error('Supabase user upgrade failed via Dodo webhook:', await updateRes.text())
            }
          }
        }

        invalidateProfileCache(customerEmail)
        if (userId) invalidateProfileCache(userId)

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
            const filteredRows = Array.isArray(rows)
              ? rows.filter(r => r.id !== '13969aad-7309-40ec-9b54-70b39d5b13f6' && r.tier !== 'pro plus+')
              : rows
            return json({ ok: true, plans: filteredRows }, 200, origin)
          }
        } catch {}
      }

      return json({ 
        ok: true, 
        plans: [
          { id: 'ee803f63-7ffc-4c93-bd79-2cb349c318b1', tier: 'basic', name: 'Basic Free Tier', price: 0, included_minutes: 5, included_responses: 5, dodo_product_id: null, included_applications: 5 },
          { id: '4d569314-3b27-45c8-93ad-3d5c2eebffc0', tier: 'usage', name: 'Standard Plan', price: 8, included_minutes: 300, included_responses: 500, dodo_product_id: 'pdt_0NnIPft32K3WxEEJbH04J', included_applications: 200 },
          { id: 'fdbc4259-cdb8-42b8-a0d5-02b8a7392812', tier: 'usage', name: 'Pro+ Pro (Most Popular)', price: 15, included_minutes: 1000, included_responses: 1500, dodo_product_id: 'pdt_0NnIQ5VyQfhSXYsFLcojZ', included_applications: 600 },
          { id: 'b1e06fa2-5819-48ce-8d07-28d8cf9c4901', tier: 'usage', name: '1 Month Unlimited VIP', price: 21, included_minutes: 999999, included_responses: 999999, dodo_product_id: 'pdt_0Nmfh6M8mQGJT0VvCHDzO', included_applications: 999999 }
        ] 
      }, 200, origin)
    }

    // =========================================================
    // SUBMIT USER REVIEW & FEEDBACK
    // =========================================================
    if (url.pathname === '/submit-review' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}))
        const email = String(body.email || '').trim().toLowerCase()
        if (!email) {
          return json({ ok: false, message: 'Valid email is required to submit a review' }, 400, origin)
        }

        const supabaseBase = (env.SUPABASE_URL || 'https://effbmnisoxqefwauizib.supabase.co').replace(/\/+$/, '')
        const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZmJtbmlzb3hxZWZ3YXVpemliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzA1NTkzMywiZXhwIjoyMTAyNjMxOTMzfQ.pPkyPmhCvLs0AehDfdIc49Lf8lfPx8SJZoNysrsDkU0'

        // STRICT 1-TIME GIFT PER USER: Check if review was already submitted for this email
        const checkExisting = await fetch(`${supabaseBase}/rest/v1/user_reviews?email=eq.${encodeURIComponent(email)}&select=id,tokens_awarded`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        })

        if (checkExisting.ok) {
          const existingList = await checkExisting.json().catch(() => [])
          if (Array.isArray(existingList) && existingList.length > 0) {
            const isAwarded = existingList.some((item) => item.tokens_awarded)
            return json({
              ok: false,
              alreadyClaimed: true,
              message: isAwarded
                ? 'Your account has already claimed the one-time bonus gift (+2h, +300 answers, +50 jobs).'
                : 'A review has already been submitted for this email address. The gift reward is strictly 1-time per user account.'
            }, 400, origin)
          }
        }

        const reviewRecord = {
          email,
          plan: String(body.plan || 'basic').toLowerCase(),
          rating: Number(body.rating) || 5,
          issues_faced: String(body.issuesFaced || '').trim(),
          improvements_suggested: String(body.improvementsSuggested || '').trim(),
          detailed_feedback: String(body.detailedFeedback || '').trim(),
          tokens_awarded: false,
          created_at: new Date().toISOString(),
        }
        if (body.userId) {
          reviewRecord.user_id = String(body.userId).trim()
        }

        const insertRes = await fetch(`${supabaseBase}/rest/v1/user_reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            Prefer: 'return=representation',
          },
          body: JSON.stringify(reviewRecord),
        })

        if (!insertRes.ok) {
          const errText = await insertRes.text()
          console.error('Failed to insert user review:', errText)
          return json({ ok: false, message: 'Failed to record review in database: ' + errText }, 500, origin)
        }

        const inserted = await insertRes.json().catch(() => [reviewRecord])
        return json({ ok: true, message: 'Review successfully submitted! Our founder will verify and award bonus tokens.', review: inserted[0] }, 200, origin)
      } catch (err) {
        return json({ ok: false, message: err?.message || 'Error submitting review' }, 500, origin)
      }
    }

    // =========================================================
    // GET ALL REVIEWS (FOR ADMIN DASHBOARD & EXPORT)
    // =========================================================
    if (url.pathname === '/get-reviews' && (request.method === 'GET' || request.method === 'OPTIONS')) {
      try {
        const supabaseBase = (env.SUPABASE_URL || 'https://effbmnisoxqefwauizib.supabase.co').replace(/\/+$/, '')
        const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZmJtbmlzb3hxZWZ3YXVpemliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzA1NTkzMywiZXhwIjoyMTAyNjMxOTMzfQ.pPkyPmhCvLs0AehDfdIc49Lf8lfPx8SJZoNysrsDkU0'

        const reviewsRes = await fetch(`${supabaseBase}/rest/v1/user_reviews?select=*&order=created_at.desc`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        })

        if (!reviewsRes.ok) {
          const errText = await reviewsRes.text()
          return json({ ok: false, message: 'Failed to query reviews: ' + errText, reviews: [] }, 500, origin)
        }

        const rows = await reviewsRes.json()
        return json({ ok: true, reviews: rows }, 200, origin)
      } catch (err) {
        return json({ ok: false, message: err?.message, reviews: [] }, 500, origin)
      }
    }

    // =========================================================
    // AWARD REVIEW TOKENS (+2 Hours, +300 Answers, +50 Jobs)
    // =========================================================
    if (url.pathname === '/award-review-tokens' && request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}))
        const email = String(body.email || '').trim().toLowerCase()
        const reviewId = body.reviewId

        if (!email) {
          return json({ ok: false, message: 'Email is required to award tokens' }, 400, origin)
        }

        const supabaseBase = (env.SUPABASE_URL || 'https://effbmnisoxqefwauizib.supabase.co').replace(/\/+$/, '')
        const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZmJtbmlzb3hxZWZ3YXVpemliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzA1NTkzMywiZXhwIjoyMTAyNjMxOTMzfQ.pPkyPmhCvLs0AehDfdIc49Lf8lfPx8SJZoNysrsDkU0'

        // 1. Fetch user by email
        const userRes = await fetch(`${supabaseBase}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=*`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        })

        if (!userRes.ok) {
          return json({ ok: false, message: 'Could not fetch user profile from Supabase' }, 500, origin)
        }

        const users = await userRes.json()
        if (!Array.isArray(users) || users.length === 0) {
          return json({ ok: false, message: `User "${email}" not found in database` }, 404, origin)
        }

        // STRICT 1-TIME GIFT PER USER: Check if tokens were already awarded to this email
        const checkAwardedRes = await fetch(`${supabaseBase}/rest/v1/user_reviews?email=eq.${encodeURIComponent(email)}&tokens_awarded=eq.true&select=id,awarded_at`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        })

        if (checkAwardedRes.ok) {
          const awardedList = await checkAwardedRes.json().catch(() => [])
          if (Array.isArray(awardedList) && awardedList.length > 0) {
            return json({
              ok: false,
              message: `User "${email}" has already received their one-time gift reward! Tokens cannot be awarded multiple times.`
            }, 400, origin)
          }
        }

        const u = users[0]
        const curSeconds = Number(u.seconds_remaining) || 0
        const curResponses = Number(u.responses_remaining) || 0
        const curApplications = Number(u.applications_remaining) || 0
        const curPlan = u.plan || 'basic'

        // Award +2 Hours (7200s), +300 Responses, +50 Applications
        const newSeconds = curSeconds + (2 * 3600)
        const newResponses = curResponses + 300
        const newApplications = curApplications + 50
        const newPlan = curPlan === 'basic' ? 'usage' : curPlan

        // 2. Update user quotas
        const updateRes = await fetch(`${supabaseBase}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            plan: newPlan,
            login_verifier: true,
            verifier: true,
            seconds_remaining: newSeconds,
            responses_remaining: newResponses,
            applications_remaining: newApplications,
            updated_at: new Date().toISOString(),
          }),
        })

        if (!updateRes.ok) {
          return json({ ok: false, message: 'Failed to update user quota in database' }, 500, origin)
        }

        // 3. Mark review as tokens_awarded in user_reviews
        const reviewFilter = reviewId ? `id=eq.${encodeURIComponent(reviewId)}` : `email=eq.${encodeURIComponent(email)}`
        await fetch(`${supabaseBase}/rest/v1/user_reviews?${reviewFilter}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            tokens_awarded: true,
            awarded_at: new Date().toISOString(),
          }),
        }).catch(() => null)

        invalidateProfileCache(email)

        return json({
          ok: true,
          message: `Bonus credited! ${email} received +2 Hours, +300 Answers & +50 Job Applies.`,
          newPlan,
          newSeconds,
          newResponses,
          newApplications,
        }, 200, origin)
      } catch (err) {
        return json({ ok: false, message: err?.message || 'Error awarding tokens' }, 500, origin)
      }
    }

    return new Response('Not found', {
      status: 404,
      headers: corsHeaders(origin),
    })
  },
}

function calculateCopilotTopup(minutes) {
  const m = Math.max(60, Math.min(5000, Math.round(Number(minutes) || 600)))
  const responses = Math.round(m * 1.6)
  let inr = 99 + Math.round(m * 1.05)
  if (m >= 1000) inr = Math.round(inr * 0.9)
  if (m >= 2000) inr = Math.round(inr * 0.85)
  const usd = Math.max(2, Math.round((inr / 84) * 10) / 10)
  return { minutes: m, responses, priceInr: inr, priceUsd: usd }
}

function calculateAutoApplyTopup(applications) {
  const a = Math.max(50, Math.min(5000, Math.round(Number(applications) || 500)))
  let inr = 99 + Math.round(a * 1.4)
  if (a >= 500) inr = Math.round(inr * 0.9)
  if (a >= 1000) inr = Math.round(inr * 0.85)
  if (a >= 2000) inr = Math.round(inr * 0.8)
  const usd = Math.max(2, Math.round((inr / 84) * 10) / 10)
  return { applications: a, priceInr: inr, priceUsd: usd }
}

function getOfficialPlanInrPrice(priceUsd, planId) {
  const p = Number(priceUsd)
  if (planId === 'b1e06fa2-5819-48ce-8d07-28d8cf9c4901') return 1999
  if (planId === 'fdbc4259-cdb8-42b8-a0d5-02b8a7392812') return 1299
  if (planId === '4d569314-3b27-45c8-93ad-3d5c2eebffc0') return 699
  if (p <= 0) return 0
  if (p <= 8) return 699
  if (p <= 15) return 1299
  if (p <= 24) return 1999
  return 1999
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

/**
 * Script: set-user-plan.cjs
 * Usage: node set-user-plan.cjs <user_email> [tier]
 *
 * Examples:
 *   node set-user-plan.cjs user@gmail.com
 *   node set-user-plan.cjs user@gmail.com standard
 *   node set-user-plan.cjs user@gmail.com pro
 *   node set-user-plan.cjs user@gmail.com unlimited
 *
 * Description: Sets a user's plan to 'usage' and updates their token balances in Supabase.
 */

const targetEmail = (process.argv[2] || '').trim().toLowerCase()
const tierType = (process.argv[3] || 'standard').trim().toLowerCase()

if (!targetEmail) {
  console.log('Usage: node set-user-plan.cjs <user_email> [standard|pro|unlimited]')
  console.log('Example: node set-user-plan.cjs user@gmail.com unlimited')
  process.exit(1)
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://effbmnisoxqefwauizib.supabase.co'
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZmJtbmlzb3hxZWZ3YXVpemliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzA1NTkzMywiZXhwIjoyMTAyNjMxOTMzfQ.pPkyPmhCvLs0AehDfdIc49Lf8lfPx8SJZoNysrsDkU0'

// Quota presets
const PRESETS = {
  standard: {
    name: 'Standard Usage Plan ($8 / ₹599)',
    seconds: 300 * 60, // 300 mins = 18,000s
    responses: 500,
    applications: 200,
    expiresInDays: null,
  },
  pro: {
    name: 'Pro+ Usage Plan ($15 / ₹999)',
    seconds: 1000 * 60, // 1000 mins = 60,000s
    responses: 1500,
    applications: 600,
    expiresInDays: null,
  },
  unlimited: {
    name: '1 Month Unlimited VIP ($24 / ₹1,999)',
    seconds: 999999 * 60, // Unlimited
    responses: 999999,
    applications: 999999,
    expiresInDays: 30,
  },
}

const selected = PRESETS[tierType] || PRESETS.standard

async function setUserPlan() {
  console.log(`🔍 Checking user account for: ${targetEmail}...`)

  try {
    const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(targetEmail)}&select=*`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    })

    if (!userRes.ok) {
      console.error('❌ Failed to look up user:', userRes.status, await userRes.text())
      return
    }

    const users = await userRes.json()
    if (!Array.isArray(users) || users.length === 0) {
      console.error(`❌ User with email "${targetEmail}" was not found in public.users.`)
      return
    }

    const u = users[0]
    console.log(`   User ID: ${u.id}`)
    console.log(`   Current Plan: ${u.plan || 'basic'}`)
    console.log(`   Current Minutes: ${Math.round((Number(u.seconds_remaining) || 0) / 60)}m`)
    console.log(`   Current AI Answers: ${u.responses_remaining || 0}`)
    console.log(`   Current Job Applies: ${u.applications_remaining || 0}`)

    let expiresAt = null
    if (selected.expiresInDays) {
      expiresAt = new Date(Date.now() + selected.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    }

    const updateBody = {
      plan: 'usage',
      login_verifier: true,
      verifier: true,
      seconds_remaining: selected.seconds,
      responses_remaining: selected.responses,
      applications_remaining: selected.applications,
      updated_at: new Date().toISOString(),
    }

    if (expiresAt) {
      updateBody.plan_expires_at = expiresAt
    } else {
      updateBody.plan_expires_at = null
    }

    console.log(`\n🚀 Updating to: ${selected.name}...`)
    console.log(`   Plan: usage`)
    console.log(`   Minutes: ${Math.round(selected.seconds / 60)}m`)
    console.log(`   Answers: ${selected.responses}`)
    console.log(`   Applications: ${selected.applications}`)
    if (expiresAt) {
      console.log(`   Expires At: ${expiresAt} (30 days from now)`)
    }

    let updateRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(targetEmail)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(updateBody),
    })

    // Fallback if plan_expires_at column is not yet in public.users
    if (!updateRes.ok && updateBody.plan_expires_at) {
      const errText = await updateRes.text()
      if (errText.includes('plan_expires_at')) {
        const { plan_expires_at, ...cleanBody } = updateBody
        updateRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(targetEmail)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
            Prefer: 'return=representation',
          },
          body: JSON.stringify(cleanBody),
        })
      }
    }

    if (!updateRes.ok) {
      console.error('❌ Failed to update user:', await updateRes.text())
      return
    }

    const updated = await updateRes.json()
    console.log(`\n✅ Successfully updated user to usage plan!`)
    console.log(`   Result:`, updated[0] || updated)
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

setUserPlan()

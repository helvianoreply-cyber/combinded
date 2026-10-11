/**
 * Script: award-tokens.cjs
 * Usage: node award-tokens.cjs <user_email>
 * Example: node award-tokens.cjs faizalhayat621@gmail.com
 * Description: Awards +2 Hours (7,200s), +300 AI Answers, and +50 Job Applies to the specified user
 * and marks their review as tokens_awarded = true.
 */

const targetEmail = (process.argv[2] || '').trim().toLowerCase()

if (!targetEmail) {
  console.log('Usage: node award-tokens.cjs <user_email>')
  console.log('Example: node award-tokens.cjs user@gmail.com')
  process.exit(1)
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://effbmnisoxqefwauizib.supabase.co'
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZmJtbmlzb3hxZWZ3YXVpemliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzA1NTkzMywiZXhwIjoyMTAyNjMxOTMzfQ.pPkyPmhCvLs0AehDfdIc49Lf8lfPx8SJZoNysrsDkU0'

async function awardTokens() {
  console.log(`🔍 Checking user account for: ${targetEmail}...`)

  try {
    // 1. Fetch current user balance
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

    // Check if tokens were already awarded to this email
    try {
      const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/user_reviews?email=eq.${encodeURIComponent(targetEmail)}&tokens_awarded=eq.true&select=id,awarded_at`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      })
      if (checkRes.ok) {
        const awardedRows = await checkRes.json()
        if (Array.isArray(awardedRows) && awardedRows.length > 0) {
          console.error(`⚠️ BLOCKED: User "${targetEmail}" has ALREADY received their one-time gift reward! Cannot award twice.`)
          return
        }
      }
    } catch {}

    const u = users[0]
    const curSeconds = Number(u.seconds_remaining) || 0
    const curResponses = Number(u.responses_remaining) || 0
    const curApplications = Number(u.applications_remaining) || 0
    const curPlan = u.plan || 'basic'

    // Calculate new quotas: +2 Hours (7,200s), +300 Answers, +50 Applications
    const bonusSeconds = 2 * 3600 // 7,200s
    const bonusResponses = 300
    const bonusApplications = 50

    const newSeconds = curSeconds + bonusSeconds
    const newResponses = curResponses + bonusResponses
    const newApplications = curApplications + bonusApplications
    // If on basic free tier, upgrade to usage tier
    const newPlan = curPlan === 'basic' ? 'usage' : curPlan

    console.log(`\n📊 Current Balance:`)
    console.log(`   Plan: ${curPlan.toUpperCase()}`)
    console.log(`   Seconds Remaining: ${curSeconds} (${Math.round(curSeconds / 60)} mins)`)
    console.log(`   Responses: ${curResponses}`)
    console.log(`   Applications: ${curApplications}`)

    console.log(`\n🎁 Applying Bonus:`)
    console.log(`   +2 Hours (${bonusSeconds}s) -> New: ${newSeconds} (${Math.round(newSeconds / 60)} mins)`)
    console.log(`   +300 Answers -> New: ${newResponses}`)
    console.log(`   +50 Applications -> New: ${newApplications}`)
    console.log(`   New Plan: ${newPlan.toUpperCase()}`)

    // 2. Update user
    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(targetEmail)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
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
      console.error('❌ Failed to update user quota:', await updateRes.text())
      return
    }

    console.log(`\n✅ Quotas successfully updated in public.users!`)

    // 3. Mark review as tokens_awarded = true in user_reviews
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/user_reviews?email=eq.${encodeURIComponent(targetEmail)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({
          tokens_awarded: true,
          awarded_at: new Date().toISOString(),
        }),
      })
      console.log(`✅ Review for ${targetEmail} marked as tokens_awarded = true.`)
    } catch (rErr) {
      // Non-fatal if table not created yet
    }

    console.log(`\n🎉 All done! ${targetEmail} now has their bonus tokens active!`)
  } catch (err) {
    console.error('❌ Error:', err)
  }
}

awardTokens()

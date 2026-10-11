/**
 * Script: export-reviews.cjs
 * Usage: node export-reviews.cjs
 * Description: Exports all user honest reviews from Supabase to reviews_report.csv and reviews_report.json
 * showing Email, Plan, Rating, Issues, and Feedback side-by-side.
 */

const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://effbmnisoxqefwauizib.supabase.co'
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZmJtbmlzb3hxZWZ3YXVpemliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzA1NTkzMywiZXhwIjoyMTAyNjMxOTMzfQ.pPkyPmhCvLs0AehDfdIc49Lf8lfPx8SJZoNysrsDkU0'

async function exportReviews() {
  console.log('🔄 Fetching user reviews from Supabase...')
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_reviews?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('❌ Failed to fetch reviews:', res.status, err)
      return
    }

    const reviews = await res.json()
    console.log(`✅ Retrieved ${reviews.length} reviews.`)

    if (reviews.length === 0) {
      console.log('ℹ️ No reviews in database yet.')
      return
    }

    // 1. Write JSON file
    const jsonPath = path.join(__dirname, 'reviews_report.json')
    fs.writeFileSync(jsonPath, JSON.stringify(reviews, null, 2), 'utf-8')
    console.log(`📄 Saved JSON report to: ${jsonPath}`)

    // 2. Write CSV file (Email and Plan side-by-side)
    const headers = [
      'Email',
      'Plan',
      'Rating',
      'Tokens Awarded',
      'Issues Faced',
      'Improvements Suggested',
      'General Feedback',
      'Submitted Date',
    ]

    const csvRows = reviews.map((r) => [
      `"${(r.email || '').replace(/"/g, '""')}"`,
      `"${(r.plan || '').replace(/"/g, '""')}"`,
      r.rating || 5,
      r.tokens_awarded ? 'YES' : 'NO',
      `"${(r.issues_faced || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${(r.improvements_suggested || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${(r.detailed_feedback || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${new Date(r.created_at).toLocaleString()}"`,
    ])

    const csvContent = [headers.join(','), ...csvRows.map((row) => row.join(','))].join('\n')
    const csvPath = path.join(__dirname, 'reviews_report.csv')
    fs.writeFileSync(csvPath, csvContent, 'utf-8')
    console.log(`📊 Saved CSV report to: ${csvPath}`)

    // Print summary to terminal
    console.log('\n--- REVIEWS PREVIEW ---')
    reviews.slice(0, 5).forEach((r, idx) => {
      console.log(`${idx + 1}. [${r.email}] (${r.plan.toUpperCase()}) - ${r.rating}★ | Awarded: ${r.tokens_awarded ? 'YES' : 'NO'}`)
      if (r.issues_faced) console.log(`   Issues: ${r.issues_faced.slice(0, 80)}...`)
      if (r.improvements_suggested) console.log(`   Ideas:  ${r.improvements_suggested.slice(0, 80)}...`)
    })
  } catch (err) {
    console.error('❌ Exception during export:', err)
  }
}

exportReviews()

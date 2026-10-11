import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface UserReviewItem {
  id: string
  user_id?: string
  email: string
  plan: string
  rating: number
  issues_faced?: string
  improvements_suggested?: string
  detailed_feedback?: string
  tokens_awarded: boolean
  created_at: string
  awarded_at?: string
}

interface AdminReviewsPanelProps {
  apiBase?: string
}

export const AdminReviewsPanel: React.FC<AdminReviewsPanelProps> = ({
  apiBase = 'https://red-glade-5c0e.nagineniyashwanth90.workers.dev',
}) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('helvia_admin_auth') === 'true'
  })
  const [enteredPin, setEnteredPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)

  const [reviews, setReviews] = useState<UserReviewItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterPending, setFilterPending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const validPins = ['9032025916', 'helvia2026', 'admin123', 'helvia-founder']
    if (validPins.includes(enteredPin.trim())) {
      localStorage.setItem('helvia_admin_auth', 'true')
      setIsAdminAuthenticated(true)
      setPinError(null)
    } else {
      setPinError('Incorrect Admin PIN. Access denied.')
    }
  }

  const handleAdminLogout = () => {
    localStorage.removeItem('helvia_admin_auth')
    setIsAdminAuthenticated(false)
  }

  const fetchReviews = async () => {
    if (!isAdminAuthenticated) return
    setIsLoading(true)
    setActionMessage(null)
    try {
      let fetchedList: UserReviewItem[] | null = null

      // Try worker first
      try {
        const res = await fetch(`${apiBase}/get-reviews`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.reviews)) {
            fetchedList = data.reviews
          }
        }
      } catch {}

      // Fallback to Supabase directly
      if (!fetchedList && supabase) {
        const { data, error } = await supabase
          .from('user_reviews')
          .select('*')
          .order('created_at', { ascending: false })

        if (!error && Array.isArray(data)) {
          fetchedList = data as UserReviewItem[]
        }
      }

      setReviews(fetchedList || [])
    } catch (err: unknown) {
      console.error('Error fetching reviews:', err)
      setActionMessage('Failed to load reviews. Please verify database connection.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchReviews()
    }
  }, [apiBase, isAdminAuthenticated])

  // Award +2h, +300 answers, +50 applications to the user
  const handleAwardTokens = async (item: UserReviewItem) => {
    const confirmAward = window.confirm(
      `Award bonus tokens to ${item.email}?\n\nThis will add:\n• +2 Hours (7,200s) Meeting & Remote Time\n• +300 AI Answers\n• +50 Job Applications\n• Upgrade to Usage tier (if on basic)`
    )
    if (!confirmAward) return

    setProcessingId(item.id)
    setActionMessage(null)

    try {
      let awarded = false

      // Try worker first
      try {
        const res = await fetch(`${apiBase}/award-review-tokens`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reviewId: item.id,
            email: item.email,
          }),
        })

        if (res.ok) {
          awarded = true
        } else {
          const errJson = await res.json().catch(() => ({}))
          if (errJson.message && errJson.message.includes('already')) {
            throw new Error(errJson.message)
          }
        }
      } catch (wErr: unknown) {
        if (wErr instanceof Error && wErr.message.includes('already')) {
          throw wErr
        }
      }

      // Fallback to direct Supabase update
      if (!awarded && supabase) {
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .eq('email', item.email.toLowerCase().trim())

        if (usersData && usersData.length > 0) {
          const u = usersData[0]
          const newSeconds = (Number(u.seconds_remaining) || 0) + 7200
          const newResponses = (Number(u.responses_remaining) || 0) + 300
          const newApplications = (Number(u.applications_remaining) || 0) + 50
          const newPlan = u.plan === 'basic' ? 'usage' : u.plan

          const { error: userErr } = await supabase
            .from('users')
            .update({
              seconds_remaining: newSeconds,
              responses_remaining: newResponses,
              applications_remaining: newApplications,
              plan: newPlan,
              login_verifier: true,
              verifier: true,
              updated_at: new Date().toISOString(),
            })
            .eq('email', item.email.toLowerCase().trim())

          if (userErr) throw new Error(userErr.message)

          await supabase
            .from('user_reviews')
            .update({
              tokens_awarded: true,
              awarded_at: new Date().toISOString(),
            })
            .eq('id', item.id)

          awarded = true
        } else {
          throw new Error(`User account for ${item.email} was not found in database.`)
        }
      }

      if (!awarded) {
        throw new Error('Failed to award tokens. Please verify database connection.')
      }

      setActionMessage(`🎉 Successfully awarded +2 Hours, +300 Answers & +50 Applications to ${item.email}!`)
      
      // Update local state
      setReviews((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, tokens_awarded: true, awarded_at: new Date().toISOString() } : r))
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error awarding tokens'
      setActionMessage(`⚠️ ${msg}`)
    } finally {
      setProcessingId(null)
    }
  }

  // Export to CSV file
  const handleExportCSV = () => {
    if (reviews.length === 0) {
      alert('No reviews available to export.')
      return
    }

    const headers = ['Email', 'Plan', 'Rating', 'Issues Faced', 'Improvements Suggested', 'General Feedback', 'Tokens Awarded', 'Submitted At']
    
    const rows = reviews.map((r) => [
      `"${r.email.replace(/"/g, '""')}"`,
      `"${r.plan.replace(/"/g, '""')}"`,
      r.rating || 5,
      `"${(r.issues_faced || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${(r.improvements_suggested || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${(r.detailed_feedback || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      r.tokens_awarded ? 'YES' : 'NO',
      `"${new Date(r.created_at).toLocaleString()}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `helvia_user_reviews_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (filterPending && r.tokens_awarded) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          r.email.toLowerCase().includes(q) ||
          r.plan.toLowerCase().includes(q) ||
          (r.issues_faced && r.issues_faced.toLowerCase().includes(q)) ||
          (r.improvements_suggested && r.improvements_suggested.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [reviews, filterPending, searchQuery])

  if (!isAdminAuthenticated) {
    return (
      <div className="admin-reviews-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="admin-login-card">
          <div className="admin-lock-icon">🔒</div>
          <h2>Founder &amp; Admin Access Only</h2>
          <p className="admin-login-desc">
            All customer reviews, bug reports, and ratings are strictly private. Only the founder can view this information.
          </p>
          <form onSubmit={handleAdminLogin} className="admin-login-form">
            <input
              type="password"
              placeholder="Enter Admin PIN (e.g. 9032025916)"
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              className="admin-pin-input"
              autoFocus
            />
            {pinError && <div className="admin-pin-error">⚠️ {pinError}</div>}
            <button type="submit" className="admin-unlock-btn">
              Unlock Reviews &amp; Dispatcher
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-reviews-page">
      <div className="admin-reviews-container">
        {/* Header Bar */}
        <div className="admin-reviews-header">
          <div>
            <div className="admin-badge">Admin Review &amp; Reward Portal</div>
            <h1>User Honest Reviews &amp; Token Dispatcher</h1>
            <p className="admin-subtitle">
              Verify customer reviews, inspect friction points, and dispatch +2 Hours, +300 Answers &amp; +50 Job Applies in one click.
            </p>
          </div>
          <div className="admin-header-actions">
            <button type="button" className="admin-action-btn export" onClick={handleExportCSV}>
              📥 Export to CSV File
            </button>
            <button type="button" className="admin-action-btn refresh" onClick={fetchReviews} disabled={isLoading}>
              🔄 Refresh List
            </button>
            <button type="button" className="admin-action-btn lock" onClick={handleAdminLogout} title="Lock portal">
              🔒 Lock / Logout
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="admin-filters-bar">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by email, plan, or feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="admin-filter-toggle">
            <label>
              <input
                type="checkbox"
                checked={filterPending}
                onChange={(e) => setFilterPending(e.target.checked)}
              />
              Show Pending Rewards Only ({reviews.filter((r) => !r.tokens_awarded).length})
            </label>
          </div>
          <div className="admin-total-count">
            Total Reviews: <strong>{reviews.length}</strong>
          </div>
        </div>

        {actionMessage && (
          <div className="admin-message-banner">
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Reviews Table */}
        <div className="admin-table-wrapper">
          {isLoading ? (
            <div className="admin-loading">Loading reviews…</div>
          ) : filteredReviews.length === 0 ? (
            <div className="admin-empty">No reviews match your filters.</div>
          ) : (
            <table className="admin-reviews-table">
              <thead>
                <tr>
                  <th>User Email</th>
                  <th>Current Plan</th>
                  <th>Rating</th>
                  <th>Issues Faced</th>
                  <th>Improvements Needed</th>
                  <th>Other Feedback</th>
                  <th>Submitted At</th>
                  <th>Reward Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((r) => (
                  <tr key={r.id} className={r.tokens_awarded ? 'awarded-row' : 'pending-row'}>
                    <td className="email-cell">
                      <strong>{r.email}</strong>
                    </td>
                    <td className="plan-cell">
                      <span className={`plan-chip ${r.plan.toLowerCase()}`}>
                        {r.plan.toUpperCase()}
                      </span>
                    </td>
                    <td className="rating-cell">
                      <span className="stars-val">{'★'.repeat(r.rating || 5)}</span>
                    </td>
                    <td className="content-cell">
                      <div className="cell-scroll-text">{r.issues_faced || '—'}</div>
                    </td>
                    <td className="content-cell">
                      <div className="cell-scroll-text">{r.improvements_suggested || '—'}</div>
                    </td>
                    <td className="content-cell">
                      <div className="cell-scroll-text">{r.detailed_feedback || '—'}</div>
                    </td>
                    <td className="date-cell">
                      {new Date(r.created_at).toLocaleDateString()}
                      <span className="time-sub">{new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="status-cell">
                      {r.tokens_awarded ? (
                        <span className="status-pill awarded">✅ Awarded</span>
                      ) : reviews.some((other) => other.tokens_awarded && other.email.toLowerCase() === r.email.toLowerCase()) ? (
                        <span className="status-pill awarded" title="User already claimed their 1-time gift">✅ Already Claimed</span>
                      ) : (
                        <span className="status-pill pending">⏳ Pending</span>
                      )}
                    </td>
                    <td className="action-cell">
                      {r.tokens_awarded || reviews.some((other) => other.tokens_awarded && other.email.toLowerCase() === r.email.toLowerCase()) ? (
                        <button type="button" className="award-btn completed" disabled title="Strict 1-time gift per email enforced">
                          1-Time Gift Awarded
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="award-btn action"
                          onClick={() => handleAwardTokens(r)}
                          disabled={processingId === r.id}
                        >
                          {processingId === r.id ? 'Updating…' : '⚡ Award Tokens'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'

interface LinkedUser {
  id: string
  email: string
  plan: string
  seconds_remaining: number
  minutes_remaining: number
  responses_remaining: number
  applications_remaining: number
  verifier: boolean
  user_created_at?: string
}

interface LinkedReview {
  id: string
  email: string
  rating: number
  issues: string
  suggestions: string
  bonus_seconds: number
  bonus_responses: number
  created_at: string
  user: LinkedUser | null
}

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<LinkedReview[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState<string>('')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')

  const apiBase =
    import.meta.env.VITE_API_BASE_URL || 'https://red-glade-5c0e.nagineniyashwanth90.workers.dev'

  const fetchReviews = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${apiBase}/admin/reviews`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        throw new Error(`Failed to load reviews (HTTP ${res.status})`)
      }
      const data = await res.json()
      if (Array.isArray(data.reviews)) {
        setReviews(data.reviews)
      } else {
        setReviews([])
      }
    } catch (err) {
      console.error('Fetch reviews error:', err)
      setError(err instanceof Error ? err.message : 'Could not fetch reviews')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  // Filtered reviews list
  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const q = search.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.issues && r.issues.toLowerCase().includes(q)) ||
        (r.suggestions && r.suggestions.toLowerCase().includes(q))

      const matchesRating =
        ratingFilter === 'all' || String(r.rating) === ratingFilter

      const userPlan = (r.user?.plan || 'unknown').toLowerCase()
      const matchesPlan =
        planFilter === 'all' || userPlan === planFilter.toLowerCase()

      return matchesSearch && matchesRating && matchesPlan
    })
  }, [reviews, search, ratingFilter, planFilter])

  // Summary Metrics
  const stats = useMemo(() => {
    const total = reviews.length
    const avgRating =
      total > 0
        ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / total).toFixed(1)
        : '0.0'
    const totalBonusHours = (reviews.length * 2).toFixed(0)
    const totalBonusAnswers = reviews.length * 300
    const usageCount = reviews.filter((r) => (r.user?.plan || '').toLowerCase() === 'usage').length

    return { total, avgRating, totalBonusHours, totalBonusAnswers, usageCount }
  }, [reviews])

  const downloadCsv = () => {
    window.open(`${apiBase}/export-reviews`, '_blank')
  }

  return (
    <div className="admin-reviews-page">
      <div className="admin-reviews-container">
        {/* Navigation & Header */}
        <div className="admin-top-nav">
          <Link to="/dashboard" className="admin-back-btn">
            ← Back to Dashboard
          </Link>
          <div className="admin-badge">Admin Feedback &amp; Token Station</div>
        </div>

        <header className="admin-header">
          <h1>User Reviews &amp; Linked Account Directory</h1>
          <p className="admin-subtitle">
            All submitted user reviews joined by email with their live account plan, copilot quota, and Windows host link status.
          </p>
        </header>

        {/* Stats Row */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="stat-label">Total Reviews</span>
            <span className="stat-val">{stats.total}</span>
            <span className="stat-sub">1 unique claim per email</span>
          </div>
          <div className="admin-stat-card">
            <span className="stat-label">Average Rating</span>
            <span className="stat-val">⭐ {stats.avgRating} / 5</span>
            <span className="stat-sub">Overall user satisfaction</span>
          </div>
          <div className="admin-stat-card">
            <span className="stat-label">Usage Plan Reviewers</span>
            <span className="stat-val">{stats.usageCount}</span>
            <span className="stat-sub">Qualified usage accounts</span>
          </div>
          <div className="admin-stat-card highlight">
            <span className="stat-label">Bonus Quota Distributed</span>
            <span className="stat-val">+{stats.totalBonusHours}h / +{stats.totalBonusAnswers}</span>
            <span className="stat-sub">Hours of meeting time &amp; answers</span>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="admin-controls-card">
          <div className="admin-search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by email, reported issue, or feature suggestion…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
          </div>

          <div className="admin-filter-actions">
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Star Ratings</option>
              <option value="5">★★★★★ (5 Stars)</option>
              <option value="4">★★★★☆ (4 Stars)</option>
              <option value="3">★★★☆☆ (3 Stars)</option>
              <option value="2">★★☆☆☆ (2 Stars)</option>
              <option value="1">★☆☆☆☆ (1 Star)</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">All Account Plans</option>
              <option value="usage">Usage Plan Only</option>
              <option value="basic">Basic / Free Plan</option>
              <option value="pro plus+">Pro Plus+ Plan</option>
            </select>

            <button type="button" onClick={fetchReviews} className="admin-btn-secondary" title="Refresh list">
              🔄 Refresh
            </button>

            <button type="button" onClick={downloadCsv} className="admin-btn-primary" title="Export as CSV spreadsheet">
              📥 Download CSV File
            </button>
          </div>
        </div>

        {/* Content State */}
        {isLoading ? (
          <div className="admin-empty-box">
            <div className="admin-spinner"></div>
            <p>Loading reviews and linked account profiles…</p>
          </div>
        ) : error ? (
          <div className="admin-empty-box error">
            <span style={{ fontSize: '2rem' }}>⚠️</span>
            <h3>Could Not Load Reviews</h3>
            <p>{error}</p>
            <p className="admin-sql-hint">
              Make sure you have created the <code>public.app_reviews</code> table in Supabase.
            </p>
            <button onClick={fetchReviews} className="admin-btn-primary" style={{ marginTop: '1rem' }}>
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty-box">
            <span style={{ fontSize: '2.5rem' }}>📬</span>
            <h3>No Reviews Found</h3>
            <p>
              {reviews.length === 0
                ? 'No users have submitted an honest review yet. As users submit from their dashboard, their reviews linked with their accounts will automatically appear here.'
                : 'No reviews matched your search and filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="admin-reviews-table-wrap">
            <table className="admin-reviews-table">
              <thead>
                <tr>
                  <th>User &amp; Email</th>
                  <th>Plan &amp; Quota</th>
                  <th>Rating</th>
                  <th>Issues &amp; Difficulties Faced</th>
                  <th>Feature Suggestions &amp; Next Dev</th>
                  <th>Date &amp; Bonus</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const u = item.user
                  const stars = '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating)
                  const dateStr = item.created_at
                    ? new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent'

                  return (
                    <tr key={item.id}>
                      {/* User & Email */}
                      <td className="user-email-col">
                        <strong className="email-text">{item.email}</strong>
                        {u?.id && <span className="user-id-sub">ID: {u.id.slice(0, 8)}…</span>}
                        <span className={`host-status-tag ${u?.verifier ? 'linked' : 'standby'}`}>
                          {u?.verifier ? '● Host Linked' : '○ Standby'}
                        </span>
                      </td>

                      {/* Plan & Live Quota */}
                      <td className="plan-quota-col">
                        <span className={`plan-pill ${u?.plan === 'usage' ? 'usage' : 'other'}`}>
                          {(u?.plan || 'Unknown').toUpperCase()}
                        </span>
                        <div className="quota-metrics">
                          <span>⏱️ {u ? `${u.minutes_remaining} min` : 'N/A'}</span>
                          <span>💬 {u ? `${u.responses_remaining} ans` : 'N/A'}</span>
                          <span>💼 {u ? `${u.applications_remaining} applies` : 'N/A'}</span>
                        </div>
                      </td>

                      {/* Star Rating */}
                      <td className="rating-col">
                        <span className="stars-display" title={`${item.rating} Stars`}>
                          {stars}
                        </span>
                        <span className="rating-num">({item.rating}/5)</span>
                      </td>

                      {/* Issues Faced */}
                      <td className="content-col issues-col">
                        {item.issues ? (
                          <p>{item.issues}</p>
                        ) : (
                          <span className="none-text">No issues reported</span>
                        )}
                      </td>

                      {/* Suggestions */}
                      <td className="content-col suggestions-col">
                        {item.suggestions ? (
                          <p>{item.suggestions}</p>
                        ) : (
                          <span className="none-text">No suggestions provided</span>
                        )}
                      </td>

                      {/* Date & Reward */}
                      <td className="meta-col">
                        <span className="date-text">{dateStr}</span>
                        <span className="bonus-tag">+2h (7,200s) &amp; +300 ans</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

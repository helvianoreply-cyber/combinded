import React, { useState, useEffect } from 'react'
import { type DbUser } from '../lib/database.types'

interface ReviewSessionCardProps {
  userEmail?: string
  userId?: string
  currentProfile?: DbUser | null
  onBonusClaimed?: (updatedProfile: DbUser) => void
}

export const ReviewSessionCard: React.FC<ReviewSessionCardProps> = ({
  userEmail,
  userId,
  currentProfile,
  onBonusClaimed,
}) => {
  const [rating, setRating] = useState<number>(5)
  const [issues, setIssues] = useState<string>('')
  const [suggestions, setSuggestions] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [hasClaimed, setHasClaimed] = useState<boolean>(false)
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null)

  const normalizedEmail = (userEmail || '').trim().toLowerCase()
  const storageKey = `helvia_review_claimed_${normalizedEmail || 'user'}`

  useEffect(() => {
    if (normalizedEmail) {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        setHasClaimed(true)
        setClaimedNotice('You have already claimed your 2 Hours (120 mins) & 300 AI Answers review bonus.')
      }
    }
  }, [normalizedEmail, storageKey])

  const apiBase =
    import.meta.env.VITE_API_BASE_URL || 'https://red-glade-5c0e.nagineniyashwanth90.workers.dev'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!issues.trim() && !suggestions.trim()) {
      setSubmitError('Please share where you faced issues or what features we should develop next.')
      return
    }

    if (!normalizedEmail && !userId) {
      setSubmitError('You must be signed in to submit a review and claim your reward.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`${apiBase}/submit-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          userId,
          rating,
          issues: issues.trim(),
          suggestions: suggestions.trim(),
        }),
      })

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        message?: string
        alreadyClaimed?: boolean
        profile?: DbUser
      }

      if (!res.ok && !data.alreadyClaimed) {
        throw new Error(data.message || 'Failed to submit review')
      }

      // Mark claimed locally
      setHasClaimed(true)
      localStorage.setItem(storageKey, 'true')
      setClaimedNotice(data.message || '🎉 2 Hours (120 mins) & 300 AI Answers added to your balance!')

      // If server returned updated profile or calculate locally
      if (data.profile) {
        onBonusClaimed?.(data.profile)
      } else if (currentProfile) {
        const updated: DbUser = {
          ...currentProfile,
          seconds_remaining: (Number(currentProfile.seconds_remaining) || 0) + 7200,
          responses_remaining: (Number(currentProfile.responses_remaining) || 0) + 300,
          login_verifier: true,
        }
        onBonusClaimed?.(updated)
      }
    } catch (err) {
      console.error('Submit review error:', err)
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong while submitting')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="review-session-card">
      <div className="review-card-header">
        <div className="review-badge">
          <span>🎁</span>
          <span>Earn 2 Hours &amp; 300 Answers</span>
        </div>
        <h3 className="review-card-title">Help Us Improve Helvia &amp; Claim Instant Bonus</h3>
        <p className="review-card-subtitle">
          Share your honest review about where you faced issues and what development should be done. Once submitted, <strong>2 Hours (120 mins)</strong> of meeting time and <strong>300 AI Answers</strong> are automatically added to your account!
        </p>
      </div>

      {hasClaimed ? (
        <div className="review-claimed-box">
          <div className="claimed-icon">🎉</div>
          <div className="claimed-text">
            <h4>Thank You For Your Honest Review!</h4>
            <p>{claimedNotice || 'Your reward of 2 Hours & 300 AI Answers has been added to your live balance.'}</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="review-form">
          {submitError && (
            <div className="review-error-banner">
              <span>⚠️</span>
              <span>{submitError}</span>
            </div>
          )}

          {/* Star Rating Row */}
          <div className="review-field-group">
            <label className="review-label">Your Overall App Experience</label>
            <div className="review-stars-wrap">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`review-star-btn ${star <= rating ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                  title={`${star} Star${star > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
              <span className="review-rating-hint">
                {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Needs Work' : 'Poor'}
              </span>
            </div>
          </div>

          {/* Question 1: Issues / Friction */}
          <div className="review-field-group">
            <label className="review-label" htmlFor="review-issues">
              Where did you face issues or difficulty while using the app?
            </label>
            <textarea
              id="review-issues"
              className="review-textarea"
              rows={3}
              placeholder="e.g. Host connection took a few tries, audio whisper latency on meetings, resume ATS questions formatting, etc."
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Question 2: Improvements / Development */}
          <div className="review-field-group">
            <label className="review-label" htmlFor="review-suggestions">
              What new features or developments should be done next?
            </label>
            <textarea
              id="review-suggestions"
              className="review-textarea"
              rows={3}
              placeholder="e.g. macOS host client, more job board integrations, custom prompt engineering for interview answers, etc."
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="review-submit-row">
            <div className="review-reward-pill">
              <span>⚡ Reward:</span>
              <strong>+2 Hours (7,200s) &amp; +300 AI Answers</strong>
            </div>
            <button
              type="submit"
              className="review-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="review-spinner"></span>
                  <span>Crediting Tokens…</span>
                </>
              ) : (
                <>
                  <span>🎁 Submit Review &amp; Claim Reward</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

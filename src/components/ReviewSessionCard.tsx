import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

interface ReviewSessionCardProps {
  sessionEmail?: string | null
  currentPlan?: string
  userId?: string | null
  apiBase?: string
}

export const ReviewSessionCard: React.FC<ReviewSessionCardProps> = ({
  sessionEmail,
  currentPlan = 'basic',
  userId,
  apiBase = 'https://red-glade-5c0e.nagineniyashwanth90.workers.dev',
}) => {
  const [rating, setRating] = useState<number>(5)
  const [issuesFaced, setIssuesFaced] = useState('')
  const [improvements, setImprovements] = useState('')
  const [detailedFeedback, setDetailedFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [hasExistingReview, setHasExistingReview] = useState(false)

  // Check if review was already submitted in this browser
  useEffect(() => {
    const emailKey = sessionEmail ? `review_submitted_${sessionEmail.toLowerCase().trim()}` : null
    if (emailKey && localStorage.getItem(emailKey)) {
      setHasExistingReview(true)
    }
  }, [sessionEmail])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!sessionEmail) {
      setErrorMessage('Please ensure you are logged in to submit your review.')
      return
    }

    if (!issuesFaced.trim() && !improvements.trim() && !detailedFeedback.trim()) {
      setErrorMessage('Please provide your honest feedback in at least one of the fields below.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        userId: userId || undefined,
        email: sessionEmail.toLowerCase().trim(),
        plan: currentPlan,
        rating,
        issuesFaced: issuesFaced.trim(),
        improvementsSuggested: improvements.trim(),
        detailedFeedback: detailedFeedback.trim(),
      }

      let submitted = false

      // Try worker endpoint first
      try {
        const res = await fetch(`${apiBase}/submit-review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (res.ok) {
          submitted = true
        } else {
          let errData: { message?: string; alreadyClaimed?: boolean } | null = null
          try {
            errData = await res.json()
          } catch {
            errData = null
          }
          if (errData?.alreadyClaimed && sessionEmail) {
            localStorage.setItem(`review_submitted_${sessionEmail.toLowerCase().trim()}`, 'true')
            setHasExistingReview(true)
            throw new Error(errData.message || 'You have already claimed this 1-time gift.')
          }
        }
      } catch (workerErr: unknown) {
        if (workerErr instanceof Error && workerErr.message.includes('already claimed')) {
          throw workerErr
        }
      }

      // If worker did not handle it, fallback to direct Supabase
      if (!submitted && supabase) {
        // 1. Check existing
        const { data: existing } = await supabase
          .from('user_reviews')
          .select('id, tokens_awarded')
          .eq('email', payload.email)

        if (existing && existing.length > 0) {
          localStorage.setItem(`review_submitted_${sessionEmail.toLowerCase().trim()}`, 'true')
          setHasExistingReview(true)
          throw new Error('A review has already been submitted for this email. The bonus gift is strictly 1-time per account.')
        }

        const { error: insertErr } = await supabase.from('user_reviews').insert({
          email: payload.email,
          plan: payload.plan,
          rating: payload.rating,
          issues_faced: payload.issuesFaced,
          improvements_suggested: payload.improvementsSuggested,
          detailed_feedback: payload.detailedFeedback,
          user_id: payload.userId,
          tokens_awarded: false,
        })

        if (insertErr) {
          throw new Error('Database error: ' + insertErr.message)
        }
        submitted = true
      }

      if (!submitted) {
        throw new Error('Could not submit review. Please try again later.')
      }

      setSubmitSuccess(true)
      if (sessionEmail) {
        localStorage.setItem(`review_submitted_${sessionEmail.toLowerCase().trim()}`, 'true')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong while submitting.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="review-session-container">
      <div className="review-session-card">
        {/* Header & Reward Callout */}
        <div className="review-card-header">
          <div className="review-reward-pill">
            <span className="reward-icon">🎁</span>
            <span className="reward-text">Claim 2 Hours + 300 AI Answers + 50 Job Applies (One-Time Gift)</span>
          </div>
          <h2 className="review-title">Honest App Review &amp; Improvement Session</h2>
          <p className="review-subtitle">
            Tell us where you experienced issues or friction and what development we should prioritize next.
            Every genuine review is personally verified by our founder and rewarded with <strong>+2 Hours (120 mins)</strong> meeting copilot time, <strong>+300 AI vision answers</strong>, and <strong>+50 job applications</strong> added to your account! <em>(Strictly limited to 1 gift per user account).</em>
          </p>
        </div>

        {submitSuccess || hasExistingReview ? (
          <div className="review-success-state">
            <div className="review-success-icon">🎉</div>
            <h3>Thank You for Your Honest Feedback!</h3>
            <p>
              Your review for <strong>{sessionEmail}</strong> ({currentPlan.toUpperCase()} Plan) has been received. Our founder will check your review and manually credit:
            </p>
            <div className="review-reward-summary-box">
              <div className="reward-item">
                <span className="reward-val">⏱️ +2 Hours</span>
                <span className="reward-lbl">Remote &amp; Meeting Time</span>
              </div>
              <div className="reward-item">
                <span className="reward-val">💡 +300</span>
                <span className="reward-lbl">AI Vision Answers</span>
              </div>
              <div className="reward-item">
                <span className="reward-val">💼 +50</span>
                <span className="reward-lbl">Job Auto-Applications</span>
              </div>
            </div>
            <p className="review-note">
              Once verified, your plan automatically switches to <strong>Usage</strong> with full access enabled.
            </p>
          </div>
        ) : (
          <form className="review-form" onSubmit={handleSubmit}>
            {/* 1. Rating Selector */}
            <div className="review-form-group">
              <label className="review-label">Overall Experience Rating:</label>
              <div className="review-star-selector">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${rating >= star ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                    aria-label={`${star} star`}
                  >
                    ★
                  </button>
                ))}
                <span className="rating-desc">
                  {rating === 5 && '🌟 Excellent experience'}
                  {rating === 4 && '👍 Good, but has room to grow'}
                  {rating === 3 && '😐 Average experience'}
                  {rating === 2 && '⚠️ Needs significant fixes'}
                  {rating === 1 && '🚨 Very difficult / buggy'}
                </span>
              </div>
            </div>

            {/* 2. Issues Faced */}
            <div className="review-form-group">
              <label className="review-label" htmlFor="issues-faced">
                1. Where did you face issues, bugs, or friction?
              </label>
              <textarea
                id="issues-faced"
                className="review-textarea"
                rows={3}
                placeholder="E.g., Screen streaming lag during peak hours, keyboard input in stealth copilot, setup difficulties on Windows..."
                value={issuesFaced}
                onChange={(e) => setIssuesFaced(e.target.value)}
              />
            </div>

            {/* 3. Improvements Needed */}
            <div className="review-form-group">
              <label className="review-label" htmlFor="improvements-suggested">
                2. Where should development be done? What features are missing?
              </label>
              <textarea
                id="improvements-suggested"
                className="review-textarea"
                rows={3}
                placeholder="E.g., Mac / Linux support, mobile whisperer view, customizable stealth hotkeys, ATS resume customization for job applies..."
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
              />
            </div>

            {/* 4. Detailed Honest Feedback */}
            <div className="review-form-group">
              <label className="review-label" htmlFor="detailed-feedback">
                3. Any other honest thoughts or impressions?
              </label>
              <textarea
                id="detailed-feedback"
                className="review-textarea"
                rows={2}
                placeholder="Share your overall honest review of Helvia Remote..."
                value={detailedFeedback}
                onChange={(e) => setDetailedFeedback(e.target.value)}
              />
            </div>

            {errorMessage && (
              <div className="review-error-banner">
                <span>⚠️ {errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="review-action-row">
              <button
                type="submit"
                className="review-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Submitting Review…</span>
                ) : (
                  <>
                    <span>Submit Review &amp; Claim Reward</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </>
                )}
              </button>
              <div className="review-user-info-tag">
                Reviewing as: <strong>{sessionEmail || 'Guest'}</strong> ({currentPlan.toUpperCase()})
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

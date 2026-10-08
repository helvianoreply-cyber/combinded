import React, { useState, useMemo } from 'react'
import { calculateCopilotTopup, calculateAutoApplyTopup } from '../lib/database.types'

interface InteractiveTopupStationProps {
  onTopup: (type: 'copilot' | 'autoapply', units: number) => void
  isProcessing?: boolean
}

export const InteractiveTopupStation: React.FC<InteractiveTopupStationProps> = ({
  onTopup,
  isProcessing = false,
}) => {
  const [copilotMins, setCopilotMins] = useState<number>(300)
  const [applyCount, setApplyCount] = useState<number>(250)

  const copilotQuote = useMemo(() => calculateCopilotTopup(copilotMins), [copilotMins])
  const applyQuote = useMemo(() => calculateAutoApplyTopup(applyCount), [applyCount])

  const copilotPresets = [150, 300, 600, 1200, 2400]
  const applyPresets = [100, 250, 500, 1000, 2000]

  return (
    <section className="topup-station-section">
      <div className="topup-station-header">
        <div className="topup-badge">
          <span>⚡</span>
          <span>Flexible Top-Up Station</span>
        </div>
        <h2 className="topup-station-title">
          Scale Your Quota on Demand
        </h2>
        <p className="topup-station-subtitle">
          Only pay for what you actually use. Choose your exact meeting minutes or job applications—pricing calculates in real-time and stacks onto your existing balance.
        </p>
        <div className="topup-offer-notice">
          <span className="notice-icon">🏷️</span>
          <span><strong>Standard On-Demand Rates:</strong> Promotional coupons and discount offers do not apply to top-ups. Pricing scales dynamically with volume.</span>
        </div>
      </div>

      <div className="topup-cards-grid">
        {/* CARD 1: AI MEETING COPILOT & ANSWERS */}
        <div className="topup-card copilot-theme">
          <div className="topup-card-header">
            <div className="topup-icon-pill copilot">
              <span className="topup-icon">🎙️</span>
              <span className="topup-type-tag">Meeting AI Copilot</span>
            </div>
            <div className="topup-price-box">
              <div className="topup-price-main">
                <span className="topup-currency">$</span>
                <span className="topup-amount">{copilotQuote.priceUsd}</span>
              </div>
              <span className="topup-inr-tag">≈ ₹{copilotQuote.priceInr}</span>
              <span className="topup-no-discount-tag">Fixed Rate • No Coupons</span>
            </div>
          </div>

          <h3 className="topup-title">AI Meeting Time & AI Answers</h3>
          <p className="topup-desc">
            Ultra-low latency live screen vision + spoken audio transcription. Steers your technical interviews & executive meetings with stealth answer popups.
          </p>

          {/* Current Selection Value Banner */}
          <div className="topup-value-banner">
            <div className="topup-val-metric">
              <span className="topup-val-number">{copilotMins}</span>
              <span className="topup-val-unit">Minutes</span>
              <span className="topup-val-sub">({(copilotMins / 60).toFixed(1)} Hours)</span>
            </div>
            <div className="topup-val-divider">+</div>
            <div className="topup-val-metric highlight">
              <span className="topup-val-number">{copilotQuote.responses}</span>
              <span className="topup-val-unit">AI Answers</span>
              <span className="topup-val-sub">Real-Time Vision</span>
            </div>
          </div>

          {/* Slider Control */}
          <div className="topup-slider-wrap">
            <div className="topup-slider-labels">
              <span>60 Mins (1 hr)</span>
              <span>3,000 Mins (50 hrs)</span>
            </div>
            <input
              type="range"
              min={60}
              max={3000}
              step={15}
              value={copilotMins}
              onChange={(e) => setCopilotMins(Number(e.target.value))}
              className="topup-range-slider copilot-slider"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="topup-presets-wrap">
            <span className="topup-presets-label">Quick Presets:</span>
            <div className="topup-preset-chips">
              {copilotPresets.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  className={`topup-chip ${copilotMins === mins ? 'selected' : ''}`}
                  onClick={() => setCopilotMins(mins)}
                >
                  {mins >= 60 ? `${(mins / 60).toFixed(mins % 60 === 0 ? 0 : 1)}h` : `${mins}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Feature Highlights */}
          <ul className="topup-features-list">
            <li>
              <span className="chk">✓</span>
              <span>Ultra-low latency screen analysis & live audio transcription</span>
            </li>
            <li>
              <span className="chk">✓</span>
              <span>Stealth undetectable overlay (invisible to screen shares)</span>
            </li>
            <li>
              <span className="chk">✓</span>
              <span><strong>Never expires:</strong> Unused minutes stay in your account</span>
            </li>
          </ul>

          {/* CTA Action */}
          <button
            type="button"
            className="topup-cta-btn copilot-btn"
            onClick={() => onTopup('copilot', copilotMins)}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing…' : `Top-Up ${copilotMins} Mins (₹${copilotQuote.priceInr})`}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>

        {/* CARD 2: AI JOBS AUTO-APPLY */}
        <div className="topup-card autoapply-theme">
          <div className="topup-card-header">
            <div className="topup-icon-pill autoapply">
              <span className="topup-icon">🚀</span>
              <span className="topup-type-tag">Job Auto-Apply</span>
            </div>
            <div className="topup-price-box">
              <div className="topup-price-main">
                <span className="topup-currency">$</span>
                <span className="topup-amount">{applyQuote.priceUsd}</span>
              </div>
              <span className="topup-inr-tag">≈ ₹{applyQuote.priceInr}</span>
              <span className="topup-no-discount-tag">Fixed Rate • No Coupons</span>
            </div>
          </div>

          <h3 className="topup-title">AI Jobs Auto Apply Applications</h3>
          <p className="topup-desc">
            Automate hundreds of job applications on LinkedIn, Indeed, Greenhouse & Lever with customized resume answers and stealth bot prevention bypass.
          </p>

          {/* Current Selection Value Banner */}
          <div className="topup-value-banner">
            <div className="topup-val-metric full-width">
              <span className="topup-val-number">{applyCount}</span>
              <span className="topup-val-unit">Applications</span>
              <span className="topup-val-sub">Instant ATS Submissions with Resume AI</span>
            </div>
          </div>

          {/* Slider Control */}
          <div className="topup-slider-wrap">
            <div className="topup-slider-labels">
              <span>50 Jobs</span>
              <span>3,000 Jobs</span>
            </div>
            <input
              type="range"
              min={50}
              max={3000}
              step={25}
              value={applyCount}
              onChange={(e) => setApplyCount(Number(e.target.value))}
              className="topup-range-slider autoapply-slider"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="topup-presets-wrap">
            <span className="topup-presets-label">Quick Presets:</span>
            <div className="topup-preset-chips">
              {applyPresets.map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  className={`topup-chip ${applyCount === cnt ? 'selected' : ''}`}
                  onClick={() => setApplyCount(cnt)}
                >
                  {cnt} Jobs
                </button>
              ))}
            </div>
          </div>

          {/* Feature Highlights */}
          <ul className="topup-features-list">
            <li>
              <span className="chk">✓</span>
              <span>Tailored resume generation matching job requirements</span>
            </li>
            <li>
              <span className="chk">✓</span>
              <span>Automated custom questions solver (work auth, salary, skills)</span>
            </li>
            <li>
              <span className="chk">✓</span>
              <span><strong>Never expires:</strong> Tokens accumulate on top of existing balance</span>
            </li>
          </ul>

          {/* CTA Action */}
          <button
            type="button"
            className="topup-cta-btn autoapply-btn"
            onClick={() => onTopup('autoapply', applyCount)}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing…' : `Top-Up ${applyCount} Jobs (₹${applyQuote.priceInr})`}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}

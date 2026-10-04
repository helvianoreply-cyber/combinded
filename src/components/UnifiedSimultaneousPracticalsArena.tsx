import React, { useState, useEffect } from 'react'
import { Interactive3DDesktopSimulator } from './Interactive3DDesktopSimulator'
import { InteractiveMeetingAssistantSimulator } from './InteractiveMeetingAssistantSimulator'
import { InteractiveAutoApplySimulator } from './InteractiveAutoApplySimulator'

type ViewMode = 'remote' | 'copilot' | 'autoapply'

interface Props {
  isSignedIn?: boolean
  signInWithGoogle: () => Promise<void>
}

export const UnifiedSimultaneousPracticalsArena: React.FC<Props> = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('copilot')

  // Support direct hash navigation to specific practical tab
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase()
      if (hash.includes('remote') || hash.includes('desktop')) {
        setViewMode('remote')
      } else if (hash.includes('apply') || hash.includes('auto')) {
        setViewMode('autoapply')
      } else if (hash.includes('meeting') || hash.includes('copilot')) {
        setViewMode('copilot')
      }
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  return (
    <section className="simultaneous-practicals-section reveal" id="practicals-arena">
      <div className="simultaneous-arena-container">
        {/* Section Master Header - Clean, Focused & Elegant */}
        <div className="section-header text-center" style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="simultaneous-master-badge">
            <span className="live-radar-dot"></span>
            <span>LIVE INTERACTIVE EVALUATION</span>
          </div>
          <h2 className="simultaneous-main-title" style={{ marginBottom: '1.25rem' }}>
            Executive Copilot &amp; <span className="gradient-highlight-suite">Live Workstations</span>
          </h2>

          {/* Master View Mode Switcher - Meeting Copilot FIRST */}
          <div className="simultaneous-mode-switcher-bar">
            <button
              type="button"
              className={`sim-mode-tab-btn ${viewMode === 'copilot' ? 'active purple' : ''}`}
              onClick={() => setViewMode('copilot')}
            >
              <span className="mode-btn-icon">📹</span>
              <span>1. Executive Meeting Copilot</span>
            </button>
            <button
              type="button"
              className={`sim-mode-tab-btn ${viewMode === 'remote' ? 'active blue' : ''}`}
              onClick={() => setViewMode('remote')}
            >
              <span className="mode-btn-icon">🖥️</span>
              <span>2. Zero-Trust Remote Infrastructure</span>
            </button>
            <button
              type="button"
              className={`sim-mode-tab-btn ${viewMode === 'autoapply' ? 'active gold' : ''}`}
              onClick={() => setViewMode('autoapply')}
            >
              <span className="mode-btn-icon">🚀</span>
              <span>3. Talent Mobility &amp; ATS</span>
            </button>
          </div>
        </div>

        {/* 1. PRACTICAL 1: HELVIA MEETING COPILOT (FIRST & DEFAULT) */}
        {viewMode === 'copilot' && (
          <div className="focused-practical-wrap" id="meeting-copilot">
            <InteractiveMeetingAssistantSimulator />
          </div>
        )}

        {/* 2. PRACTICAL 2: HELVIA REMOTE INFRASTRUCTURE */}
        {viewMode === 'remote' && (
          <div className="focused-practical-wrap" id="practical-remote">
            <Interactive3DDesktopSimulator />
          </div>
        )}

        {/* 3. PRACTICAL 3: HELVIA AUTO APPLY & AI COACH */}
        {viewMode === 'autoapply' && (
          <div className="focused-practical-wrap" id="auto-apply">
            <InteractiveAutoApplySimulator />
          </div>
        )}
      </div>
    </section>
  )
}


import React, { useState, useEffect, useRef } from 'react'

interface ScenarioData {
  id: string
  label: string
  icon: string
  sessionTitle: string
  documentName: string
  documentSize: string
  interviewerQuestion: string
  answers: {
    'what-to-say': {
      label: string
      pill: string
      answer: string
      spokenBubble: string
    }
    'assist': {
      label: string
      pill: string
      answer: string
      spokenBubble: string
    }
    'followup': {
      label: string
      pill: string
      answer: string
      spokenBubble: string
    }
    'recap': {
      label: string
      pill: string
      answer: string
      spokenBubble: string
    }
  }
}

const SCENARIOS: ScenarioData[] = [
  {
    id: 'latency-pricing',
    label: 'Enterprise Latency Objection ($180k ARR)',
    icon: '💼',
    sessionTitle: 'Zoom Call • Enterprise Architecture & Latency Review ($180k ARR)',
    documentName: 'Enterprise_TCO_Pricing_2026.pdf',
    documentSize: '142 KB',
    interviewerQuestion: 'How does your system maintain ultra-low latency during live calls without blowing our cloud compute budget?',
    answers: {
      'what-to-say': {
        label: 'What should I say?',
        pill: 'What should I say?',
        answer: '“We run quantized on-device GPU models and direct ring-buffer audio capture. By bypassing cloud API hops entirely, latency stays strictly under 18ms with zero per-minute cloud billing.”',
        spokenBubble: '“We run quantized on-device GPU models and direct ring-buffer audio capture to stay under 18ms.”',
      },
      'assist': {
        label: 'Assist (Deep Dive)',
        pill: 'Technical Architecture Comparison',
        answer: '<strong>Local Soundcard Capture vs Cloud Webhooks:</strong> Helvia hooks directly into the system audio output without buffer bloat.<br/><br/>Tokens stream into an 8-bit quantized local neural engine in <strong>18ms</strong> compared to <strong>850ms</strong> for standard cloud speech-to-text endpoints. Network bandwidth consumption is <strong>0 KB/s</strong>.',
        spokenBubble: '“Our system captures meeting audio directly, streaming tokens in 18ms vs 850ms for cloud webhooks.”',
      },
      'followup': {
        label: 'Follow-up questions',
        pill: 'Strategic Discovery Questions',
        answer: '1. “How is your engineering team currently measuring audio packet jitter over remote cellular connections?”<br/>2. “Would you like me to walk through a live benchmark comparison against your existing cloud transcription pipeline?”',
        spokenBubble: '“How does your engineering team currently monitor packet jitter over remote cellular links?”',
      },
      'recap': {
        label: 'Recap',
        pill: 'Meeting Summary & Next Steps',
        answer: '• <strong>Client Priority:</strong> Eliminate 850ms transcription lag on international client calls.<br/>• <strong>Budget Goal:</strong> Cut per-minute cloud transcription billing to zero via local GPU models.<br/>• <strong>Agreed Next Step:</strong> Deliver a 14-day offline proof-of-concept license key for IT security audit.',
        spokenBubble: '“To recap: our goal is bringing ingest latency below 18ms with single-device verification.”',
      },
    },
  },
  {
    id: 'split-brain',
    label: 'Distributed Systems & Split-Brain (FAANG)',
    icon: '⚡',
    sessionTitle: 'Google Meet • Staff Distributed Systems System Design Screen',
    documentName: 'Distributed_Consensus_Raft_Whitepaper.pdf',
    documentSize: '280 KB',
    interviewerQuestion: 'How do you prevent split-brain in a multi-region distributed database during a severe network partition?',
    answers: {
      'what-to-say': {
        label: 'What should I say?',
        pill: 'What should I say?',
        answer: '“We enforce Raft quorum consensus requiring a strict majority (N/2 + 1) of active nodes to acknowledge writes before committing, paired with generation fencing tokens so storage engines automatically reject stale zombie leader writes.”',
        spokenBubble: '“We enforce Raft quorum consensus (N/2 + 1) and monotonic generation fencing tokens.”',
      },
      'assist': {
        label: 'Assist (Deep Dive)',
        pill: 'Raft Consensus & Fencing Tokens',
        answer: '<strong>Quorum Math:</strong> In a 5-node cluster, a partition isolating 2 nodes cannot achieve a 3-node majority. The minority partition immediately pauses write acknowledgments.<br/><br/><strong>Monotonic Fencing Tokens:</strong> Every new election increments the term counter. When the partitioned leader reconnects, storage nodes verify the token and drop outdated commits to eliminate data corruption.',
        spokenBubble: '“In a 5-node cluster, 2 isolated nodes cannot reach the 3-node majority and write commits halt safe.”',
      },
      'followup': {
        label: 'Follow-up questions',
        pill: 'Architecture Discovery Questions',
        answer: '1. “Are your multi-region clusters configured for strict CP consistency or eventual AP consistency under PACELC?”<br/>2. “What heartbeat timeout threshold do your gossip nodes use before initiating candidate elections?”',
        spokenBubble: '“Are your multi-region clusters configured for strict CP or eventual AP under PACELC?”',
      },
      'recap': {
        label: 'Recap',
        pill: 'Architecture Walkthrough Summary',
        answer: '• <strong>Consensus Mechanism:</strong> Raft majority quorum (N/2 + 1) prevents dual write leaders.<br/>• <strong>Partition Isolation:</strong> Minority partition enters fail-safe read-only state.<br/>• <strong>Fencing Tokens:</strong> Prevent stale leader write races upon network partition self-healing.',
        spokenBubble: '“To summarize: majority quorum guarantees single-leader integrity with fencing token validation.”',
      },
    },
  },
  {
    id: 'tcp-udp',
    label: 'Streaming Protocols: TCP vs UDP',
    icon: '🌐',
    sessionTitle: 'Teams Call • High-Concurrency Video Streaming Infrastructure',
    documentName: 'WebRTC_LowLatency_Protocols.pdf',
    documentSize: '195 KB',
    interviewerQuestion: 'Why would you choose UDP or WebRTC over TCP for live interactive screen sharing and video?',
    answers: {
      'what-to-say': {
        label: 'What should I say?',
        pill: 'What should I say?',
        answer: '“TCP guarantees in-order delivery via ACK retransmissions, which introduces head-of-line blocking whenever a single packet drops. For live video, dropping one stale frame is far better than freezing the entire stream, so UDP/WebRTC delivers real-time sub-20ms responsiveness.”',
        spokenBubble: '“TCP introduces head-of-line blocking on packet loss. UDP prioritizes live frames without stalling.”',
      },
      'assist': {
        label: 'Assist (Deep Dive)',
        pill: 'Head-of-Line Blocking & Congestion Control',
        answer: '<strong>TCP Head-of-Line Blocking:</strong> If packet #3 is dropped, packets #4-10 wait in receiver buffer until packet #3 is re-sent, creating noticeable video stutter.<br/><br/><strong>WebRTC (SRTP/SCTP over UDP):</strong> Drops non-critical intermediate frames, adapts bitrate dynamically with TWCC (Transport Wide Congestion Control), and uses Forward Error Correction (FEC) for seamless recovery.',
        spokenBubble: '“WebRTC uses TWCC congestion control and FEC to recover dropped packets without retransmission lag.”',
      },
      'followup': {
        label: 'Follow-up questions',
        pill: 'Follow-Up Inquiries',
        answer: '1. “Have you evaluated QUIC / HTTP/3 for multiplexed audio without TCP connection handshake overhead?”<br/>2. “What Forward Error Correction (FEC) redundancy ratio is currently configured for your video packets?”',
        spokenBubble: '“Have you evaluated QUIC for multiplexed streams without TCP handshake overhead?”',
      },
      'recap': {
        label: 'Recap',
        pill: 'Protocol Evaluation Summary',
        answer: '• <strong>Protocol Decision:</strong> UDP-based WebRTC selected for live sub-20ms screen mirroring.<br/>• <strong>Jitter Defense:</strong> Adaptive jitter buffer and FEC replace TCP retransmission queues.<br/>• <strong>Outcome:</strong> Glass-to-glass latency drops from 240ms to 18ms.',
        spokenBubble: '“In short: UDP eliminates head-of-line blocking and delivers true sub-20ms glass-to-glass latency.”',
      },
    },
  },
  {
    id: 'star-incident',
    label: 'STAR Behavioral: Production Incident',
    icon: '🔥',
    sessionTitle: 'Zoom Call • Director of Engineering Leadership Interview',
    documentName: 'Incident_PostMortem_SEV1_PaymentCluster.pdf',
    documentSize: '112 KB',
    interviewerQuestion: 'Tell me about a high-severity production outage you managed and how you handled stakeholder communication.',
    answers: {
      'what-to-say': {
        label: 'What should I say?',
        pill: 'What should I say?',
        answer: '“During Black Friday peak traffic, our payment cluster suffered thread starvation. I established a triage war room, isolated an unbounded retry leak in our analytics hook, injected rate-limiting backpressure, and restored full throughput in 8 minutes with zero dropped orders.”',
        spokenBubble: '“During Black Friday, our payment cluster experienced thread starvation. We resolved it in 8 minutes.”',
      },
      'assist': {
        label: 'Assist (Deep Dive)',
        pill: 'STAR Framework Breakdown',
        answer: '<strong>Situation:</strong> SEV-1 incident during $2.8M peak checkout hour with 504 gateway timeouts.<br/><strong>Task:</strong> Prevent transaction data loss and coordinate exec leadership updates.<br/><strong>Action:</strong> Ran thread dump, disabled synchronous analytics webhook via feature flag, activated circuit breakers.<br/><strong>Result:</strong> 100% transaction integrity, MTTR of 8m, and automated chaos drills implemented post-incident.',
        spokenBubble: '“We disabled the failing analytics webhook via feature flag, isolating the bottleneck immediately.”',
      },
      'followup': {
        label: 'Follow-up questions',
        pill: 'Follow-Up Behavioral Hooks',
        answer: '1. “Would you like to hear about the automated chaos engineering drills we instituted after this post-mortem?”<br/>2. “How does your team currently manage blameless post-mortem follow-ups across infrastructure and product squads?”',
        spokenBubble: '“Would you like to hear about the automated chaos engineering drills we implemented afterward?”',
      },
      'recap': {
        label: 'Recap',
        pill: 'Incident Leadership Summary',
        answer: '• <strong>Incident Impact:</strong> SEV-1 payment cluster recovered in 8 minutes with $0 revenue lost.<br/>• <strong>Root Cause:</strong> Unbounded retry loop in third-party analytics telemetry.<br/>• <strong>Long-term Fix:</strong> Enforced circuit breakers with 500ms hard timeouts across all external webhooks.',
        spokenBubble: '“To summarize: MTTR was 8 minutes with zero data loss, leading to systemic circuit breaker protections.”',
      },
    },
  },
]

type ActionKey = 'what-to-say' | 'assist' | 'followup' | 'recap'

export const InteractiveMeetingAssistantSimulator: React.FC = () => {
  const selectedScenarioIdx = 0
  const [activeAction, setActiveAction] = useState<ActionKey>('what-to-say')
  const [isHudHidden, setIsHudHidden] = useState<boolean>(false)
  const [activeSpeaker, setActiveSpeaker] = useState<'left' | 'right'>('left')
  const [customQuestion, setCustomQuestion] = useState<string>('')
  const [customAnswer, setCustomAnswer] = useState<string | null>(null)
  const [isThinking, setIsThinking] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const toastTimeoutRef = useRef<number | null>(null)

  const currentScenario = SCENARIOS[selectedScenarioIdx]
  const currentActionData = currentScenario.answers[activeAction]

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToastMessage(msg)
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 3000)
  }

  // Time-based speaker synchronization from the video
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const time = video.currentTime
      // When time < 4.2s, left speaker is talking; when time >= 4.2s, candidate is answering
      if (time < 4.2) {
        if (activeSpeaker !== 'left') setActiveSpeaker('left')
      } else {
        if (activeSpeaker !== 'right') setActiveSpeaker('right')
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [activeSpeaker])

  const handleActionClick = (action: ActionKey) => {
    setActiveAction(action)
    setCustomAnswer(null)
    setActiveSpeaker('right')
    showToast(`Copilot Mode: ${currentScenario.answers[action].label}`)
  }


  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customQuestion.trim()) return

    setIsThinking(true)
    showToast('AI Analyzing Screen & Audio...')

    setTimeout(() => {
      setIsThinking(false)
      const q = customQuestion.trim()
      setCustomAnswer(
        `“To answer: ‘${q}’ — In high-scale architectures, we isolate synchronous bottlenecks with asynchronous event streams and enforce bounded concurrency pools. This guarantees sub-20ms SLA latency and zero cascading failures.”`
      )
      setActiveSpeaker('right')
      setCustomQuestion('')
      showToast('Generated 1st-Person Talking Points')
    }, 600)
  }

  const toggleHudVisibility = () => {
    setIsHudHidden(!isHudHidden)
    showToast(!isHudHidden ? 'Copilot Folded to Compact Island' : 'Copilot HUD Expanded')
  }

  return (
    <div className="interactive-meet-simulator-wrap">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="simulator-toast-pill">
          <span className="toast-dot"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Floating Capsule Notch Island */}
      <div className="top-capsule-island">
        <div className="capsule-brand-icon">
          <span className="pulse-cyan-dot"></span>
        </div>
        <span className="capsule-brand-name">HELVIA COPILOT</span>
        <span className="capsule-stealth-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span>Hardware Display Capture Excluded (100% Invisible)</span>
        </span>
        <button 
          type="button" 
          className="capsule-hide-btn"
          onClick={toggleHudVisibility}
          title={isHudHidden ? 'Unfold HUD Window' : 'Fold HUD Window'}
        >
          <span>{isHudHidden ? '▼' : '▲'}</span>
          <span>{isHudHidden ? 'Show HUD' : 'Hide HUD'}</span>
        </button>
      </div>

      {/* Main Zoom Widescreen Video Meeting Window */}
      <div className="zoom-meeting-window">
        {/* Titlebar with Mac Traffic Lights */}
        <div className="zoom-titlebar">
          <div className="mac-traffic-lights">
            <span className="traffic-dot red"></span>
            <span className="traffic-dot yellow"></span>
            <span className="traffic-dot green"></span>
          </div>
          <div className="zoom-center-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#38bdf8" style={{ marginRight: 6 }}>
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="zoom-window-title">{currentScenario.sessionTitle}</span>
          </div>
          <div className="zoom-recording-tag">
            <span className="rec-dot"></span>
            <span>Rec (1080p)</span>
          </div>
        </div>

        {/* Video Grid with Live Meeting Stream and Floating HUD on Top */}
        <div className="zoom-video-grid">
          {/* Live Background Video Stream (Autoplay, Loop) */}
          <div className="zoom-video-background-wrapper">
            <video
              ref={videoRef}
              src="/meeting_video.mp4"
              poster="/video_clean_crop.jpg"
              autoPlay
              loop
              muted
              playsInline
              className="meeting-live-video-element"
            />
            <div className="video-vignette-overlay"></div>
          </div>

          {/* Left Speaker Overlay (Interviewer / Sarah J.) */}
          <div className={`zoom-participant-overlay left-overlay ${activeSpeaker === 'left' ? 'speaking-active' : ''}`}>
            {/* Live Audio Equalizer Wave Overlay */}
            <div className={`tile-live-wave-bars ${activeSpeaker === 'left' ? '' : 'hidden'}`}>
              <span></span><span></span><span></span><span></span><span></span>
            </div>

            {/* Real-Time Speech Subtitle Bubble */}
            <div className={`live-speech-subtitle-bubble left-bubble ${activeSpeaker === 'left' ? '' : 'hidden'}`}>
              <span className="sub-speaker">Sarah J. (Interviewer):</span>
              <span className="sub-text">“{currentScenario.interviewerQuestion}”</span>
            </div>

            {/* Bottom Left Participant Meta */}
            <div className="video-overlay-meta">
              <span className="speaking-dot-green"></span>
              <span className="participant-name">Sarah J. (Lead Interviewer)</span>
              <span className="video-mic-status">🎙️ Live Audio Ingest</span>
            </div>
          </div>

          {/* Right Speaker Overlay (Candidate / You - Copilot Assisted) */}
          <div className={`zoom-participant-overlay right-overlay ${activeSpeaker === 'right' ? 'speaking-active' : ''}`}>
            {/* Live Audio Equalizer Wave Overlay */}
            <div className={`tile-live-wave-bars ${activeSpeaker === 'right' ? '' : 'hidden'}`}>
              <span></span><span></span><span></span><span></span><span></span>
            </div>

            {/* Real-Time Speech Subtitle Bubble */}
            <div className={`live-speech-subtitle-bubble right-bubble ${activeSpeaker === 'right' ? '' : 'hidden'}`}>
              <span className="sub-speaker">You (Copilot Assisted):</span>
              <span className="sub-text">
                {customAnswer ? customAnswer : currentActionData.spokenBubble}
              </span>
            </div>

            {/* Bottom Right Participant Meta */}
            <div className="video-overlay-meta">
              <span className="speaking-dot-green"></span>
              <span className="participant-name">You (Copilot Assisted)</span>
              <span className="copilot-stealth-pill">🛡️ Display Excluded</span>
            </div>
          </div>

          {/* Floating AI Copilot HUD Window (On top of the video) */}
          <div 
            className="floating-copilot-card"
            style={{
              transform: isHudHidden
                ? 'translateX(-50%) translateY(32px) scale(0.92)'
                : 'translateX(-50%) translateY(0) scale(1)',
              opacity: isHudHidden ? 0 : 1,
              pointerEvents: isHudHidden ? 'none' : 'auto',
            }}
          >
            {/* App Glowing Top Gradient Bar */}
            <div className="copilot-app-top-glow"></div>

            {/* Copilot App Header Bar */}
            <div className="copilot-app-header-bar">
              <div className="app-header-left">
                <span className="pulse-cyan-dot"></span>
                <span className="copilot-app-name">HELVIA HUD</span>
                <span className="hotkey-pill-mini">Ctrl+Space</span>
              </div>
              <div className="app-header-right">
                <span className="copilot-question-pill">
                  {customAnswer ? 'Custom Prompt Answer' : currentActionData.pill}
                </span>
              </div>
            </div>

            {/* Main AI 1st-Person Spoken Answer Box */}
            <div className="copilot-answer-box">
              {isThinking ? (
                <div className="copilot-thinking-state">
                  <span className="thinking-spinner"></span>
                  <span>Synthesizing real-time talking points via local model...</span>
                </div>
              ) : customAnswer ? (
                <div className="answer-content">{customAnswer}</div>
              ) : (
                <div 
                  className="answer-content" 
                  dangerouslySetInnerHTML={{ __html: currentActionData.answer }}
                />
              )}
            </div>

            {/* Quick Action Buttons Row (Frosted Glass Chips) */}
            <div className="copilot-actions-row">
              <button
                type="button"
                className={`copilot-action-btn ${activeAction === 'what-to-say' && !customAnswer ? 'active' : ''}`}
                onClick={() => handleActionClick('what-to-say')}
                title="Generate 1st-Person Spoken Answer"
              >
                <span className="action-btn-icon">💬</span>
                <span className="action-btn-label">What should I say?</span>
              </button>

              <button
                type="button"
                className={`copilot-action-btn ${activeAction === 'assist' && !customAnswer ? 'active' : ''}`}
                onClick={() => handleActionClick('assist')}
                title="Technical Deep Dive Comparison"
              >
                <span className="action-btn-icon">💡</span>
                <span className="action-btn-label">Assist</span>
              </button>

              <button
                type="button"
                className={`copilot-action-btn ${activeAction === 'followup' && !customAnswer ? 'active' : ''}`}
                onClick={() => handleActionClick('followup')}
                title="Suggested Discovery Follow-Up Questions"
              >
                <span className="action-btn-icon">❓</span>
                <span className="action-btn-label">Follow-up questions</span>
              </button>

              <button
                type="button"
                className={`copilot-action-btn ${activeAction === 'recap' && !customAnswer ? 'active' : ''}`}
                onClick={() => handleActionClick('recap')}
                title="Generate Meeting Summary & Action Items"
              >
                <span className="action-btn-icon">📝</span>
                <span className="action-btn-label">Recap</span>
              </button>
            </div>

            {/* Grounded RAG Context Tag */}
            <div className="copilot-rag-grounding-tag">
              <span className="rag-icon">📄</span>
              <span>
                Grounded in: <strong>{currentScenario.documentName}</strong> ({currentScenario.documentSize})
              </span>
              <span className="rag-latency">⚡ 18ms Local Ollama</span>
            </div>

            {/* Bottom Interactive Ask Input Box */}
            <div className="copilot-input-container">
              <form className="copilot-input-form" onSubmit={handleCustomSubmit}>
                <input
                  type="text"
                  className="copilot-text-input"
                  placeholder="Ask about screen, code, or objection (max 360 words / 1800 chars)..."
                  value={customQuestion}
                  maxLength={1800}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  autoComplete="off"
                />
                <div className="copilot-input-controls">
                  <span className="copilot-model-chip" title="Max response limit: 360 words (1,800 characters)">
                    <span className="model-bolt">⚡</span>
                    <span>Max 360w / 1800c</span>
                  </span>
                  <button type="submit" className="copilot-send-btn" title="Send to Copilot">
                    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                      <path d="M4 2.5l9 5.5-9 5.5v-11z" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Zoom Control Bar */}
        <div className="zoom-bottom-controls">
          <div className="zoom-ctrl-group left">
            <button type="button" className="zoom-btn">
              <span className="btn-ic">👥</span>
              <span>Participants (2)</span>
            </button>
            <button 
              type="button" 
              className="zoom-btn"
              onClick={() => setActiveSpeaker(activeSpeaker === 'left' ? 'right' : 'left')}
            >
              <span className="btn-ic">🔄</span>
              <span>Switch Speaker</span>
            </button>
          </div>

          <div className="zoom-ctrl-group center">
            <span className="zoom-ghost-shield">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Display Privacy Shield: Hardware Capture Excluded (100% Invisible)</span>
            </span>
          </div>

          <div className="zoom-ctrl-group right">
            <button 
              type="button" 
              className="zoom-btn btn-end"
              onClick={() => showToast('Helvia Meeting Copilot remains active in system tray')}
            >
              End Call
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Feature Callouts Footer */}
      <div className="sim-footer-stats">
        <div className="sim-stat-card">
          <div className="stat-number">18 ms</div>
          <div className="stat-label">Local Audio Transcription &amp; Token Ingest</div>
        </div>
        <div className="sim-stat-card">
          <div className="stat-number">100%</div>
          <div className="stat-label">Invisible on Screenshares (Display Affinity)</div>
        </div>
        <div className="sim-stat-card">
          <div className="stat-number">0 KB/s</div>
          <div className="stat-label">Cloud Audio Transmission (100% Local GPU)</div>
        </div>
        <div className="sim-stat-card">
          <div className="stat-number">1st-Person</div>
          <div className="stat-label">Speech-Ready Natural Talking Points</div>
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'

interface AutoApplyRole {
  id: string
  company: string
  logo: string
  role: string
  location: string
  portal: string
  atsScore: number
  matchedKeywords: string[]
  tailoredSummary: string
  originalBullet: string
  tailoredBullet: string
  interviewDrill: {
    question: string
    difficulty: string
    aiFeedback: string
    score: number
  }
}

const ROLES: AutoApplyRole[] = [
  {
    id: 'stripe',
    company: 'Stripe',
    logo: '💳',
    role: 'Senior Infrastructure & Fullstack Engineer',
    location: 'Remote / US',
    portal: 'Greenhouse API',
    atsScore: 99,
    matchedKeywords: ['WebRTC', 'Distributed Transactions', 'Go / TypeScript', 'Low-Latency Systems', 'High Concurrency'],
    tailoredSummary: 'Dynamically reordered experience bullets to elevate high-throughput P2P streaming, idempotency keys, and sub-15ms packet telemetry.',
    originalBullet: 'Built real-time web applications with WebSockets and Node.js for external clients.',
    tailoredBullet: 'Architected distributed WebRTC peer-to-peer streaming engine handling 60 FPS video with sub-18ms latency, scaling to 150k concurrent sessions.',
    interviewDrill: {
      question: '“How do you design a distributed idempotency layer for payment webhooks to prevent duplicate charges during network timeouts?”',
      difficulty: 'Hard • System Architecture',
      aiFeedback: 'Superb depth on atomic Redis SETNX leases with UUID fencing keys and transactional outbox patterns. Scored high on disaster recovery.',
      score: 98,
    },
  },
  {
    id: 'cloudflare',
    company: 'Cloudflare',
    logo: '☁️',
    role: 'Staff Systems & Edge Infrastructure Engineer',
    location: 'Remote / Global',
    portal: 'Lever API',
    atsScore: 98,
    matchedKeywords: ['Rust / C++', 'Kernel IOCTL', 'eBPF Tracing', 'UDP Congestion Control', 'Edge Workers'],
    tailoredSummary: 'Emphasized zero-copy network hooks, high-throughput packet processing, and Windows display affinity.',
    originalBullet: 'Worked on backend APIs, database query tuning, and Docker deployment pipelines.',
    tailoredBullet: 'Engineered high-performance Windows display pipeline utilizing DXGI Desktop Duplication, reducing CPU overhead from 14% to 1.8%.',
    interviewDrill: {
      question: '“Explain how you would minimize packet jitter and packet loss recovery in a global edge UDP stream without head-of-line blocking.”',
      difficulty: 'Hard • Networking & Edge',
      aiFeedback: 'Accurately compared TCP retransmissions against TWCC adaptive bitrate and Forward Error Correction (FEC). Strong domain authority.',
      score: 97,
    },
  },
  {
    id: 'scaleai',
    company: 'Scale AI',
    logo: '🧠',
    role: 'Staff AI Systems & LLM Platform Architect',
    location: 'San Francisco, CA / Remote',
    portal: 'Greenhouse API',
    atsScore: 100,
    matchedKeywords: ['Local Quantization', 'Vector RAG', 'Ollama / vLLM', 'Sub-20ms Inference', 'Python / CUDA'],
    tailoredSummary: 'Highlighted on-device 8-bit quantized neural models, sub-18ms token ingest, and private offline RAG document grounding.',
    originalBullet: 'Integrated OpenAI APIs into existing customer support web portals.',
    tailoredBullet: 'Deployed quantized 8-bit neural speech inference models locally on RTX GPUs, cutting response latency from 850ms to 18ms with 0 KB/s cloud cost.',
    interviewDrill: {
      question: '“How do you benchmark and optimize memory bandwidth bottlenecking during multi-tenant LLM token generation?”',
      difficulty: 'Very Hard • AI Hardware Systems',
      aiFeedback: 'Excellent grasp of KV-cache compression, PagedAttention, and INT8 weight quantization. Demonstrates top-tier engineering maturity.',
      score: 99,
    },
  },
  {
    id: 'datadog',
    company: 'Datadog',
    logo: '🐶',
    role: 'Lead Distributed Systems & Observability SRE',
    location: 'New York, NY / Remote',
    portal: 'Workday Automated',
    atsScore: 98,
    matchedKeywords: ['Distributed Tracing', 'Raft Consensus', 'Kafka Pipelines', 'Zero Lost Telemetry', 'eBPF'],
    tailoredSummary: 'Focused on append-only commit logs, Raft quorum leader elections, and zero-loss telemetry under heavy network partition stress.',
    originalBullet: 'Monitored microservices using Prometheus and Grafana dashboards.',
    tailoredBullet: 'Implemented Raft quorum consensus and generation fencing tokens across 50+ cluster nodes, preventing split-brain writes during partitions.',
    interviewDrill: {
      question: '“Walk me through a production split-brain scenario you mitigated and how you verified transactional consistency.”',
      difficulty: 'Hard • SRE & Distributed Consensus',
      aiFeedback: 'Clear STAR storytelling with quantitative impact (8-minute resolution, $0 data loss). Addressed consensus edge cases effortlessly.',
      score: 96,
    },
  },
]

export const InteractiveAutoApplySimulator: React.FC = () => {
  const [selectedRoleIdx, setSelectedRoleIdx] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<'tailor' | 'interview' | 'pipeline'>('tailor')
  const [isApplying, setIsApplying] = useState<boolean>(false)
  const [applicationSuccess, setApplicationSuccess] = useState<boolean>(false)
  const [isPracticing, setIsPracticing] = useState<boolean>(false)
  const [customDrillResponse, setCustomDrillResponse] = useState<string>('')
  const [liveEvaluation, setLiveEvaluation] = useState<string | null>(null)

  const currentRole = ROLES[selectedRoleIdx]

  const handleApplySimulation = () => {
    setIsApplying(true)
    setApplicationSuccess(false)
    setTimeout(() => {
      setIsApplying(false)
      setApplicationSuccess(true)
      setTimeout(() => setApplicationSuccess(false), 5000)
    }, 1400)
  }

  const handleRunDrill = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customDrillResponse.trim()) return

    setIsPracticing(true)
    setTimeout(() => {
      setIsPracticing(false)
      setLiveEvaluation(
        `AI Interview Coach Score: 98/100 • "Strong technical precision on '${customDrillResponse.slice(0, 45)}...'. Effective architectural trade-off analysis and articulate delivery."`
      )
      setCustomDrillResponse('')
    }, 1000)
  }

  return (
    <div className="interactive-autoapply-simulator-wrap">
      {/* Target Company Selector Bar */}
      <div className="autoapply-target-bar">
        <div className="target-bar-label">
          <span className="live-pulse-badge gold">● ATS AUTOPILOT</span>
          <span>Select Target Enterprise Role:</span>
        </div>
        <div className="target-roles-chips">
          {ROLES.map((r, idx) => (
            <button
              key={r.id}
              type="button"
              className={`target-role-chip ${selectedRoleIdx === idx ? 'active' : ''}`}
              onClick={() => {
                setSelectedRoleIdx(idx)
                setLiveEvaluation(null)
              }}
            >
              <span className="role-chip-logo">{r.logo}</span>
              <div className="role-chip-text">
                <span className="role-chip-company">{r.company}</span>
                <span className="role-chip-title">{r.role}</span>
              </div>
              <span className="role-chip-ats">{r.atsScore}% ATS</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Simulator Window Frame */}
      <div className="autoapply-window-frame">
        {/* Titlebar with Mac Traffic Dots */}
        <div className="autoapply-titlebar">
          <div className="mac-traffic-lights">
            <span className="traffic-dot red"></span>
            <span className="traffic-dot yellow"></span>
            <span className="traffic-dot green"></span>
          </div>
          <div className="autoapply-center-title">
            <span>Helvia Career Autopilot • {currentRole.company} ({currentRole.role})</span>
          </div>
          <div className="autoapply-status-tag">
            <span className="status-dot-gold"></span>
            <span>{currentRole.portal} Active</span>
          </div>
        </div>

        {/* View Switcher Tabs (ATS Tailor, Mock Coach, Pipeline Logs) */}
        <div className="autoapply-mode-tabs">
          <button
            type="button"
            className={`mode-tab-btn ${activeTab === 'tailor' ? 'active' : ''}`}
            onClick={() => setActiveTab('tailor')}
          >
            <span>📄 Dynamic ATS Resume Tailor</span>
            <span className="tab-pill-metric">{currentRole.atsScore}% Match</span>
          </button>
          <button
            type="button"
            className={`mode-tab-btn ${activeTab === 'interview' ? 'active' : ''}`}
            onClick={() => setActiveTab('interview')}
          >
            <span>🎙️ AI Mock Interview Coach Drill</span>
            <span className="tab-pill-metric">Score: {currentRole.interviewDrill.score}</span>
          </button>
          <button
            type="button"
            className={`mode-tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('pipeline')}
          >
            <span>⚡ Automated Submissions Pipeline</span>
            <span className="tab-pill-metric">48 Applied Today</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="autoapply-main-body">
          {/* TAB 1: DYNAMIC ATS RESUME TAILOR */}
          {activeTab === 'tailor' && (
            <div className="tab-pane-tailor">
              <div className="ats-score-hero-row">
                <div className="score-dial-card">
                  <div className="dial-circle">
                    <span className="dial-number">{currentRole.atsScore}%</span>
                    <span className="dial-label">ATS MATCH</span>
                  </div>
                  <div className="dial-meta">
                    <h4>Keyword Optimization Complete</h4>
                    <p>Calculated against {currentRole.company} ATS semantic filter rubric.</p>
                  </div>
                </div>

                <div className="ats-matched-keywords-box">
                  <div className="keywords-header">
                    <span>✨ Injected Keywords from Job Description:</span>
                  </div>
                  <div className="keywords-pills">
                    {currentRole.matchedKeywords.map((kw, i) => (
                      <span key={i} className="keyword-chip">
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Before vs After Bullet Point Optimization */}
              <div className="resume-diff-box">
                <div className="diff-col before">
                  <div className="diff-header">
                    <span className="diff-badge gray">ORIGINAL GENERIC RESUME (62% ATS)</span>
                  </div>
                  <p className="diff-text">&ldquo;{currentRole.originalBullet}&rdquo;</p>
                  <span className="diff-critique">⚠️ Lacks high-impact domain keywords &amp; metric quantification.</span>
                </div>

                <div className="diff-arrow">➜</div>

                <div className="diff-col after">
                  <div className="diff-header">
                    <span className="diff-badge gold">HELVIA AUTONOMOUS TAILORED (99% ATS)</span>
                  </div>
                  <p className="diff-text highlighted">
                    &ldquo;{currentRole.tailoredBullet}&rdquo;
                  </p>
                  <span className="diff-critique good">✓ Aligned with {currentRole.matchedKeywords.slice(0, 3).join(', ')}.</span>
                </div>
              </div>

              {/* Action Banner */}
              <div className="tailor-action-bar">
                <button
                  type="button"
                  className={`btn-simulate-apply ${isApplying ? 'loading' : ''}`}
                  onClick={handleApplySimulation}
                  disabled={isApplying}
                >
                  {isApplying ? (
                    <>
                      <span className="thinking-spinner"></span>
                      <span>Submitting tailored application via {currentRole.portal}...</span>
                    </>
                  ) : applicationSuccess ? (
                    <>
                      <span>✓ Application Successfully Submitted!</span>
                    </>
                  ) : (
                    <>
                      <span>🚀 Simulate Fast Auto Apply to {currentRole.company}</span>
                    </>
                  )}
                </button>
                <span className="action-subtext">Zero manual form entry • Auto-fills Workday, Greenhouse &amp; Lever</span>
              </div>
            </div>
          )}

          {/* TAB 2: AI MOCK INTERVIEW COACH DRILL */}
          {activeTab === 'interview' && (
            <div className="tab-pane-interview">
              <div className="drill-question-card">
                <div className="drill-meta-top">
                  <span className="drill-company-pill">{currentRole.company} Interview Practice</span>
                  <span className="drill-difficulty-pill">{currentRole.interviewDrill.difficulty}</span>
                </div>
                <h3 className="drill-question-text">{currentRole.interviewDrill.question}</h3>
              </div>

              {/* Interactive Coach Feedback & Drill Simulator */}
              <div className="coach-evaluation-card">
                <div className="coach-eval-header">
                  <div className="coach-avatar">🤖</div>
                  <div>
                    <span className="coach-title">Helvia AI Interview Practicer</span>
                    <span className="coach-status">● Live Rubric Analysis</span>
                  </div>
                  <div className="coach-score-pill">
                    Score: <strong>{currentRole.interviewDrill.score} / 100</strong>
                  </div>
                </div>

                <div className="coach-feedback-body">
                  {liveEvaluation ? (
                    <div className="live-eval-text">{liveEvaluation}</div>
                  ) : (
                    <div className="default-eval-text">
                      <p><strong>AI Coach Rubric Evaluation:</strong></p>
                      <p>{currentRole.interviewDrill.aiFeedback}</p>
                    </div>
                  )}
                </div>

                {/* Interactive Practice Input Form */}
                <form className="coach-interactive-form" onSubmit={handleRunDrill}>
                  <input
                    type="text"
                    className="coach-input-field"
                    placeholder="Type your talking points or answer to test the AI Coach rubric..."
                    value={customDrillResponse}
                    onChange={(e) => setCustomDrillResponse(e.target.value)}
                  />
                  <button type="submit" className="coach-submit-btn" disabled={isPracticing}>
                    {isPracticing ? 'Scoring...' : 'Score Answer'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: AUTOMATED SUBMISSIONS PIPELINE LOGS */}
          {activeTab === 'pipeline' && (
            <div className="tab-pane-pipeline">
              <div className="pipeline-metrics-banner">
                <div className="pipe-metric">
                  <span className="pipe-val">312</span>
                  <span className="pipe-lbl">Total Applications</span>
                </div>
                <div className="pipe-metric">
                  <span className="pipe-val gold">48</span>
                  <span className="pipe-lbl">Submitted Today</span>
                </div>
                <div className="pipe-metric">
                  <span className="pipe-val green">98.4%</span>
                  <span className="pipe-lbl">Avg ATS Score</span>
                </div>
                <div className="pipe-metric">
                  <span className="pipe-val purple">14</span>
                  <span className="pipe-lbl">Interview Callbacks</span>
                </div>
              </div>

              <div className="pipeline-table-card">
                <div className="pipeline-table-row header">
                  <span>COMPANY &amp; ROLE</span>
                  <span>ATS MATCH</span>
                  <span>PORTAL</span>
                  <span>TIMESTAMP</span>
                  <span>STATUS</span>
                </div>
                {ROLES.map((r, i) => (
                  <div key={i} className="pipeline-table-row">
                    <span className="col-role">
                      <strong>{r.company}</strong> — {r.role}
                    </span>
                    <span className="col-ats">{r.atsScore}%</span>
                    <span className="col-portal">{r.portal}</span>
                    <span className="col-time">Just now</span>
                    <span className="col-status success">✓ Interview Requested</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Window Bottom Control Bar */}
        <div className="autoapply-bottom-bar">
          <div className="bottom-left-info">
            <span className="shield-ic">🛡️</span>
            <span>Anti-Bot Shield Active • Native Browser Footprint • Human Typing Emulation</span>
          </div>
          <div className="bottom-right-stats">
            <span>Engine: <strong>Helvia Autonomous Career Agent v3.4</strong></span>
          </div>
        </div>
      </div>

      {/* Simulator Footer Feature Stats */}
      <div className="sim-footer-stats">
        <div className="sim-stat-card">
          <div className="stat-number gold-num">98.4%</div>
          <div className="stat-label">Average Dynamic ATS Match Score</div>
        </div>
        <div className="sim-stat-card">
          <div className="stat-number gold-num">48 / day</div>
          <div className="stat-label">Autonomous Submissions across Portals</div>
        </div>
        <div className="sim-stat-card">
          <div className="stat-number gold-num">Zero</div>
          <div className="stat-label">Manual Form Filling or Repetitive Copy-Paste</div>
        </div>
        <div className="sim-stat-card">
          <div className="stat-number gold-num">100%</div>
          <div className="stat-label">Mock Interview Drill Preparation Readiness</div>
        </div>
      </div>
    </div>
  )
}

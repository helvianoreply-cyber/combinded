import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SkyCanvas3D } from './SkyCanvas3D'
import { Interactive3DDesktopSimulator } from './Interactive3DDesktopSimulator'

interface LandingPageProps {
  signInWithGoogle: () => Promise<void>
  isSupabaseConfigured: boolean
  isAuthLoading: boolean
}

// Icon Components
const MonitorIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="8" y1="21" x2="16" y2="21"></line>
    <line x1="12" y1="17" x2="12" y2="21"></line>
  </svg>
)

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
)

const ZapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
)

const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
)

const ServerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
    <line x1="6" y1="6" x2="6.01" y2="6"></line>
    <line x1="6" y1="18" x2="6.01" y2="18"></line>
  </svg>
)

const GlobeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
)

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
)

const AwardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7"></circle>
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
  </svg>
)




const BriefcaseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </svg>
)

const HeartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
)

const CpuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
    <rect x="9" y="9" width="6" height="6"></rect>
    <line x1="9" y1="1" x2="9" y2="4"></line>
    <line x1="15" y1="1" x2="15" y2="4"></line>
    <line x1="9" y1="20" x2="9" y2="23"></line>
    <line x1="15" y1="20" x2="15" y2="23"></line>
    <line x1="20" y1="9" x2="23" y2="9"></line>
    <line x1="20" y1="14" x2="23" y2="14"></line>
    <line x1="1" y1="9" x2="4" y2="9"></line>
    <line x1="1" y1="14" x2="4" y2="14"></line>
  </svg>
)

const EyeOffIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
)

const SmartphoneIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
    <line x1="12" y1="18" x2="12.01" y2="18"></line>
  </svg>
)

const TerminalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5"></polyline>
    <line x1="12" y1="19" x2="20" y2="19"></line>
  </svg>
)

const SparklesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"></path>
  </svg>
)

const QrCodeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
)

export const LandingPage: React.FC<LandingPageProps> = ({
  signInWithGoogle,
  isSupabaseConfigured,
  isAuthLoading,
}) => {
  const navigate = useNavigate()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [quickConnectCode, setQuickConnectCode] = useState('')
  const [activeControllerTab, setActiveControllerTab] = useState<'mobile' | 'desktop'>('mobile')
  const [activeAiTab, setActiveAiTab] = useState<'code' | 'logic' | 'diagrams'>('code')

  // 3D Morning to Night Sky Engine State
  const [scrollProgress, setScrollProgress] = useState(0)

  const skyTheme = scrollProgress < 0.4 ? 'morning' : scrollProgress < 0.72 ? 'sunset' : 'night'

  useEffect(() => {
    document.documentElement.setAttribute('data-sky-theme', skyTheme)
    return () => {
      document.documentElement.removeAttribute('data-sky-theme')
    }
  }, [skyTheme])

  const handleQuickConnect = (e: React.FormEvent) => {
    e.preventDefault()
    if (quickConnectCode.trim()) {
      navigate(`/connect?code=${encodeURIComponent(quickConnectCode.trim())}`)
    } else {
      signInWithGoogle()
    }
  }

  // Track scroll position across document
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight
      if (totalScroll > 0) {
        const progress = Math.max(0, Math.min(1, window.scrollY / totalScroll))
        setScrollProgress(progress)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.01, rootMargin: '0px 0px 120px 0px' }
    )

    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
    revealElements.forEach((el) => observerRef.current?.observe(el))

    return () => observerRef.current?.disconnect()
  }, [])

  return (
    <>
      {/* 3D Morning to Night Dynamic Sky Canvas */}
      <SkyCanvas3D scrollProgress={scrollProgress} />

      {/* Hero Section - Peaceful Evening Sky UI */}
      <section className="hero-peaceful-section reveal">
        <div className="hero-peaceful-content">
          <div className="peace-eyebrow-pill">
            <span className="eyebrow-dot"></span>
            <span>WINDOWS KERNEL DRIVER</span>
            <span className="eyebrow-divider">•</span>
            <span>60 FPS P2P WEBRTC</span>
            <span className="eyebrow-divider">•</span>
            <span className="eyebrow-highlight">UNDETECTABLE HOST</span>
          </div>

          <h1 className="hero-peace-heading">
            Stealth Remote Desktop &amp; AI Copilot — <span className="serif-highlight">with Pure Peace.</span>
          </h1>

          <p className="hero-peace-subtitle">
            Helvia Remote: Stealth zero-install remote desktop platform and AI co-pilot. Direct encrypted P2P connections, hardware-level input control, and context-aware AI screen answers ("Ans 💡").
          </p>

          {/* Quick Access Code Input Bar */}
          <form className="hero-quick-connect-bar" onSubmit={handleQuickConnect}>
            <input 
              type="text" 
              placeholder="Enter your 6-digit access code (e.g. 942-817)..." 
              value={quickConnectCode}
              onChange={(e) => setQuickConnectCode(e.target.value)}
              className="quick-connect-input"
            />
            <button type="submit" className="quick-connect-btn">
              <span>Connect Instantly</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </form>
        </div>

        {/* Interactive 3D Live Simulation - Full Width White Container */}
        <div className="hero-simulator-wrapper-container">
          <Interactive3DDesktopSimulator />
        </div>

        <div className="hero-peaceful-content">
          {/* Trusted Companies Banner */}
          <div className="trusted-companies-row">
            <p className="trusted-title">TRUSTED BY DEVELOPERS, SYSADMINS &amp; REMOTE PROFESSIONALS</p>
            <div className="company-pills-list">
              <span className="company-pill">DATALAYER</span>
              <span className="company-pill">SCALEFLOW</span>
              <span className="company-pill active-pill">SYNAPSE AI</span>
              <span className="company-pill">NEXUS LABS</span>
              <span className="company-pill">HYPERGRID</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architecture Pillars */}
      <section className="pillars-section reveal" id="features">
        <div className="section-header-center">
          <p className="eyebrow">THE ARCHITECTURE</p>
          <h2>Engineered for Stealth, Speed &amp; Intelligent Autopilot</h2>
          <p className="muted">How Helvia Remote delivers instantaneous, undetectable desktop access from anywhere.</p>
        </div>

        <div className="grid four-pillars-grid">
          <div className="panel reveal stagger-1">
            <div className="panel-icon blue-gradient">
              <EyeOffIcon />
            </div>
            <h2>Stealth Desktop Host</h2>
            <p className="muted">
              Runs with screen-capture protection and background throttling bypass. Whisper-quiet background execution with zero capture flags.
            </p>
            <ul className="pillar-checklist">
              <li><CheckIcon /> Low-level Windows API hooks</li>
              <li><CheckIcon /> Background throttling bypass</li>
              <li><CheckIcon /> Hardware input injection</li>
            </ul>
          </div>

          <div className="panel reveal stagger-2">
            <div className="panel-icon purple-gradient">
              <SmartphoneIcon />
            </div>
            <h2>Zero-Install Web Controllers</h2>
            <p className="muted">
              Control your PC from any smartphone, tablet, or browser with pure web links. No app installations or plugin downloads needed.
            </p>
            <ul className="pillar-checklist">
              <li><CheckIcon /> Mobile Touchpad &amp; Lock Mode (🔒)</li>
              <li><CheckIcon /> Desktop 60fps mouse tracking</li>
              <li><CheckIcon /> Instant QR code / 6-digit link</li>
            </ul>
          </div>

          <div className="panel reveal stagger-3">
            <div className="panel-icon gold-gradient">
              <SparklesIcon />
            </div>
            <h2>AI Screen Analysis ("Ans 💡")</h2>
            <p className="muted">
              Built-in intelligent 3-way auto-routing engine that analyzes code, complex math logic, and system diagrams in real time.
            </p>
            <ul className="pillar-checklist">
              <li><CheckIcon /> Deep reasoning for math &amp; logic</li>
              <li><CheckIcon /> Strict code signature preservation</li>
              <li><CheckIcon /> Clean, privacy-first output</li>
            </ul>
          </div>

          <div className="panel reveal stagger-4">
            <div className="panel-icon green-gradient">
              <ShieldIcon />
            </div>
            <h2>Encrypted P2P WebRTC</h2>
            <p className="muted">
              Direct peer-to-peer data channels keep latency under 30ms while end-to-end AES-256 encryption guarantees total privacy.
            </p>
            <ul className="pillar-checklist">
              <li><CheckIcon /> Direct encrypted P2P tunnel</li>
              <li><CheckIcon /> Cryptographic token authentication</li>
              <li><CheckIcon /> Anti-tampering plan verification</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive 1: Stealth Desktop Host */}
      <section className="feature-deep-section reveal" id="host">
        <div className="feature-deep-container">
          <div className="feature-deep-text reveal-left">
            <div className="badge-tag host-badge">
              <CpuIcon />
              <span>THE DESKTOP HOST (WINDOWS PC)</span>
            </div>
            <h2>Invisible Execution with Low-Level Hardware Input Injection</h2>
            <p className="feature-lead">
              The Helvia Electron desktop host is crafted to provide deep system control without interfering with foreground tasks or triggering capture flags.
            </p>

            <div className="feature-points-list">
              <div className="feature-point-item stagger-1">
                <div className="point-icon"><EyeOffIcon /></div>
                <div>
                  <h3>Undetectable &amp; Stealth Operation</h3>
                  <p>Engineered with hardware screen-capture protection and background throttling bypass. It runs quietly in the background without lag or UI footprint.</p>
                </div>
              </div>

              <div className="feature-point-item stagger-2">
                <div className="point-icon"><QrCodeIcon /></div>
                <div>
                  <h3>Instant 6-Digit &amp; QR Code Pairing</h3>
                  <p>Generates a private 6-digit session pin and a high-speed QR code. Scan on your phone or share the link with yourself to connect in 1 second.</p>
                </div>
              </div>

              <div className="feature-point-item stagger-3">
                <div className="point-icon"><TerminalIcon /></div>
                <div>
                  <h3>Native Windows API Hardware Input Hooks</h3>
                  <p>Uses low-level Windows API hooks (C#/PowerShell + RobotJS) for true global mouse clicks, smooth drags, precision scrolling, and hardware keystrokes across all admin windows.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="feature-deep-visual reveal-right">
            <div className="code-architecture-card">
              <div className="card-top">
                <span className="dot-mini red" />
                <span className="dot-mini yellow" />
                <span className="dot-mini green" />
                <span className="top-title">Host Architecture • Windows API Driver</span>
              </div>
              <div className="card-body-mono">
                <p className="comment">// Windows Low-Level Input Injection Layer</p>
                <p><span className="kwd">const</span> InputDriver = <span className="fn">require</span>(<span className="str">'./native/win32-driver'</span>);</p>
                <p><span className="kwd">const</span> PeerStream = <span className="fn">initP2PWebRTC</span>(&#123; fps: <span className="num">60</span>, hwAccel: <span className="bool">true</span> &#125;);</p>
                <p className="spacer"></p>
                <p className="comment">// Stealth Throttle &amp; Capture Protection</p>
                <p>InputDriver.<span className="fn">setCaptureBypass</span>(<span className="bool">true</span>);</p>
                <p>InputDriver.<span className="fn">injectGlobalKeystroke</span>(hardwareScanCode);</p>
                <p className="spacer"></p>
                <div className="status-pill-row">
                  <span className="status-item-pill active">✓ Screen Capture Protected</span>
                  <span className="status-item-pill active">✓ Throttling Bypassed</span>
                  <span className="status-item-pill active">✓ 60 FPS Direct Hook</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive 2: Dual-Experience Web Controllers */}
      <section className="feature-deep-section alt-bg reveal" id="controllers">
        <div className="section-header-center">
          <p className="eyebrow">ZERO-INSTALL ACCESS</p>
          <h2>Dual-Experience Web Controllers</h2>
          <p className="muted">Specialized, device-tailored interfaces accessible right inside Safari, Chrome, Edge, or Firefox.</p>
          
          <div className="controller-tabs-nav">
            <button 
              className={`controller-tab-btn ${activeControllerTab === 'mobile' ? 'active' : ''}`}
              onClick={() => setActiveControllerTab('mobile')}
            >
              <SmartphoneIcon /> Mobile Controller (`/m/`)
            </button>
            <button 
              className={`controller-tab-btn ${activeControllerTab === 'desktop' ? 'active' : ''}`}
              onClick={() => setActiveControllerTab('desktop')}
            >
              <MonitorIcon /> Desktop Controller (`/d/`)
            </button>
          </div>
        </div>

        {activeControllerTab === 'mobile' ? (
          <div className="controller-detail-grid reveal-scale">
            <div className="controller-detail-card">
              <div className="badge-tag blue-badge">📱 Mobile &amp; Tablet (`/m/`)</div>
              <h3>Touch-Optimized Trackpad &amp; Live Gestures</h3>
              <p className="muted">
                Transform any smartphone or tablet into a fluid, lag-free remote trackpad with high-precision virtual touch control.
              </p>

              <div className="feature-sub-list">
                <div className="sub-item">
                  <strong>Drag, Pan &amp; Precision Scroll:</strong> Smooth 1:1 multi-touch gesture translation directly mapped to Windows mouse coordinates.
                </div>
                <div className="sub-item">
                  <strong>Lock / Fix Mode (`🔒`):</strong> Locks the viewport to 100% full screen, disabling accidental swipe-backs, pinch zooms, or disconnections during critical tasks.
                </div>
                <div className="sub-item">
                  <strong>Mobile Text Interruption:</strong> Paste entire code blocks or text directly into the desktop with an instant <strong>Stop Typing</strong> emergency kill switch.
                </div>
                <div className="sub-item">
                  <strong>One-Tap "Ans 💡" Trigger:</strong> Instant button on your thumb to analyze on-screen problems without leaving the trackpad.
                </div>
              </div>
            </div>

            <div className="controller-detail-mockup">
              <div className="mobile-touchpad-mockup">
                <div className="mobile-mockup-header">
                  <span className="live-dot" /> Connected: Desktop-PRO-Win11
                  <span className="lock-indicator">🔒 LOCK ON</span>
                </div>
                <div className="virtual-trackpad">
                  <div className="trackpad-crosshair"></div>
                  <p className="trackpad-hint">Touchpad Active • 60 FPS Direct Pan</p>
                </div>
                <div className="mobile-mockup-bar">
                  <button className="m-btn m-ans">Ans 💡</button>
                  <button className="m-btn">Scroll ↕</button>
                  <button className="m-btn">Type ⌨</button>
                  <button className="m-btn m-stop">Stop Typing ⏹</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="controller-detail-grid reveal-scale">
            <div className="controller-detail-card">
              <div className="badge-tag purple-badge">💻 Desktop-to-Desktop (`/d/`)</div>
              <h3>AnyDesk-Grade Control in Any Web Browser</h3>
              <p className="muted">
                Access your full workstation from any secondary laptop or desktop browser without downloading third-party software.
              </p>

              <div className="feature-sub-list">
                <div className="sub-item">
                  <strong>Physical Mouse Tracking (~60fps):</strong> Direct physical cursor capture with smooth left, right, and middle-wheel click emulation.
                </div>
                <div className="sub-item">
                  <strong>Hardware Shortcut Forwarding:</strong> Full forwarding of OS shortcuts including Ctrl+C, Ctrl+V, Tab, Alt+Tab, and function keys directly into host apps.
                </div>
                <div className="sub-item">
                  <strong>Zero Edge-Cutting Fit:</strong> Custom aspect-ratio scaling ensures the entire taskbar, window title bars, and status icons are completely visible without cutoff.
                </div>
                <div className="sub-item">
                  <strong>Dual Monitor Support:</strong> Switch between multi-monitor setups instantly with a keyboard hotkey.
                </div>
              </div>
            </div>

            <div className="controller-detail-mockup">
              <div className="desktop-browser-mockup">
                <div className="browser-tab-bar">
                  <span className="tab-pill active">Helvia Remote • 1080p @ 60fps</span>
                  <span className="tab-stats">P2P Encrypted • 18ms</span>
                </div>
                <div className="browser-stream-body">
                  <div className="mock-taskbar">
                    <div className="taskbar-icons">
                      <span className="tb-icon win" />
                      <span className="tb-icon vs" />
                      <span className="tb-icon term" />
                      <span className="tb-icon chrome" />
                    </div>
                    <span className="tb-time">10:59 AM</span>
                  </div>
                  <div className="stream-badge-overlay">Zero Edge Cut: 100% Frame Visibility</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Feature Deep Dive 3: AI Screen Analysis Engine ("Ans 💡") */}
      <section className="feature-deep-section reveal" id="ai-copilot">
        <div className="section-header-center">
          <p className="eyebrow">INTELLIGENT SCREEN AUTOPILOT</p>
          <h2>The AI Screen Analysis Engine ("Ans 💡")</h2>
          <p className="muted">
            Intelligent 3-Way Auto-Routing analyzes whatever is on your desktop and delivers precise, production-ready solutions in seconds.
          </p>

          <div className="ai-tabs-nav">
            <button 
              className={`ai-tab-btn ${activeAiTab === 'code' ? 'active' : ''}`}
              onClick={() => setActiveAiTab('code')}
            >
              💻 Code &amp; Method Preservation
            </button>
            <button 
              className={`ai-tab-btn ${activeAiTab === 'logic' ? 'active' : ''}`}
              onClick={() => setActiveAiTab('logic')}
            >
              🧠 Complex Logic &amp; Calculations
            </button>
            <button 
              className={`ai-tab-btn ${activeAiTab === 'diagrams' ? 'active' : ''}`}
              onClick={() => setActiveAiTab('diagrams')}
            >
              📊 System Diagrams &amp; Text
            </button>
          </div>
        </div>

        <div className="ai-routing-showcase reveal-scale">
          {activeAiTab === 'code' && (
            <div className="ai-route-card">
              <div className="ai-card-header">
                <span className="route-badge code">Specialized Code Model</span>
                <h4>Code Architecture, Debugging &amp; Scripting</h4>
              </div>
              <p className="ai-route-desc">
                Writes clean, working code that <strong>strictly preserves existing class names, method signatures, parameters, and variable naming conventions</strong> so it seamlessly drops into your IDE without refactoring breaks.
              </p>
              <div className="ai-code-diff">
                <div className="diff-header">// Output: Auto-Preserved Method Signature</div>
                <pre><code>{`// Existing Signature Preserved:
public async Task<ServiceResult<TokenResponse>> ValidateAuthSession(
    string token, 
    Guid userId, 
    CancellationToken ct = default) 
{
    // High-speed, bug-free implementation generated in ~1.2s
    if (string.IsNullOrWhiteSpace(token)) return ServiceResult.Fail("Invalid token");
    return await _tokenService.VerifyCryptographicHashAsync(token, userId, ct);
}`}</code></pre>
              </div>
            </div>
          )}

          {activeAiTab === 'logic' && (
            <div className="ai-route-card">
              <div className="ai-card-header">
                <span className="route-badge logic">Deep Reasoning Engine</span>
                <h4>Complex Logic, Math &amp; Algorithmic Solutions</h4>
              </div>
              <p className="ai-route-desc">
                Routed to deep reasoning models for multi-step chain-of-thought calculation (<strong>~98% accuracy</strong>). Delivers direct, definitive solutions with a concise 1-sentence explanation without clutter.
              </p>
              <div className="ai-logic-box">
                <div className="logic-solution">
                  <span className="logic-check">✓ Calculated Solution:</span>
                  <p className="logic-value">O(N log K) time complexity with Min-Heap state maintenance</p>
                  <p className="logic-explanation"><strong>Explanation:</strong> Processing K elements via priority queue ensures logarithmic insertion per stream element while bounding auxiliary memory to O(K).</p>
                </div>
              </div>
            </div>
          )}

          {activeAiTab === 'diagrams' && (
            <div className="ai-route-card">
              <div className="ai-card-header">
                <span className="route-badge diagrams">Visual &amp; Text Engine</span>
                <h4>Technical Diagrams, UI Analysis &amp; Documentation</h4>
              </div>
              <p className="ai-route-desc">
                Provides concise 2-3 sentence factual summaries, error trace decodings, and architectural insights directly on your controller screen.
              </p>
              <div className="ai-diagram-summary">
                <div className="summary-pill">
                  <strong>Diagnosis:</strong> Port 5432 connection timeout caused by local firewall rule blocking Docker internal subnet.
                </div>
                <div className="summary-pill">
                  <strong>Recommended Action:</strong> Execute <code>netsh advfirewall firewall add rule</code> or verify Docker daemon network binding.
                </div>
              </div>
            </div>
          )}

          <div className="ai-privacy-banner">
            <ShieldIcon />
            <div>
              <strong>Privacy First Architecture:</strong> Zero mention of third-party AI provider names or models on customer controller screens. Pure, uncluttered output.
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive 4: Security & Monetization Architecture */}
      <section className="feature-deep-section alt-bg reveal" id="security">
        <div className="section-header-center">
          <p className="eyebrow">ENTERPRISE-GRADE INTEGRITY</p>
          <h2>Security &amp; Abuse Protection Architecture</h2>
          <p className="muted">Bulletproof server-side verification, cryptographic anti-tampering, and ultra-efficient P2P WebRTC.</p>
        </div>

        <div className="grid architecture-grid">
          <div className="panel reveal stagger-1">
            <div className="panel-icon blue-gradient"><LockIcon /></div>
            <h2>Cryptographic Anti-Tampering</h2>
            <p className="muted">
              Session tokens are verified cryptographically server-side against Supabase. Users cannot unlock Pro features by editing client URLs or payload parameters.
            </p>
          </div>

          <div className="panel reveal stagger-2">
            <div className="panel-icon purple-gradient"><ShieldIcon /></div>
            <h2>Plan Enforcement &amp; Quotas</h2>
            <p className="muted">
              Trial accounts receive basic remote control. Pro accounts unlock the "Ans 💡" AI engine, unrestricted multi-device pairings, and priority routing.
            </p>
          </div>

          <div className="panel reveal stagger-3">
            <div className="panel-icon gold-gradient"><ServerIcon /></div>
            <h2>Abuse &amp; Budget Shield</h2>
            <p className="muted">
              4-second intelligent cooldowns and daily query caps prevent spam. Disposable email blockers and mid-session timers automatically enforce expiration.
            </p>
          </div>

          <div className="panel reveal stagger-4">
            <div className="panel-icon green-gradient"><ZapIcon /></div>
            <h2>Ultra-Efficient P2P WebRTC</h2>
            <p className="muted">
              Video, audio, and inputs stream directly peer-to-peer (P2P). This guarantees sub-30ms latency while keeping operational server costs negligible.
            </p>
          </div>
        </div>
      </section>

      {/* Target Market / Who is this App For */}
      <section className="target-market-section reveal" id="target-market">
        <div className="section-header-center">
          <p className="eyebrow">WHO IS THIS APP FOR?</p>
          <h2>Built for Power Users, Developers &amp; Remote Professionals</h2>
          <p className="muted">From stealth workstation co-piloting to emergency on-the-go desktop access.</p>
        </div>

        <div className="grid three-col-grid">
          <div className="target-card reveal stagger-1">
            <div className="target-icon"><TerminalIcon /></div>
            <h3>Software Engineers &amp; Developers</h3>
            <p className="muted">
              Stealth remote co-piloting with low-level Windows hardware hooks, IDE navigation, and instant AI problem solving with method signature preservation.
            </p>
          </div>

          <div className="target-card reveal stagger-2">
            <div className="target-icon"><ServerIcon /></div>
            <h3>System Administrators &amp; IT Pros</h3>
            <p className="muted">
              Access remote servers and workstations from your phone with native keyboard shortcuts, administrative window control, and automated screen diagnostics.
            </p>
          </div>

          <div className="target-card reveal stagger-3">
            <div className="target-icon"><GlobeIcon /></div>
            <h3>Emergency Remote Desktop Access</h3>
            <p className="muted">
              Access your home or office computer from any smartphone, tablet, or public browser without having to install bulky client applications.
            </p>
          </div>
        </div>
      </section>

      {/* Step-by-Step: How It Works */}
      <section className="how reveal" id="how-it-works">
        <div className="how-copy reveal-left">
          <p className="eyebrow">INSTANT SETUP</p>
          <h2>Up and Running in 30 Seconds</h2>
          <p className="muted">
            Zero network configuration, no port forwarding, and no complex firewall rules. Just launch the host and scan.
          </p>

          <div className="how-steps">
            <div className="how-step stagger-1">
              <span className="how-step-number">01</span>
              <div>
                <p className="how-step-title">Launch Stealth Host on Windows PC</p>
                <p className="how-step-text">Run the lightweight desktop host. It starts invisibly in the background with screen-capture protection enabled.</p>
              </div>
            </div>

            <div className="how-step stagger-2">
              <span className="how-step-number">02</span>
              <div>
                <p className="how-step-title">Scan QR or Enter 6-Digit Link Code</p>
                <p className="how-step-text">Open the browser on your phone, tablet, or secondary laptop and scan the secure QR code or enter your 6-digit PIN.</p>
              </div>
            </div>

            <div className="how-step stagger-3">
              <span className="how-step-number">03</span>
              <div>
                <p className="how-step-title">Control with Hardware Precision (60 FPS)</p>
                <p className="how-step-text">Enjoy sub-30ms low latency mouse tracking, touchpad gestures, shortcut forwarding, and full-screen lock mode.</p>
              </div>
            </div>

            <div className="how-step stagger-4">
              <span className="how-step-number">04</span>
              <div>
                <p className="how-step-title">Trigger "Ans 💡" AI Copilot Anytime</p>
                <p className="how-step-text">Tap the Ans button on your phone or controller to instantly analyze on-screen code, math formulas, and system errors.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="how-visual reveal-right">
          <div className="hero-card metrics-only">
            <div className="hero-metrics">
              <div className="metric-row">
                <p className="metric-label">Connection Protocol</p>
                <p className="metric-value">P2P WebRTC Direct</p>
              </div>
              <div className="metric-row">
                <p className="metric-label">Security Encryption</p>
                <p className="metric-value">AES-256 E2EE</p>
              </div>
              <div className="metric-row">
                <p className="metric-label">Frame Rate &amp; Latency</p>
                <p className="metric-value">60 FPS (&lt; 30ms)</p>
              </div>
              <div className="metric-row">
                <p className="metric-label">Controller Installation</p>
                <p className="metric-value">0 MB (Pure Web)</p>
              </div>
              <div className="metric-row">
                <p className="metric-label">Stealth Protection</p>
                <p className="metric-value">Hardware Level</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Matrix */}
      <section className="comparison-section reveal" id="comparison">
        <div className="section-header-center">
          <p className="eyebrow">HOW WE COMPARE</p>
          <h2>Helvia Remote vs Legacy Remote Software</h2>
          <p className="muted">Why modern power users and professionals are switching to Helvia.</p>
        </div>

        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature Capability</th>
                <th className="highlight-col">Helvia Remote</th>
                <th>AnyDesk</th>
                <th>TeamViewer</th>
                <th>Chrome Remote</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Zero-Install Controller (Web Link/QR)</strong></td>
                <td className="highlight-col"><CheckIcon /> Pure Web (/m/ &amp; /d/)</td>
                <td>❌ Requires App</td>
                <td>❌ Requires App</td>
                <td>⚠️ Requires Chrome ext</td>
              </tr>
              <tr>
                <td><strong>Undetectable &amp; Stealth Background Host</strong></td>
                <td className="highlight-col"><CheckIcon /> Yes (Hardware hook)</td>
                <td>❌ Visible tray/banner</td>
                <td>❌ Popups &amp; Watermarks</td>
                <td>❌ OS notification bar</td>
              </tr>
              <tr>
                <td><strong>AI Screen Analysis ("Ans 💡") Engine</strong></td>
                <td className="highlight-col"><CheckIcon /> Built-in 3-Way Routing</td>
                <td>❌ None</td>
                <td>❌ None</td>
                <td>❌ None</td>
              </tr>
              <tr>
                <td><strong>Mobile Touchpad Lock Mode (🔒)</strong></td>
                <td className="highlight-col"><CheckIcon /> Yes (Zero zoom/disconnect)</td>
                <td>❌ No</td>
                <td>❌ No</td>
                <td>❌ No</td>
              </tr>
              <tr>
                <td><strong>Mobile Text Paste with Emergency Kill-Switch</strong></td>
                <td className="highlight-col"><CheckIcon /> Yes (Stop Typing ⏹)</td>
                <td>❌ Standard paste only</td>
                <td>❌ Standard paste only</td>
                <td>❌ Standard paste only</td>
              </tr>
              <tr>
                <td><strong>Direct P2P WebRTC (~60 FPS, &lt;30ms)</strong></td>
                <td className="highlight-col"><CheckIcon /> Yes</td>
                <td>⚠️ Varies with relays</td>
                <td>⚠️ Varies with relays</td>
                <td>⚠️ Google relay bound</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section reveal">
        <div className="stats-grid">
          <div className="stat-item stagger-1">
            <div className="stat-icon"><UsersIcon /></div>
            <p className="stat-number">10,000+</p>
            <p className="stat-label">Active Users</p>
          </div>
          <div className="stat-item stagger-2">
            <div className="stat-icon"><GlobeIcon /></div>
            <p className="stat-number">50+</p>
            <p className="stat-label">Countries</p>
          </div>
          <div className="stat-item stagger-3">
            <div className="stat-icon"><ServerIcon /></div>
            <p className="stat-number">99.9%</p>
            <p className="stat-label">Uptime</p>
          </div>
          <div className="stat-item stagger-4">
            <div className="stat-icon"><AwardIcon /></div>
            <p className="stat-number">4.9/5</p>
            <p className="stat-label">User Rating</p>
          </div>
        </div>
      </section>

      {/* Testimonials Marquee */}
      <section className="marquee-section reveal">
        <div className="marquee-header">
          <h2>Loved by Developers, Sysadmins &amp; Power Users</h2>
          <p className="muted">See how professionals rely on Helvia Remote every single day</p>
        </div>
        
        {/* Row 1 */}
        <div className="marquee-row">
          <div className="marquee-track">
            <div className="marquee-card job-card">
              <div className="marquee-badge job">
                <BriefcaseIcon />
                <span>Productivity Boost</span>
              </div>
              <p className="marquee-text">"The zero-install mobile controller is phenomenal. I can fix server scripts from my phone while in transit with zero friction."</p>
              <p className="marquee-author">Amit Kumar</p>
              <p className="marquee-role">Software Engineer</p>
            </div>
            <div className="marquee-card job-card">
              <div className="marquee-badge job">
                <BriefcaseIcon />
                <span>Stealth &amp; Smooth</span>
              </div>
              <p className="marquee-text">"Helvia's screen analysis button 'Ans 💡' helped me diagnose tricky backend concurrency issues right from my tablet."</p>
              <p className="marquee-author">Sneha Gupta</p>
              <p className="marquee-role">Lead Backend Architect</p>
            </div>
            <div className="marquee-card job-card">
              <div className="marquee-badge job">
                <BriefcaseIcon />
                <span>AnyDesk Killer</span>
              </div>
              <p className="marquee-text">"Replaced TeamViewer and AnyDesk. Zero edge cutting and native 60fps mouse control right in a browser tab."</p>
              <p className="marquee-author">Vikram Rao</p>
              <p className="marquee-role">Full Stack Developer</p>
            </div>
            {/* Loop duplicates */}
            <div className="marquee-card job-card">
              <div className="marquee-badge job">
                <BriefcaseIcon />
                <span>Productivity Boost</span>
              </div>
              <p className="marquee-text">"The zero-install mobile controller is phenomenal. I can fix server scripts from my phone while in transit with zero friction."</p>
              <p className="marquee-author">Amit Kumar</p>
              <p className="marquee-role">Software Engineer</p>
            </div>
            <div className="marquee-card job-card">
              <div className="marquee-badge job">
                <BriefcaseIcon />
                <span>Stealth &amp; Smooth</span>
              </div>
              <p className="marquee-text">"Helvia's screen analysis button 'Ans 💡' helped me diagnose tricky backend concurrency issues right from my tablet."</p>
              <p className="marquee-author">Sneha Gupta</p>
              <p className="marquee-role">Lead Backend Architect</p>
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="marquee-row reverse">
          <div className="marquee-track">
            <div className="marquee-card useful-card">
              <div className="marquee-badge useful">
                <HeartIcon />
                <span>Super Reliable</span>
              </div>
              <p className="marquee-text">"Lock mode on mobile prevents accidental swipe backs and zoom triggers. Perfect for touch controlling my Windows desktop."</p>
              <p className="marquee-author">Karthik Menon</p>
              <p className="marquee-role">DevOps Engineer</p>
            </div>
            <div className="marquee-card useful-card">
              <div className="marquee-badge useful">
                <HeartIcon />
                <span>Remote Freedom</span>
              </div>
              <p className="marquee-text">"Accessing my workstation while traveling without installing heavy client software is a game changer."</p>
              <p className="marquee-author">Ananya Iyer</p>
              <p className="marquee-role">Digital Nomad</p>
            </div>
            <div className="marquee-card useful-card">
              <div className="marquee-badge useful">
                <HeartIcon />
                <span>Life Saver</span>
              </div>
              <p className="marquee-text">"Emergency access to my office PC from a client meeting browser tab saved my presentation."</p>
              <p className="marquee-author">Rohit Nair</p>
              <p className="marquee-role">Technical Solutions Architect</p>
            </div>
            {/* Loop duplicates */}
            <div className="marquee-card useful-card">
              <div className="marquee-badge useful">
                <HeartIcon />
                <span>Super Reliable</span>
              </div>
              <p className="marquee-text">"Lock mode on mobile prevents accidental swipe backs and zoom triggers. Perfect for touch controlling my Windows desktop."</p>
              <p className="marquee-author">Karthik Menon</p>
              <p className="marquee-role">DevOps Engineer</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Badges */}
      <section className="security-section reveal">
        <div className="security-header">
          <div className="panel-icon" style={{ margin: '0 auto 1rem' }}>
            <LockIcon />
          </div>
          <h2>Enterprise-Grade Security by Default</h2>
          <p className="muted">Your connections and inputs are guarded by industry standard cryptographic protocols</p>
        </div>
        <div className="security-badges">
          <div className="security-badge stagger-1">
            <div className="security-badge-icon">🔒</div>
            <p className="security-badge-title">AES-256 Encryption</p>
            <p className="security-badge-desc">End-to-end encrypted direct data streams</p>
          </div>
          <div className="security-badge stagger-2">
            <div className="security-badge-icon">🛡️</div>
            <p className="security-badge-title">Cryptographic Tokens</p>
            <p className="security-badge-desc">Server-side validated against Supabase</p>
          </div>
          <div className="security-badge stagger-3">
            <div className="security-badge-icon">🔐</div>
            <p className="security-badge-title">Direct P2P WebRTC</p>
            <p className="security-badge-desc">No middleman video storage</p>
          </div>
          <div className="security-badge stagger-4">
            <div className="security-badge-icon">✅</div>
            <p className="security-badge-title">Hardware Hooks</p>
            <p className="security-badge-desc">Native Windows input injection</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="grid reveal" id="pricing">
        <div className="panel reveal">
          <h2>Simple, Transparent Pricing</h2>
          <p className="muted">Start with a quick trial or unlock full Pro power with AI Screen Analysis and unlimited sessions.</p>
          
          <div className="plans-grid">
            <div className="plan-card stagger-1">
              <div className="plan-badge">
                <span>Free Trial</span>
              </div>
              <p className="plan-name">10 min Trial</p>
              <p className="plan-price">
                Free <span>/ 10 minutes</span>
              </p>
              <p className="plan-meta">Basic remote desktop control. Perfect for quick testing and local verification.</p>
              <ul className="plan-feature-list">
                <li><CheckIcon /> Zero-Install Web Controller</li>
                <li><CheckIcon /> Mobile Touchpad &amp; Desktop Mode</li>
                <li><CheckIcon /> 60 FPS P2P WebRTC stream</li>
                <li className="disabled-feat">❌ Ans 💡 AI Engine (Pro only)</li>
              </ul>
              <div className="plan-cta">
                <button
                  className="secondary"
                  type="button"
                  disabled
                >
                  Active by Default
                </button>
              </div>
            </div>

            <div className="plan-card popular stagger-2">
              <div className="plan-badge popular-badge">
                <CheckIcon />
                <span>Best Value</span>
              </div>
              <p className="plan-name">1 Month Pro</p>
              <p className="plan-price">
                ₹999 <span>/ month</span>
              </p>
              <p className="plan-meta">Unlimited monthly desktop access, priority AI auto-routing, and stealth host control.</p>
              <ul className="plan-feature-list">
                <li><CheckIcon /> <strong>Ans 💡 AI Screen Analysis</strong></li>
                <li><CheckIcon /> Priority 3-Way AI Auto-Routing</li>
                <li><CheckIcon /> Stealth Host Capture Protection</li>
                <li><CheckIcon /> Dedicated High-Speed Bandwidth</li>
                <li><CheckIcon /> Multi-Device Host Pairing</li>
                <li><CheckIcon /> Unlimited 30-Day Global Remote Sessions</li>
              </ul>
              <div className="plan-cta">
                <button
                  className="primary"
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={!isSupabaseConfigured || isAuthLoading}
                >
                  Sign in to Upgrade
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Edge Mesh & Architecture Telemetry Section */}
      <section className="edge-telemetry-section reveal" id="network">
        <div className="edge-telemetry-card">
          <div className="edge-telemetry-header">
            <div className="edge-badge">
              <span className="live-pulse-dot" />
              <span>Global Low-Latency Edge Mesh</span>
            </div>
            <h2>Ultra-Low Latency Direct P2P Mesh</h2>
            <p className="muted">
              Helvia negotiates direct peer-to-peer WebRTC connections with fallback to globally distributed low-latency relays for instant sub-15ms response times anywhere in the world.
            </p>
          </div>

          <div className="telemetry-grid">
            <div className="telemetry-metric-box">
              <div className="telemetry-icon">⚡</div>
              <div className="telemetry-value">&lt; 15ms</div>
              <div className="telemetry-label">Average P2P Latency</div>
              <p className="telemetry-desc">Direct WebRTC ICE peer data channels with zero intermediary buffer.</p>
            </div>

            <div className="telemetry-metric-box">
              <div className="telemetry-icon">🎮</div>
              <div className="telemetry-value">60 FPS</div>
              <div className="telemetry-label">Hardware Precision Stream</div>
              <p className="telemetry-desc">Native NVENC / QuickSync video encoding with minimal CPU overhead.</p>
            </div>

            <div className="telemetry-metric-box">
              <div className="telemetry-icon">🔒</div>
              <div className="telemetry-value">DTLS 1.3</div>
              <div className="telemetry-label">End-to-End Encrypted</div>
              <p className="telemetry-desc">Military-grade AES-GCM stream encryption. No middleman recording.</p>
            </div>

            <div className="telemetry-metric-box">
              <div className="telemetry-icon">🌐</div>
              <div className="telemetry-value">100%</div>
              <div className="telemetry-label">Zero-Install Controller</div>
              <p className="telemetry-desc">Operate full workstations directly from any modern web browser.</p>
            </div>
          </div>

          <div className="edge-locations-bar">
            <span className="locations-title">Live Edge Nodes:</span>
            <div className="location-tag"><span className="location-dot online" /> Frankfurt (9ms)</div>
            <div className="location-tag"><span className="location-dot online" /> Tokyo (14ms)</div>
            <div className="location-tag"><span className="location-dot online" /> California (12ms)</div>
            <div className="location-tag"><span className="location-dot online" /> Singapore (11ms)</div>
            <div className="location-tag"><span className="location-dot online" /> Bangalore (8ms)</div>
            <div className="location-tag"><span className="location-dot online" /> London (10ms)</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="site-footer-links">
          <Link to="/privacypolicy" className="site-footer-link">
            Privacy Policy
          </Link>
          <span className="site-footer-dot">•</span>
          <Link to="/termsofservice" className="site-footer-link">
            Terms of Service
          </Link>
          <span className="site-footer-dot">•</span>
          <Link to="/refundcancellation" className="site-footer-link">
            Refund &amp; Cancellation
          </Link>
          <span className="site-footer-dot">•</span>
          <span className="site-footer-founder">Founder: N Yashwanth</span>
          <span className="site-footer-dot">•</span>
          <span className="site-footer-meta">© 2026 Helvia Remote. All rights reserved.</span>
        </div>
      </footer>
    </>
  )
}

import React, { useState, useRef, useEffect, useCallback } from 'react'

export const Interactive3DDesktopSimulator: React.FC = () => {
  // Line & Horizontal Coordinate State (Line-exact & percentage-exact)
  const [activeLine, setActiveLine] = useState(3)
  const [desktopScrollTop, setDesktopScrollTop] = useState(0)

  const [typedBuffer, setTypedBuffer] = useState<string[]>([
    '// Helvia Stealth Host Active (Windows)',
    'import { WebRTCStream, HardwareHook } from "@helvia/core";',
    '',
    'export async function startZeroLatencySession() {',
    '  const host = await HardwareHook.attachDirectX12();',
    '  const peer = new WebRTCStream({ fps: 60, p2p: true });',
    '  console.log("Hardware precision input active (0.4ms)");',
    '  return peer.streamDesktop();',
    '}',
    '// Ready for high-precision stealth remote control'
  ])

  const [isAnsActive, setIsAnsActive] = useState(false)
  const [isAnsScanning, setIsAnsScanning] = useState(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'terminal' | 'browser'>('editor')
  const [activeActionFeedback, setActiveActionFeedback] = useState<string | null>(null)
  const [inputVal, setInputVal] = useState('')
  const [isPointerDown, setIsPointerDown] = useState(false)

  // Smooth LERP Cursor State (interpolates line & horizontal ratio continuously)
  const [smoothCursor, setSmoothCursor] = useState({ line: 3, ratioX: 0.38 })
  const targetCursorRef = useRef({ line: 3, ratioX: 0.38 })
  const currentCursorRef = useRef({ line: 3, ratioX: 0.38 })
  const rafRef = useRef<number | null>(null)

  // Smooth 3D Tilt State
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
  const targetTiltRef = useRef({ rx: 0, ry: 0 })
  const currentTiltRef = useRef({ rx: 0, ry: 0 })

  // Refs
  const desktopContentRef = useRef<HTMLDivElement>(null)
  const phoneScreenContentRef = useRef<HTMLDivElement>(null)

  // Unified Line height & Padding constants
  const PHONE_LH = 22
  const DESKTOP_LH = 24
  const PADDING_TOP = 12

  // ─── Unified 60fps LERP Animation Loop ───
  useEffect(() => {
    let active = true
    const tick = () => {
      if (!active) return

      // Smooth cursor interpolation
      const ct = currentCursorRef.current
      const tt = targetCursorRef.current
      const dLine = (tt.line - ct.line) * 0.45
      const dRatio = (tt.ratioX - ct.ratioX) * 0.45
      if (Math.abs(dLine) > 0.005 || Math.abs(dRatio) > 0.005) {
        ct.line += dLine
        ct.ratioX += dRatio
        setSmoothCursor({ line: ct.line, ratioX: ct.ratioX })
      }

      // Smooth tilt interpolation
      const cTilt = currentTiltRef.current
      const tTilt = targetTiltRef.current
      const tdx = (tTilt.rx - cTilt.rx) * 0.12
      const tdy = (tTilt.ry - cTilt.ry) * 0.12
      if (Math.abs(tdx) > 0.001 || Math.abs(tdy) > 0.001) {
        cTilt.rx += tdx
        cTilt.ry += tdy
        setTilt({ rx: cTilt.rx, ry: cTilt.ry })
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { active = false; if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  // ─── 3D Parallax Tilt ───
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const nx = (e.clientX - rect.left) / rect.width - 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5
    targetTiltRef.current = { rx: -ny * 5, ry: nx * 6 }
  }, [])

  const handleMouseLeave = useCallback(() => {
    targetTiltRef.current = { rx: 0, ry: 0 }
    setIsPointerDown(false)
  }, [])

  // ─── Pointer Tracking (Line-exact & Percentage-exact) ───
  const handlePointer = useCallback((
    clientX: number, clientY: number, target: HTMLElement, isPhone: boolean
  ) => {
    const rect = target.getBoundingClientRect()
    const localX = Math.max(0, Math.min(rect.width, clientX - rect.left))
    const localY = Math.max(0, Math.min(rect.height, clientY - rect.top))
    const scrollTop = target.scrollTop || 0
    const lh = isPhone ? PHONE_LH : DESKTOP_LH

    const docY = localY + scrollTop - PADDING_TOP
    const lineIndex = Math.max(0, Math.min(typedBuffer.length, Math.floor(docY / lh)))
    const ratioX = Math.max(0.08, Math.min(0.92, localX / rect.width))

    setActiveLine(lineIndex)
    targetCursorRef.current = { line: lineIndex, ratioX }
  }, [typedBuffer.length])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, isPhone: boolean) => {
    setIsPointerDown(true)
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    
    const rect = e.currentTarget.getBoundingClientRect()
    const localX = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const localY = Math.max(0, Math.min(rect.height, e.clientY - rect.top))
    const scrollTop = e.currentTarget.scrollTop || 0
    const lh = isPhone ? PHONE_LH : DESKTOP_LH
    const docY = localY + scrollTop - PADDING_TOP
    const lineIndex = Math.max(0, Math.min(typedBuffer.length, Math.floor(docY / lh)))
    const ratioX = Math.max(0.08, Math.min(0.92, localX / rect.width))

    setActiveLine(lineIndex)
    targetCursorRef.current = { line: lineIndex, ratioX }
    currentCursorRef.current = { line: lineIndex, ratioX }
    setSmoothCursor({ line: lineIndex, ratioX })
  }, [typedBuffer.length])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>, isPhone: boolean) => {
    handlePointer(e.clientX, e.clientY, e.currentTarget, isPhone)
  }, [handlePointer])

  const handlePointerUp = useCallback(() => {
    setIsPointerDown(false)
  }, [])

  // ─── Smooth Synchronized Scroll ───
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.preventDefault()
    setDesktopScrollTop(prev => Math.max(0, Math.min(300, prev + e.deltaY * 0.45)))
  }, [])

  useEffect(() => {
    desktopContentRef.current?.scrollTo({ top: desktopScrollTop, behavior: 'smooth' })
    phoneScreenContentRef.current?.scrollTo({ top: desktopScrollTop * (PHONE_LH / DESKTOP_LH), behavior: 'smooth' })
  }, [desktopScrollTop])

  // ─── Actions ───
  const handleAnsClick = () => {
    setIsAnsScanning(true)
    setActiveActionFeedback(`Ans 💡 Analyzing Line ${activeLine + 1}...`)
    setTimeout(() => { 
      setIsAnsScanning(false)
      setIsAnsActive(p => !p)
      setActiveActionFeedback(null) 
    }, 450)
  }

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputVal.trim()) return
    setTypedBuffer(p => [...p, `> ${inputVal}`, `[HOST]: Injected (0.4ms)`])
    setInputVal('')
    setActiveActionFeedback(`Injected on Line ${typedBuffer.length + 1}: "${inputVal}"`)
    setTimeout(() => setActiveActionFeedback(null), 1400)
  }

  const sendQuickCommand = (cmd: string) => {
    setActiveActionFeedback(`Injected: ${cmd}`)
    setTypedBuffer(p => [...p, `> ${cmd}`, `[SUCCESS] Dispatched OK.`])
    setTimeout(() => setActiveActionFeedback(null), 1400)
  }

  // ─── Shared Code Content Renderer ───
  const renderCodeContent = (lineHeightClass: string) => (
    <div className={`screen-mirror-layout ${lineHeightClass}`}>
      <div className="screen-line-numbers">
        {typedBuffer.map((_, i) => (
          <div key={i} className={`line-num-item ${i === activeLine ? 'active-line-num' : ''}`}>
            {i + 1}
          </div>
        ))}
        <div className={`line-num-item ${activeLine === typedBuffer.length ? 'active-line-num' : ''}`}>
          {typedBuffer.length + 1}
        </div>
      </div>
      <div className="screen-code-lines">
        {typedBuffer.map((line, idx) => {
          let c = 'code-plain'
          if (line.startsWith('//')) c = 'code-comment'
          else if (/^(import|export|const|async|return)/.test(line)) c = 'code-keyword'
          else if (line.startsWith('>')) c = 'code-injected'
          else if (line.startsWith('[')) c = 'code-success'
          return (
            <div key={idx} className={`code-row ${c} ${idx === activeLine ? 'active-line-row' : ''}`}>
              {line}
            </div>
          )
        })}
        <div className={`code-row code-injected active ${activeLine === typedBuffer.length ? 'active-line-row' : ''}`}>
          <span className="code-prompt">&gt;</span>
          <span className="code-draft">{inputVal}</span>
          <span className="editor-blinking-cursor">|</span>
        </div>
      </div>
    </div>
  )

  // ─── Reusable Cursor Component ───
  const CursorIndicator = ({ size = 20, label }: { size?: number; label: string }) => (
    <div className="exact-synced-cursor">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5">
        <path d="M3 3l7 18 3-7 7-3L3 3z" />
      </svg>
      <span className="cursor-user-tag">{label}</span>
    </div>
  )

  return (
    <div
      className="interactive-3d-simulator-wrapper"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1400px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
      }}
    >
      {/* Simulator Top Header */}
      <div className="simulator-header-bar">
        <div className="sim-badge">
          <span className="live-pulse-dot" />
          <span>Interactive 3D Live Simulation • 1:1 Hardware-Exact Cursor Sync</span>
        </div>
        {activeActionFeedback ? (
          <div className="sim-feedback-toast">
            <span>⚡ {activeActionFeedback}</span>
          </div>
        ) : (
          <div className="sim-helper-pill">
            <span>🎯 Cursor Focused on <strong>Line {activeLine + 1}</strong> • Touch anywhere to control host</span>
          </div>
        )}
      </div>

      <div className="sim-dual-container">
        {/* =========================================================
            DEVICE 1: MOBILE PHONE (LEFT)
            ========================================================= */}
        <div className="sim-device sim-phone-device">
          <div className="sim-device-header">
            <span className="sim-device-tag">📱 Mobile Controller (/m/)</span>
            <span className="sim-status-chip">Line {activeLine + 1} Focused</span>
          </div>

          <div className="sim-phone-body">
            <div className="sim-phone-dynamic-island">
              <span className="island-dot" />
              <span className="island-cam" />
            </div>

            <div className="sim-phone-screen">
              {/* Phone Status Bar */}
              <div className="phone-status-bar">
                <span className="phone-clock">09:41</span>
                <div className="phone-status-icons">
                  <span className="phone-tag-stream">● LIVE PC</span>
                  <span>5G 📶</span>
                  <span>100% 🔋</span>
                </div>
              </div>

              {/* Phone Toolbar */}
              <div className="phone-controls-toolbar">
                <button 
                  type="button" 
                  className={`phone-ans-btn ${isAnsActive ? 'active' : ''} ${isAnsScanning ? 'scanning' : ''}`} 
                  onClick={handleAnsClick}
                >
                  <span className="ans-sparkle">💡</span>
                  <span>{isAnsActive ? 'Close Ans' : 'Ans 💡'}</span>
                </button>
                <div className="phone-mode-switchers">
                  {(['editor', 'terminal', 'browser'] as const).map(tab => (
                    <button 
                      key={tab} 
                      type="button" 
                      className={`phone-tab-chip ${activeTab === tab ? 'active' : ''}`} 
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab === 'editor' ? 'Code' : tab === 'terminal' ? 'Term' : 'Web'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Full-Screen Viewport */}
              <div
                className={`phone-fullscreen-desktop-viewport custom-scrollbar ${isPointerDown ? 'touch-active' : ''}`}
                onPointerDown={e => handlePointerDown(e, true)}
                onPointerMove={e => handlePointerMove(e, true)}
                onPointerUp={handlePointerUp}
                onWheel={handleWheel}
                ref={phoneScreenContentRef}
              >
                {/* 1:1 Phone Synced Cursor (Inside scroll container) */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    left: `${smoothCursor.ratioX * 100}%`, 
                    top: `${PADDING_TOP + smoothCursor.line * PHONE_LH + 2}px`, 
                    pointerEvents: 'none', 
                    zIndex: 15,
                    transform: 'translate(-2px, -2px)',
                    transition: 'left 0.04s linear, top 0.04s linear'
                  }}
                >
                  <CursorIndicator size={18} label={`L${activeLine + 1}`} />
                </div>

                {isAnsScanning && (
                  <div className="phone-ai-scanline">
                    <span className="phone-scan-tag">Ans 💡 Scanning Line {activeLine + 1}...</span>
                  </div>
                )}

                {isAnsActive && (
                  <div className="phone-ai-ans-overlay animate-in">
                    <div className="phone-ai-ans-header">
                      <div className="phone-ai-ans-title">💡 Ans 💡 Copilot Analysis</div>
                      <button type="button" className="phone-ai-ans-close" onClick={() => setIsAnsActive(false)}>✕</button>
                    </div>
                    <p className="phone-ai-ans-text">
                      Focused on Line {activeLine + 1}. WebRTC candidate bound with <strong>8.4ms latency</strong>.
                    </p>
                    <div className="phone-ai-ans-mini-code">
                      <code>{`peer.streamHardware60FPS();`}</code>
                    </div>
                  </div>
                )}

                {activeTab === 'editor' && renderCodeContent('line-height-phone')}

                {activeTab === 'terminal' && (
                  <div className="phone-term-view">
                    <div className="phone-term-header">PS C:\Helvia\Host [60 FPS Active]</div>
                    <div className="phone-term-buffer">
                      {typedBuffer.map((l, i) => (
                        <div key={i} className={`phone-term-row ${i === activeLine ? 'active-line-row' : ''}`}>
                          {l}
                        </div>
                      ))}
                      <div className="phone-term-prompt">
                        <span className="prompt-path">PS&gt;</span>
                        <span>{inputVal}</span>
                        <span className="editor-blinking-cursor">_</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'browser' && (
                  <div className="phone-browser-view">
                    <div className="phone-browser-bar">🔒 app.helvia-remote.internal</div>
                    <div className="phone-browser-body">
                      <h5>Helvia Hub</h5>
                      <p>Input: <strong className="text-green">Active</strong></p>
                      <p>Stream: <strong>60 FPS P2P</strong></p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Dock */}
              <div className="phone-bottom-actions-dock">
                <div className="phone-click-action-row">
                  <button 
                    type="button" 
                    className="touchpad-btn" 
                    onClick={() => { 
                      setActiveActionFeedback(`Clicked Line ${activeLine + 1}`)
                      setTimeout(() => setActiveActionFeedback(null), 800) 
                    }}
                  >
                    L-Click
                  </button>
                  <button 
                    type="button" 
                    className="touchpad-btn scroll-btn" 
                    onClick={() => { 
                      setDesktopScrollTop(p => Math.min(300, p + 48))
                      setActiveActionFeedback('Scroll ↓')
                      setTimeout(() => setActiveActionFeedback(null), 800) 
                    }}
                  >
                    Scroll ↓
                  </button>
                  <button 
                    type="button" 
                    className="touchpad-btn scroll-btn" 
                    onClick={() => { 
                      setDesktopScrollTop(p => Math.max(0, p - 48))
                      setActiveActionFeedback('Scroll ↑')
                      setTimeout(() => setActiveActionFeedback(null), 800) 
                    }}
                  >
                    Scroll ↑
                  </button>
                  <button 
                    type="button" 
                    className="touchpad-btn" 
                    onClick={() => { 
                      setActiveActionFeedback(`Context Menu on Line ${activeLine + 1}`)
                      setTimeout(() => setActiveActionFeedback(null), 800) 
                    }}
                  >
                    R-Click
                  </button>
                </div>

                <form className="phone-keyboard-bar" onSubmit={handleInputSubmit}>
                  <input 
                    type="text" 
                    placeholder={`Type at Line ${activeLine + 1}...`} 
                    value={inputVal} 
                    onChange={e => setInputVal(e.target.value)} 
                    className="phone-key-input" 
                  />
                  <button type="submit" className="phone-send-btn">
                    Inject
                  </button>
                </form>

                <div className="phone-quick-chips">
                  <button type="button" onClick={() => sendQuickCommand('npm run build')}>npm run build</button>
                  <button type="button" onClick={() => sendQuickCommand('git push')}>git push</button>
                  <button type="button" onClick={() => sendQuickCommand('python ai.py')}>python ai.py</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            MIDDLE P2P WEBRTC STREAM CONNECTOR
            ========================================================= */}
        <div className="sim-stream-connector">
          <div className="sim-stream-line">
            <div className="stream-pulse-particle particle-1" />
            <div className="stream-pulse-particle particle-2" />
          </div>
          <div className="stream-badge-center">
            <span className="stream-lock-icon">🔒</span>
            <span className="stream-speed-tag">1:1 Kernel Stream &lt; 15ms</span>
          </div>
          <div className="sim-stream-line">
            <div className="stream-pulse-particle particle-3" />
          </div>
        </div>

        {/* =========================================================
            DEVICE 2: REMOTE WINDOWS WORKSTATION (RIGHT)
            ========================================================= */}
        <div className="sim-device sim-desktop-device">
          <div className="sim-device-header">
            <span className="sim-device-tag">💻 Remote Workstation (Real-Time 60 FPS View)</span>
            <span className="sim-status-chip online">Line {activeLine + 1} Focused</span>
          </div>

          <div className="sim-monitor-body">
            <div className="desktop-titlebar">
              <div className="titlebar-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <div className="titlebar-tabs">
                {(['editor', 'terminal', 'browser'] as const).map(tab => (
                  <button 
                    key={tab} 
                    type="button" 
                    className={`desktop-tab ${activeTab === tab ? 'active' : ''}`} 
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'editor' ? '📄 main.tsx' : tab === 'terminal' ? '💻 PowerShell' : '🌐 Edge'}
                  </button>
                ))}
              </div>
              <div className="titlebar-meta">
                <span className="meta-fps">60 FPS</span>
                <span className="meta-divider">•</span>
                <span className="meta-tech">DirectX 12</span>
              </div>
            </div>

            <div
              className="desktop-screen-viewport"
              onPointerDown={e => handlePointerDown(e, false)}
              onPointerMove={e => handlePointerMove(e, false)}
              onPointerUp={handlePointerUp}
              onWheel={handleWheel}
            >
              {/* Scrollable Container with exact 1:1 cursor rendered inside */}
              <div 
                className="desktop-screen-scroll-container custom-scrollbar" 
                ref={desktopContentRef}
              >
                {/* 1:1 Desktop Synced Cursor (Inside scroll container) */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    left: `${smoothCursor.ratioX * 100}%`, 
                    top: `${PADDING_TOP + smoothCursor.line * DESKTOP_LH + 2}px`, 
                    pointerEvents: 'none', 
                    zIndex: 15,
                    transform: 'translate(-2px, -2px)',
                    transition: 'left 0.04s linear, top 0.04s linear'
                  }}
                >
                  <CursorIndicator size={22} label={`Line ${activeLine + 1}`} />
                </div>

                {activeTab === 'editor' && renderCodeContent('line-height-desktop')}

                {activeTab === 'terminal' && (
                  <div className="terminal-screen-layout">
                    <div className="terminal-log-row text-cyan">Windows PowerShell [Version 10.0.22631]</div>
                    <div className="terminal-log-row text-muted">Helvia Remote Host v0.1.0 • Kernel Hook Active</div>
                    <div className="terminal-log-row text-green">[OK] P2P ICE Bound (9ms)</div>
                    <div className="terminal-buffer-rows">
                      {typedBuffer.map((l, i) => (
                        <div key={i} className={`terminal-line ${i === activeLine ? 'active-line-row' : ''}`}>
                          {l}
                        </div>
                      ))}
                    </div>
                    <div className="terminal-prompt-line">
                      <span className="prompt-path">PS C:\Helvia&gt;</span>
                      <span>{inputVal}</span>
                      <span className="editor-blinking-cursor">_</span>
                    </div>
                  </div>
                )}

                {activeTab === 'browser' && (
                  <div className="browser-screen-layout">
                    <div className="browser-mock-searchbar">
                      <span className="search-lock">🔒</span>
                      <span>https://app.helvia-remote.internal</span>
                    </div>
                    <div className="browser-mock-page">
                      <h4>Helvia Workstation Hub</h4>
                      <p>Input: <strong className="text-green">Active</strong></p>
                      <p>Resolution: <strong>2560×1440 @ 60 FPS</strong></p>
                      <div className="browser-mock-stats">
                        <div className="mock-stat-pill">ICE: Connected</div>
                        <div className="mock-stat-pill">14.8 Mbps</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="desktop-monitor-chin"><span className="chin-brand-dot" /></div>
            <div className="desktop-monitor-base" />
          </div>
        </div>
      </div>
    </div>
  )
}

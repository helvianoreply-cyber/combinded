import React, { useState } from 'react'
import { HELVIA_TUTORIAL_VIDEOS, type HelviaTutorialVideo } from '../lib/videoTutorials'

interface VideoTutorialsSectionProps {
  initialVideo?: 'remote' | 'meet' | 'apply'
  compact?: boolean
  id?: string
}

export const VideoTutorialsSection: React.FC<VideoTutorialsSectionProps> = ({
  initialVideo = 'remote',
  compact = false,
  id = 'how-to-use',
}) => {
  const [selectedId, setSelectedId] = useState<'remote' | 'meet' | 'apply'>(initialVideo)

  const currentVideo: HelviaTutorialVideo =
    HELVIA_TUTORIAL_VIDEOS.find((v) => v.id === selectedId) || HELVIA_TUTORIAL_VIDEOS[0]

  const handleSelectVideo = (videoId: 'remote' | 'meet' | 'apply') => {
    setSelectedId(videoId)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section className={`how-to-use-section ${compact ? 'compact-mode' : 'reveal'}`} id={id}>
      <div className="section-header-center">
        <div className="eyebrow-pill-badge">
          <span className="badge-glow-dot" />
          <span>🎬 OFFICIAL VIDEO WALKTHROUGHS</span>
        </div>
        <h2>Master the Helvia Suite in Minutes</h2>
        <p className="muted">
          Watch comprehensive step-by-step video guides demonstrating live pairing, stealth HUD execution, and autonomous job pipeline automation.
        </p>

        {/* 3 App Switcher Tabs */}
        <div className="video-app-tabs" role="tablist" aria-label="Select Helvia Application Video">
          {HELVIA_TUTORIAL_VIDEOS.map((video) => {
            const isActive = video.id === selectedId
            return (
              <button
                key={video.id}
                role="tab"
                aria-selected={isActive}
                className={`video-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedId(video.id)}
                style={{
                  borderColor: isActive ? video.accentColor : undefined,
                  boxShadow: isActive ? `0 0 20px ${video.accentColor}33` : undefined,
                }}
              >
                <span className="tab-icon">
                  {video.id === 'remote' ? '🖥️' : video.id === 'meet' ? '🎙️' : '🚀'}
                </span>
                <span className="tab-name">{video.appName}</span>
                {isActive && <span className="tab-active-indicator" style={{ background: video.accentColor }} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Video Showcase Stage */}
      <div 
        className="video-showcase-stage"
        style={{
          borderColor: `${currentVideo.accentColor}35`,
          boxShadow: `0 20px 50px -15px ${currentVideo.accentColor}20`,
        }}
      >
        {/* Left Column: Embedded YouTube Player */}
        <div className="video-player-wrapper">
          <div className="video-player-header">
            <div className="player-meta-info">
              <span className="player-live-dot" style={{ background: currentVideo.accentColor }} />
              <span className="player-title-text">{currentVideo.appName} • Official Walkthrough</span>
            </div>
            <a
              href={currentVideo.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="player-yt-external-link"
              title="Open video on YouTube in a new tab"
            >
              <span>Watch on YouTube</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>

          <div className="video-iframe-responsive">
            <iframe
              src={`${currentVideo.embedUrl}?rel=0&modestbranding=1&enablejsapi=1`}
              title={currentVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>

          {/* Quick Highlight Chips */}
          <div className="video-feature-chips">
            {currentVideo.highlights.map((h, i) => (
              <span key={i} className="video-chip">
                <span className="chip-bullet" style={{ background: currentVideo.accentColor }} />
                {h}
              </span>
            ))}
          </div>
        </div>

        {/* Right Column: Step-by-Step Instructions & App Actions */}
        <div className="video-guide-content">
          <div className="guide-header">
            <span
              className="guide-badge"
              style={{
                color: currentVideo.accentColor,
                backgroundColor: `${currentVideo.accentColor}18`,
                borderColor: `${currentVideo.accentColor}40`,
              }}
            >
              {currentVideo.badge}
            </span>
            <h3 className="guide-title">{currentVideo.title}</h3>
            <p className="guide-description">{currentVideo.description}</p>
          </div>

          {/* 3 Step Breakdown */}
          <div className="guide-steps-list">
            {currentVideo.steps.map((st) => (
              <div className="guide-step-card" key={st.step}>
                <div 
                  className="step-badge"
                  style={{
                    background: `${currentVideo.accentColor}20`,
                    color: currentVideo.accentColor,
                    borderColor: `${currentVideo.accentColor}40`,
                  }}
                >
                  {st.step}
                </div>
                <div className="step-info">
                  <h4 className="step-title">{st.title}</h4>
                  <p className="step-desc">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Download & Actions Row */}
          <div className="guide-actions-bar">
            <a
              href={currentVideo.downloadUrl}
              className="guide-download-btn"
              style={{
                background: currentVideo.accentColor,
                boxShadow: `0 8px 24px ${currentVideo.accentColor}40`,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>{currentVideo.downloadLabel}</span>
            </a>

            <a
              href={currentVideo.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="guide-secondary-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>Open in YouTube</span>
            </a>
          </div>
        </div>
      </div>

      {/* Playlist Grid: All 3 Videos Quick Access */}
      <div className="video-playlist-section">
        <div className="playlist-heading">
          <h4>All Video Walkthroughs in this Series</h4>
          <span className="playlist-count">3 Official Tutorials</span>
        </div>

        <div className="video-playlist-grid">
          {HELVIA_TUTORIAL_VIDEOS.map((video) => {
            const isSelected = video.id === selectedId
            return (
              <div
                key={video.id}
                className={`playlist-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectVideo(video.id)}
                style={{
                  borderColor: isSelected ? video.accentColor : undefined,
                }}
              >
                <div className="playlist-thumbnail-wrap">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="playlist-thumbnail"
                    loading="lazy"
                  />
                  <div className="thumbnail-overlay">
                    <span
                      className="thumbnail-play-icon"
                      style={{ background: isSelected ? video.accentColor : 'rgba(15, 23, 42, 0.85)' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </span>
                  </div>
                  {isSelected && (
                    <span className="playlist-playing-badge" style={{ background: video.accentColor }}>
                      <span className="pulse-mini-dot" /> NOW PLAYING
                    </span>
                  )}
                </div>

                <div className="playlist-info">
                  <div className="playlist-app-badge" style={{ color: video.accentColor }}>
                    {video.id === 'remote' ? '🖥️ Remote' : video.id === 'meet' ? '🎙️ Meet' : '🚀 Apply'}
                  </div>
                  <h5 className="playlist-title">{video.title}</h5>
                  <p className="playlist-desc">{video.subtitle}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

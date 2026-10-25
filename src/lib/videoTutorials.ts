import { HELVIA_DOWNLOAD_LINKS } from './downloadLinks'

export interface HelviaTutorialStep {
  step: string
  title: string
  desc: string
}

export interface HelviaTutorialVideo {
  id: 'remote' | 'meet' | 'apply'
  appKey: string
  appName: string
  badge: string
  title: string
  subtitle: string
  videoId: string
  youtubeUrl: string
  embedUrl: string
  thumbnailUrl: string
  duration: string
  accentColor: string
  bgGradient: string
  description: string
  highlights: string[]
  steps: HelviaTutorialStep[]
  downloadUrl: string
  downloadLabel: string
}

export const HELVIA_TUTORIAL_VIDEOS: HelviaTutorialVideo[] = [
  {
    id: 'remote',
    appKey: 'remote',
    appName: 'Helvia Remote',
    badge: 'Desktop & Mobile Remote Access',
    title: 'Helvia Remote | How to use Helvia Remote',
    subtitle: 'Zero-trust, sub-15ms 60 FPS remote desktop access and physical control from any phone or browser.',
    videoId: '33mtRu5HGFg',
    youtubeUrl: 'https://youtu.be/33mtRu5HGFg?si=w5bCi75gwNsi63Hz',
    embedUrl: 'https://www.youtube-nocookie.com/embed/33mtRu5HGFg',
    thumbnailUrl: 'https://img.youtube.com/vi/33mtRu5HGFg/hqdefault.jpg',
    duration: 'Visual Walkthrough',
    accentColor: '#3b82f6',
    bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.22), rgba(30, 64, 175, 0.05))',
    description: 'Learn how to download and launch the lightweight Windows host client, pair seamlessly using instant QR code or 6-digit session PIN, and control your PC remotely with fluid 60 FPS streaming and zero latency.',
    highlights: ['Sub-15ms 60 FPS Video', 'Instant Mobile QR Pairing', 'Hardware Input Injection', 'End-to-End P2P Encryption'],
    steps: [
      {
        step: '01',
        title: 'Launch Host Client',
        desc: 'Download and launch the official Helvia Remote Host (.exe v0.2.5). Runs standalone with zero installation overhead.',
      },
      {
        step: '02',
        title: 'Scan QR Code or Enter PIN',
        desc: 'Open your mobile camera or browser, scan the on-screen QR code or type your 6-digit session PIN for instant peer handshake.',
      },
      {
        step: '03',
        title: 'Enjoy Real-Time Remote Control',
        desc: 'Experience fluid 60 FPS desktop streaming with mouse click injection, touch controls, clipboard sync, and full privacy.',
      },
    ],
    downloadUrl: HELVIA_DOWNLOAD_LINKS.remote,
    downloadLabel: 'Download Helvia Remote (.exe)',
  },
  {
    id: 'meet',
    appKey: 'meet',
    appName: 'Helvia Meet',
    badge: 'Executive Interview Copilot',
    title: 'Helvia Meet | How To Use Helvia Meet',
    subtitle: '100% invisible AI assistant with real-time speech transcription and STAR-framework answer synthesis.',
    videoId: 'Lq7aHyJaAlU',
    youtubeUrl: 'https://youtu.be/Lq7aHyJaAlU?si=HdWkbq1RvyKCvNd1',
    embedUrl: 'https://www.youtube-nocookie.com/embed/Lq7aHyJaAlU',
    thumbnailUrl: 'https://img.youtube.com/vi/Lq7aHyJaAlU/hqdefault.jpg',
    duration: 'Visual Walkthrough',
    accentColor: '#a855f7',
    bgGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.22), rgba(107, 33, 168, 0.05))',
    description: 'See how to activate the discreet in-meeting HUD before your Zoom, Microsoft Teams, or Google Meet call. Delivers instant talking points without screenshare capture or meeting bot alerts.',
    highlights: ['100% Invisible Screenshare HUD', 'Sub-18ms Speech Ingest', 'STAR Method Synthesis', 'No Meeting Bots or Transcripts'],
    steps: [
      {
        step: '01',
        title: 'Launch Before Your Meeting',
        desc: 'Open Helvia Meet prior to joining your Zoom, Teams, or Google Meet interview or boardroom discussion.',
      },
      {
        step: '02',
        title: 'Hardware Privacy Shield',
        desc: 'The floating HUD utilizes OS display affinity (WDA_EXCLUDEFROMCAPTURE), making it 100% invisible if you share your screen.',
      },
      {
        step: '03',
        title: 'Instant STAR Talking Points',
        desc: 'As interviewers speak, get real-time structured talking points, architecture patterns, and metric-driven bullet points.',
      },
    ],
    downloadUrl: HELVIA_DOWNLOAD_LINKS.meet,
    downloadLabel: 'Download Helvia Meet (.exe)',
  },
  {
    id: 'apply',
    appKey: 'apply',
    appName: 'Helvia Apply',
    badge: 'Autonomous ATS Pipeline',
    title: 'Helvia Apply | How to use Helvia Apply',
    subtitle: 'Autonomous job applications across Greenhouse, Lever, Workday & LinkedIn with 99% ATS match scoring.',
    videoId: 'IyJGQZpWPEY',
    youtubeUrl: 'https://youtu.be/IyJGQZpWPEY?si=sRhHbLVlDhXjCiaX',
    embedUrl: 'https://www.youtube-nocookie.com/embed/IyJGQZpWPEY',
    thumbnailUrl: 'https://img.youtube.com/vi/IyJGQZpWPEY/hqdefault.jpg',
    duration: 'Visual Walkthrough',
    accentColor: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(180, 83, 9, 0.05))',
    description: 'Watch how Helvia Apply parses your baseline resume, extracts mandatory skill keywords from active postings, and delivers tailored applications on autopilot while tracking callbacks.',
    highlights: ['99% ATS Match Score', 'Greenhouse & Lever Integration', 'Dynamic Bullet Tailoring', 'Automated Application Queue'],
    steps: [
      {
        step: '01',
        title: 'Upload Profile & Resume',
        desc: 'Import your resume, specify target titles, preferred locations, and compensation criteria in your profile.',
      },
      {
        step: '02',
        title: 'Dynamic Skill Realignment',
        desc: 'Our engine parses target job descriptions and aligns your experience bullet points to pass strict ATS filters.',
      },
      {
        step: '03',
        title: 'Autopilot Submissions',
        desc: 'Trigger autonomous batch applications, view live delivery statuses, and prepare with tailored interview drills.',
      },
    ],
    downloadUrl: HELVIA_DOWNLOAD_LINKS.apply,
    downloadLabel: 'Download Helvia Apply (.exe)',
  },
]

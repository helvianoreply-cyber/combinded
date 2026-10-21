/**
 * Centralized Download Links & Software Metadata for Helvia Desktop Suite
 */

export const HELVIA_DOWNLOAD_LINKS = {
  // Helvia Remote Host Client (v0.2.5)
  remote: 'https://pub-4ec430c8cdbd49ffb57191dca016c43b.r2.dev/Helvia%20Remote%20Setup%200.2.5.exe',

  // Helvia Meet (Executive Meeting Copilot with Hardware Display Capture Privacy)
  meet: 'https://pub-2e88ccae14f343a992d070d8e9b05122.r2.dev/helvia-meet%20setup.exe',

  // Helvia Apply (Autonomous ATS Resume Optimizer & Job Application Suite)
  apply: 'https://pub-7c77a95c7a3b46139b60f027d64f80e9.r2.dev/HelviaApply_Setup.exe',
} as const

export interface HelviaAppItem {
  id: 'remote' | 'meet' | 'apply'
  name: string
  version: string
  filename: string
  downloadUrl: string
  badge: string
  subtitle: string
  description: string
  accentColor: string
  tag: string
  os: string
}

export const HELVIA_APPS_CATALOG: HelviaAppItem[] = [
  {
    id: 'remote',
    name: 'Helvia Remote',
    version: '0.2.5',
    filename: 'Helvia Remote Setup 0.2.5.exe',
    downloadUrl: HELVIA_DOWNLOAD_LINKS.remote,
    badge: 'Remote Control Host',
    subtitle: '60 FPS Ultra-Low Latency Desktop Host',
    description: 'Hardware-accelerated 60 FPS remote desktop access with direct P2P encryption and sub-15ms glass-to-glass latency.',
    accentColor: '#3b82f6',
    tag: 'Windows Host (.exe)',
    os: 'Windows 10 / 11 (64-bit)',
  },
  {
    id: 'meet',
    name: 'Helvia Meet',
    version: 'Latest',
    filename: 'helvia-meet setup.exe',
    downloadUrl: HELVIA_DOWNLOAD_LINKS.meet,
    badge: 'Executive Copilot',
    subtitle: '100% Invisible In-Meeting AI Assistant',
    description: 'Sub-18ms speech intelligence with STAR talking points, hardware-level screenshare exclusion (WDA), and zero meeting bots.',
    accentColor: '#a855f7',
    tag: 'Windows Desktop (.exe)',
    os: 'Windows 10 / 11 (64-bit)',
  },
  {
    id: 'apply',
    name: 'Helvia Apply',
    version: 'Latest',
    filename: 'HelviaApply_Setup.exe',
    downloadUrl: HELVIA_DOWNLOAD_LINKS.apply,
    badge: 'Talent Mobility',
    subtitle: 'Autonomous ATS Pipeline & Interview Drill Coach',
    description: 'Autonomous multi-portal job applications across Greenhouse, Lever, and Workday with 99% ATS match scoring and mock interview drills.',
    accentColor: '#f59e0b',
    tag: 'Windows Desktop (.exe)',
    os: 'Windows 10 / 11 (64-bit)',
  },
]

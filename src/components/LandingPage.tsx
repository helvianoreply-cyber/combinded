import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SkyCanvas3D } from './SkyCanvas3D'
import { UnifiedSimultaneousPracticalsArena } from './UnifiedSimultaneousPracticalsArena'
import { type DbPlan, SEED_PLANS, getPlanInrPrice } from '../lib/database.types'
import { PaymentModal } from './PaymentModal'
import { InteractiveTopupStation } from './InteractiveTopupStation'

interface LandingPageProps {
  signInWithGoogle: () => Promise<void>
  isSupabaseConfigured: boolean
  isAuthLoading: boolean
  plans?: DbPlan[]
  startUpgrade?: (plan: DbPlan | '24h' | 'month', couponCode?: string, customAmountInr?: number) => void
  startTopup?: (type: 'copilot' | 'autoapply', units: number, couponCode?: string) => void
  startDodoUpgrade?: (productId?: string, couponCode?: string) => void
  isSignedIn?: boolean
  userPlan?: string
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

const GhostIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="22"></line>
    <line x1="8" y1="22" x2="16" y2="22"></line>
  </svg>
)

const MicIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="22"></line>
  </svg>
)

const FileTextIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
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

const ActivityIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
)

const SlidersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"></line>
    <line x1="4" y1="10" x2="4" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12" y2="3"></line>
    <line x1="20" y1="21" x2="20" y2="16"></line>
    <line x1="20" y1="12" x2="20" y2="3"></line>
    <line x1="1" y1="14" x2="7" y2="14"></line>
    <line x1="9" y1="8" x2="15" y2="8"></line>
    <line x1="17" y1="16" x2="23" y2="16"></line>
  </svg>
)

const ChevronDownIcon = ({ open }: { open: boolean }) => (
  <svg 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
)

// Data constants
const EDGE_NODES = [
  { id: 'fra', city: 'Frankfurt', region: 'eu', ping: '8.2 ms', flag: '🇩🇪', loss: '0.00%', load: '24%', type: 'Direct P2P' },
  { id: 'tyo', city: 'Tokyo', region: 'apac', ping: '13.6 ms', flag: '🇯🇵', loss: '0.00%', load: '38%', type: 'Direct P2P' },
  { id: 'sfo', city: 'Silicon Valley', region: 'na', ping: '11.4 ms', flag: '🇺🇸', loss: '0.00%', load: '41%', type: 'NVENC ICE' },
  { id: 'sin', city: 'Singapore', region: 'apac', ping: '10.1 ms', flag: '🇸🇬', loss: '0.00%', load: '29%', type: 'Direct P2P' },
  { id: 'blr', city: 'Bangalore', region: 'apac', ping: '6.8 ms', flag: '🇮🇳', loss: '0.00%', load: '32%', type: 'Direct P2P' },
  { id: 'lon', city: 'London', region: 'eu', ping: '9.4 ms', flag: '🇬🇧', loss: '0.00%', load: '27%', type: 'Direct P2P' },
  { id: 'syd', city: 'Sydney', region: 'apac', ping: '20.5 ms', flag: '🇦🇺', loss: '0.00%', load: '19%', type: 'STUN Relay' },
  { id: 'sao', city: 'São Paulo', region: 'na', ping: '24.1 ms', flag: '🇧🇷', loss: '0.00%', load: '22%', type: 'AES-GCM Tunnel' },
]

const BENCHMARK_DATA = {
  latency: [
    { name: 'Helvia Remote', value: '16 ms', score: 100, highlight: true, note: 'Direct OS Pipeline + DXGI 60 FPS P2P' },
    { name: 'Parsec', value: '28 ms', score: 78, highlight: false, note: 'Gaming optimized, heavy desktop host' },
    { name: 'AnyDesk', value: '42 ms', score: 55, highlight: false, note: 'Relay latency spikes during peak hours' },
    { name: 'RustDesk', value: '54 ms', score: 45, highlight: false, note: 'Public relay latency variable' },
    { name: 'TeamViewer', value: '68 ms', score: 35, highlight: false, note: 'Heavy multi-tier encryption proxy' },
    { name: 'Chrome Remote', value: '88 ms', score: 25, highlight: false, note: 'Browser relay buffer overhead' },
  ],
  stealth: [
    { name: 'Helvia Suite (Remote & Copilot)', value: '100% Excluded', score: 100, highlight: true, note: 'Hardware WDA_EXCLUDEFROMCAPTURE + zero watermark' },
    { name: 'Otter.ai / Fireflies', value: '0% Exclusion', score: 0, highlight: false, note: 'Visible third-party bot joins call & blocked by admins' },
    { name: 'Parsec', value: '15% Exclusion', score: 15, highlight: false, note: 'Prominent system tray & overlay icon visible to attendees' },
    { name: 'AnyDesk', value: '0% Exclusion', score: 0, highlight: false, note: 'Taskbar watermark & remote session warning popups' },
    { name: 'TeamViewer', value: '0% Exclusion', score: 0, highlight: false, note: 'Session warning banner & post-call splash screen' },
    { name: 'Chrome Remote', value: '0% Exclusion', score: 0, highlight: false, note: 'Native OS "Your screen is shared" persistent notification bar' },
  ],
  resumeMatch: [
    { name: 'Helvia Auto Apply', value: '98% ATS Pass', score: 98, highlight: true, note: 'Dynamic LLM resume realignment per job description' },
    { name: 'JobRight / Simplify', value: '62% ATS Pass', score: 62, highlight: false, note: 'Semi-automated form filler with static resume' },
    { name: 'LazyApply', value: '44% ATS Pass', score: 44, highlight: false, note: 'Blasts generic unchanged resume across boards' },
    { name: 'Manual Applying', value: '52% ATS Pass', score: 52, highlight: false, note: 'Time consuming (15-25 mins per application)' },
  ],
  cpu: [
    { name: 'Helvia Remote', value: '1.8%', score: 98, highlight: true, note: 'Hardware GPU NVENC direct hook' },
    { name: 'Parsec', value: '4.2%', score: 85, highlight: false, note: 'Noticeable background footprint' },
    { name: 'AnyDesk', value: '9.4%', score: 62, highlight: false, note: 'Spikes during rapid window redraws' },
    { name: 'RustDesk', value: '11.8%', score: 52, highlight: false, note: 'CPU software encoding fallback' },
    { name: 'TeamViewer', value: '14.2%', score: 40, highlight: false, note: 'Heavy background telemetry hooks' },
    { name: 'Chrome Remote', value: '18.6%', score: 30, highlight: false, note: 'Chrome renderer thread consumption' },
  ],
}

const WORKFLOW_SCENARIOS = [
  {
    title: 'Emergency Production Hotfix on Mobile',
    badge: 'Helvia Remote (/m/)',
    subtitle: 'Fixing a critical Docker outage from your phone while in transit',
    context: 'At 10:45 PM, a Kubernetes pod crash alerted on PagerDuty. The on-call engineer had no laptop.',
    solution: 'Opened Helvia /m/ on iPhone, enabled Lock Mode (🔒) to prevent swipe backs, used Stop Typing emergency killswitch to cleanly paste the patch script, and restarted services in 90 seconds.',
    metrics: [
      { label: 'Time to Resolution', value: '1m 32s' },
      { label: 'Client Software Installed', value: '0 MB' },
      { label: 'Input Lag', value: '< 24 ms' }
    ],
    codeSnippet: 'docker-compose -f prod-cluster.yml restart ingress-gateway\n# Health check confirmed OK [200]',
  },
  {
    title: 'Confidential Enterprise Technical Assessment',
    badge: 'Executive Meeting Copilot',
    subtitle: 'Structuring complex distributed systems trade-offs with 100% private display guidance',
    context: 'The architect was asked about Raft split-brain leader elections during a live Zoom screen share architectural assessment.',
    solution: 'Helvia Copilot ingested the interviewer speech in sub-18ms and displayed structured talking points. The Executive HUD was completely excluded from the Zoom screen share via hardware display affinity (WDA_EXCLUDEFROMCAPTURE).',
    metrics: [
      { label: 'Display Capture Privacy', value: '100% Excluded' },
      { label: 'Audio Ingestion Lag', value: '< 18 ms' },
      { label: 'Assessment Outcome', value: 'Approved & Offered' }
    ],
    codeSnippet: '💡 Executive Briefing Points:\n1. Quorum consensus with Raft/Paxos (N/2 + 1)\n2. Generation fencing tokens to invalidate stale zombie writes\n3. Consul/etcd lease TTL monitoring',
  },
  {
    title: 'Mass Job Hunt Autopilot with Custom Resumes',
    badge: 'Auto Apply Autopilot',
    subtitle: 'Applying to 300+ Senior Engineering roles over the weekend with tailored resumes',
    context: 'Searching for high-paying roles across LinkedIn, Indeed, Greenhouse, and Lever was taking 20+ hours a week.',
    solution: 'Set Auto Apply filters for "Senior Backend / Full Stack". The agent dynamically adjusted bullet points, keywords, and skill ordering for every single job description and submitted 48 applications daily.',
    metrics: [
      { label: 'Resumes Tailored', value: '312 Dynamic' },
      { label: 'ATS Match Average', value: '98.4%' },
      { label: 'Interview Callbacks', value: '14 Scheduled' }
    ],
    codeSnippet: 'Matched JD: "Staff Go Engineer @ Stripe" -> Emphasized WebRTC, P2P & Goroutines\nStatus: Submitted via Greenhouse API [Interview Requested]',
  },
  {
    title: 'High-Pressure Enterprise Client Discovery',
    badge: 'Helvia Meeting Copilot',
    subtitle: 'Instant competitor facts, pricing data & objection handles whispered live',
    context: 'A prospect asked tough architecture and pricing questions comparing enterprise latency benchmarks in Google Meet.',
    solution: 'Helvia Copilot whispered direct competitive talking points, SLA metrics, and proof points in real time without any bot joining the call or notifying participants.',
    metrics: [
      { label: 'Audio Latency', value: '120 ms' },
      { label: 'Objection Accuracy', value: '99.8%' },
      { label: 'Client Trust', value: 'Maximum' }
    ],
    codeSnippet: 'Whispered: "Highlight our sub-15ms direct glass-to-glass speed and zero client install compared to legacy tools."',
  },
  {
    title: 'System Design Mock Interview Coach',
    badge: 'AI Interview Practicer',
    subtitle: 'Simulating high-stakes mock interviews with real-time scoring & feedback',
    context: 'Preparing for an upcoming technical screening on designing scalable streaming platforms like Netflix.',
    solution: 'Practiced against the AI Interview Coach. The simulator asked progressive follow-ups on CDN caching, adaptive bitrate algorithms, and scored answers with targeted feedback.',
    metrics: [
      { label: 'Practice Score', value: '94 / 100' },
      { label: 'Rounds Simulated', value: '12 Drills' },
      { label: 'Confidence Boost', value: '10x' }
    ],
    codeSnippet: 'AI Coach Rubric: "Great depth on HLS chunking and consistent hashing. Next round: dig deeper into CDN edge cache eviction strategies."',
  },
]

const FAQS = [
  {
    q: 'Are all 3 apps (Remote Desktop, Meeting Copilot, Auto Apply) included in one unified subscription?',
    a: 'Yes! Every paid plan (Standard $8, Pro+ $15, Max+ $25, Ultra+ $35, and Lifetime $49) gives you unified access to all 3 platforms in one single account. You receive bundled pools of Remote Desktop minutes, live AI Copilot answer credits ("Ans 💡" & meeting whisperer), and Auto Apply job application quotas.',
  },
  {
    q: 'How is Helvia Meeting Copilot 100% invisible during Zoom, Teams, and Google Meet screenshares?',
    a: 'Helvia utilizes native Windows hardware display affinity (WDA_EXCLUDEFROMCAPTURE) and low-level transparent overlay layering. Video conferencing software (Zoom, Microsoft Teams, Google Meet, Slack, Discord) and screen capture recording APIs strictly cannot capture or see the Copilot HUD, keeping your answers completely private.',
  },
  {
    q: 'How does the Auto Apply resume tailoring engine beat ATS filters?',
    a: 'Unlike generic bots that spam the exact same static PDF, Helvia\'s autonomous career agent reads your master profile and compares it directly against each target job description. It dynamically re-orders your skills, emphasizes relevant metrics, and incorporates critical ATS keywords so your resume consistently achieves a 95%+ match score.',
  },
  {
    q: 'Can I use the AI Interview Practicer before my actual live interviews?',
    a: 'Absolutely! The built-in AI Interview Coach allows you to rehearse system design, algorithmic coding, and behavioral STAR-format questions. It gives you instant rubric scores, points out potential blind spots, and suggests stronger phrasing before you face the real interviewer.',
  },
  {
    q: 'How does Helvia Remote bypass background throttling and capture detection?',
    a: 'Helvia Remote utilizes native Windows API hooks and kernel-level IOCTL controls combined with DirectX Desktop Duplication API (DXGI DDA). It bypasses standard Windows GDI capture flags (which notify recording software) and invokes SetThreadExecutionState to prevent background process throttling even when the host PC is locked or in sleep mode.',
  },
  {
    q: 'Is my video stream, meeting audio, or resume data stored or sold?',
    a: 'Never. Helvia operates under a strict privacy-first architecture. Remote desktop sessions use direct Peer-to-Peer AES-256-GCM / DTLS 1.3 encryption. Meeting audio is processed ephemerally for instant transcription and never retained. Your resume data is exclusively used for your autonomous job applications and is never sold.',
  },
  {
    q: 'What makes the zero-install web controller faster than native desktop apps?',
    a: 'Helvia connects directly between your browser and your host machine using WebRTC P2P data channels with zero middleman buffering. Your browser decodes hardware-accelerated VP9/AV1 video directly via your GPU in WebGL/WebGPU, yielding glass-to-glass latency under 20ms.',
  },
  {
    q: 'Can I upgrade or recharge my quotas at any time?',
    a: 'Yes! From your account dashboard, you can upgrade your plan or recharge extra Remote Desktop minutes, AI answers, or Auto Apply credits with a single click via Razorpay (UPI, Cards, NetBanking with discounts) or Dodo Payments internationally.',
  },
]

const FORMAT_PRESETS: Record<'star' | 'executive' | 'rca' | 'objection', { name: string; style: string; example: string; present: string; output: string }> = {
  star: {
    name: 'STAR Format',
    style: 'Bullet points, line by line, STAR framework (Problem/Solution/What to say)',
    example: '• 1. The Problem: Database connection pool was starved during peak load.\n• 2. The Solution: Introduced Redis in-memory cache layer.\n• 3. What to say: "We cut latency by 90% with zero downtime."',
    present: 'Servers crashed under traffic spikes so we added Redis caching to cut database load by 90%',
    output: '• 1. The Problem: Thousands of simultaneous visitors overwhelmed the database during sudden traffic spikes.\n• 2. The Solution: Store frequently requested pages in fast temporary memory (caching) so the database does not get overloaded.\n• 3. What to say: "By caching our most popular searches in memory, we cut server load by 90% during our biggest product launch."'
  },
  executive: {
    name: 'Executive Pitch',
    style: 'Line by line, high-level business impact, metric at risk, 30-sec pitch',
    example: '• 1. Metric At Risk: Cloud spend scaling at $50k/month.\n• 2. Strategic Decision: Migrated 14 services to container auto-scaling.\n• 3. What to say: "I slashed our hosting bill by 35% with zero downtime."',
    present: 'Cloud hosting bill was $50k/month so we migrated 14 services to auto-scaling containers saving 35%',
    output: '• 1. Metric At Risk: Legacy cloud infrastructure spending was scaling unsustainably at $50,000/month.\n• 2. Strategic Decision: Re-architected monolithic apps into lightweight auto-scaling container clusters.\n• 3. What to say: "I spearheaded our container migration across 14 services, slashing our monthly cloud hosting bill by 35% with zero service disruption."'
  },
  rca: {
    name: 'System RCA',
    style: 'Technical root cause analysis, bullet points, line by line, engineering fix',
    example: '• 1. Root Cause: Unbounded connection buffers in websocket listener.\n• 2. Architectural Fix: Enforced backpressure rate-limiting.\n• 3. What to say: "We isolated the leak and restored throughput in 8 minutes."',
    present: 'Memory leak in websocket connection pool caused checkout gateway timeout during Black Friday',
    output: '• 1. Root Cause: Unbounded connection buffers in the checkout websocket listener caused heap starvation.\n• 2. Architectural Fix: Enforced backpressure rate-limiting and automatic idle connection garbage collection.\n• 3. What to say: "We identified an unbounded buffer leak during peak checkout, implemented backpressure throttling, and restored full transactional throughput in 8 minutes."'
  },
  objection: {
    name: 'Objection Handle',
    style: 'Line by line objection handling, empathy first, hard proof, confident script',
    example: '• 1. Acknowledge Concern: Data privacy is non-negotiable for enterprise.\n• 2. Hard Proof: Helvia runs zero cloud webhooks; processing is local.\n• 3. What to say: "Zero voice packets leave your machine, satisfying SOC-2."',
    present: 'Client worried our cloud software would leak confidential trade secrets',
    output: '• 1. Acknowledge Concern: Data confidentiality is non-negotiable for enterprise financial records.\n• 2. Hard Proof: Helvia runs zero cloud audio webhooks—everything executes on-device with ring-0 kernel loopback capture.\n• 3. What to say: "We completely isolate audio processing to your local workstation. Zero voice packets ever leave your machine, meeting strict SOC-2 compliance."'
  }
}

const COPILOT_PRACTICAL_QUESTIONS = [
  {
    q: 'How do you keep servers running when one computer crashes unexpectedly?',
    badge: 'Server Reliability',
    star: [
      '• 1. The Problem: When a main server goes down, user traffic can get dropped or websites can go offline.',
      '• 2. The Solution: Set up automated backup servers so when the main server fails, traffic switches to a backup instantly.',
      '• 3. What to say: "In my last role, we set up automatic failover so our website stayed online 99.99% of the time with zero downtime."'
    ]
  },
  {
    q: 'How do you prevent a website from slowing down or crashing during sudden traffic spikes?',
    badge: 'High Traffic Spikes',
    star: [
      '• 1. The Problem: Thousands of simultaneous visitors can overwhelm the database and make pages load very slowly.',
      '• 2. The Solution: Store frequently requested pages in fast temporary memory (caching) so the database does not get overloaded.',
      '• 3. What to say: "By caching our most popular searches in memory, we cut server load by 90% during our biggest product launch."'
    ]
  },
  {
    q: 'How do you make sure user logins and company data stay completely safe?',
    badge: 'Account Security',
    star: [
      '• 1. The Problem: Weak passwords or shared networks can allow unauthorized people to access sensitive company files.',
      '• 2. The Solution: Verify identity on every request with multi-factor logins and digital keys that expire automatically.',
      '• 3. What to say: "We set up two-step verification and automatic key rotation so unauthorized access was blocked across all internal tools."'
    ]
  }
]

const TALENT_PRACTICAL_JOBS = [
  {
    company: 'Stripe',
    role: 'Senior Software Engineer',
    portal: 'Greenhouse',
    originalScore: 62,
    optimizedScore: 98.4,
    keywords: ['System Architecture', 'Database Optimization', 'High Traffic Scaling', 'Go & Rust'],
    drillQuestion: 'How did you keep financial transactions fast and reliable when website traffic tripled?',
    drillAnswer: 'I moved busy calculations into fast memory and batched our database saves, which cut response times by 40% during peak hours.',
    score: '98/100',
    rubric: 'Great Specifics & Clear Impact'
  },
  {
    company: 'Cloudflare',
    role: 'Cloud Infrastructure Architect',
    portal: 'Lever',
    originalScore: 65,
    optimizedScore: 99.1,
    keywords: ['Cloud Security', 'Fast Web Delivery', 'Network Routing', 'High Availability'],
    drillQuestion: 'How do you stop malicious web traffic attacks without slowing down real users?',
    drillAnswer: 'I configured smart packet filters at our network edge to drop bad requests before they hit our main servers, keeping 100% uptime for customers.',
    score: '99/100',
    rubric: 'Clear Explanation & Strong Architecture'
  },
  {
    company: 'Scale AI',
    role: 'AI Platform Engineer',
    portal: 'Workday',
    originalScore: 59,
    optimizedScore: 98.8,
    keywords: ['AI Model Training', 'Cloud Clusters', 'GPU Performance', 'Python & Kubernetes'],
    drillQuestion: 'How do you make sure multiple AI models training at the same time don\'t slow each other down?',
    drillAnswer: 'I separated server memory channels and set up dedicated communication lanes, preventing bottlenecks and speeding up model training by 35%.',
    score: '97/100',
    rubric: 'Practical Solution & Structured Delivery'
  }
]


export const LandingPage: React.FC<LandingPageProps> = ({
  signInWithGoogle,
  isSupabaseConfigured,
  isAuthLoading,
  plans,
  startUpgrade,
  startTopup,
  startDodoUpgrade,
  isSignedIn,
  userPlan,
}) => {
  const navigate = useNavigate()
  const observerRef = useRef<IntersectionObserver | null>(null)

  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<DbPlan | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const handleRazorpayUpgrade = (p: DbPlan, couponCode?: string, customAmountInr?: number) => {
    setIsPaymentModalOpen(false)
    if (!isSignedIn) {
      if (!isSupabaseConfigured || isAuthLoading) return
      signInWithGoogle()
      return
    }
    if (startUpgrade) {
      startUpgrade(p, couponCode, customAmountInr)
    } else {
      navigate('/dashboard')
    }
  }

  const handleDodoUpgrade = (p: DbPlan, couponCode?: string) => {
    setIsPaymentModalOpen(false)
    if (!isSignedIn) {
      if (!isSupabaseConfigured || isAuthLoading) return
      signInWithGoogle()
      return
    }
    if (startDodoUpgrade) {
      startDodoUpgrade(p.dodo_product_id || undefined, couponCode)
    } else {
      navigate('/dashboard')
    }
  }

  const handleTopup = (type: 'copilot' | 'autoapply', units: number) => {
    if (!isSignedIn) {
      if (!isSupabaseConfigured || isAuthLoading) return
      signInWithGoogle()
      return
    }
    if (startTopup) {
      startTopup(type, units)
    } else {
      navigate('/dashboard')
    }
  }

  useEffect(() => {
    if (isSignedIn) {
      navigate('/dashboard', { replace: true })
    }
  }, [isSignedIn, navigate])

  const [quickConnectCode, setQuickConnectCode] = useState('')
  const [activeControllerTab, setActiveControllerTab] = useState<'remote' | 'copilot' | 'autoapply'>('remote')
  const [remoteSubTab, setRemoteSubTab] = useState<'mobile' | 'desktop'>('mobile')
  const [touchpadStatus, setTouchpadStatus] = useState<string>('Touchpad Active • 60 FPS Direct Pan')
  const [touchpadLocked, setTouchpadLocked] = useState<boolean>(true)
  const [copilotQuestionIdx, setCopilotQuestionIdx] = useState<number>(0)
  const [copilotShieldActive, setCopilotShieldActive] = useState<boolean>(true)
  const [copilotCopied, setCopilotCopied] = useState<boolean>(false)
  const [formatActivePreset, setFormatActivePreset] = useState<'star' | 'executive' | 'rca' | 'objection'>('star')
  const [formatStyleInput, setFormatStyleInput] = useState<string>(
    'Bullet points, line by line, first-person spoken pitch, under 60 words'
  )
  const [formatExampleInput, setFormatExampleInput] = useState<string>(
    '• 1. The Problem: Database connection pool was starved during peak load.\n• 2. The Solution: Introduced Redis in-memory cache layer.\n• 3. What to say: "We cut latency by 90% with zero downtime."'
  )
  const [presentAnswerInput, setPresentAnswerInput] = useState<string>(
    'Servers crashed under traffic spikes so we added Redis caching to cut database load by 90%'
  )
  const [synthesizedFormatAnswer, setSynthesizedFormatAnswer] = useState<string>(
    '• 1. The Problem: Thousands of simultaneous visitors overwhelmed the database during sudden traffic spikes.\n• 2. The Solution: Store frequently requested pages in fast temporary memory (caching) so the database does not get overloaded.\n• 3. What to say: "By caching our most popular searches in memory, we cut server load by 90% during our biggest product launch."'
  )
  const [isFormatGenerating, setIsFormatGenerating] = useState<boolean>(false)
  const [formatCopied, setFormatCopied] = useState<boolean>(false)

  const handleFormatWhatToSay = () => {
    setIsFormatGenerating(true)
    setTimeout(() => {
      const styleText = formatStyleInput.trim()
      const exampleText = formatExampleInput.trim()
      const presentText = presentAnswerInput.trim()

      if (formatActivePreset && FORMAT_PRESETS[formatActivePreset] &&
          styleText === FORMAT_PRESETS[formatActivePreset].style &&
          exampleText === FORMAT_PRESETS[formatActivePreset].example &&
          presentText === FORMAT_PRESETS[formatActivePreset].present) {
        setSynthesizedFormatAnswer(FORMAT_PRESETS[formatActivePreset].output)
      } else {
        // Extract step headers from the example text (e.g. 1. The Problem, 2. The Solution, 3. What to say)
        const exampleLines = exampleText.split(/\r?\n|•/).map(p => p.trim()).filter(Boolean)
        const isBulletRequested = /bullet|line by line|points/i.test(styleText)
        const prefix = isBulletRequested ? '• ' : ''

        let probPart = presentText
        let solPart = presentText
        if (/(\bso\b|\btherefore\b|\bto resolve\b|\bbecause\b)/i.test(presentText)) {
          const split = presentText.split(/(\bso\b|\btherefore\b|\bto resolve\b|\bbecause\b)/i)
          probPart = split[0].trim()
          solPart = split.slice(2).join('').trim() || probPart
        }

        if (exampleLines.length > 0) {
          const result = exampleLines.map((line, idx) => {
            const cleanHeader = line.split(':')[0].replace(/^(\d+[\.\)\-\s]*|[•\-\*]\s*)/, '').trim() || `Step ${idx + 1}`
            const lower = cleanHeader.toLowerCase()

            if (lower.includes('problem') || lower.includes('issue') || lower.includes('metric') || lower.includes('root cause') || lower.includes('situation') || lower.includes('concern')) {
              return `${prefix}${idx + 1}. ${cleanHeader}: Critical bottleneck: ${probPart}.`
            } else if (lower.includes('solution') || lower.includes('fix') || lower.includes('decision') || lower.includes('action') || lower.includes('proof') || lower.includes('task')) {
              return `${prefix}${idx + 1}. ${cleanHeader}: Implementation: ${solPart || 'Engineered automated caching and failover architecture'}.`
            } else if (lower.includes('what to say') || lower.includes('say') || lower.includes('pitch') || lower.includes('speak') || lower.includes('script')) {
              const cleanSpeech = presentText.replace(/^(we\s+|i\s+)/i, '')
              return `${prefix}${idx + 1}. ${cleanHeader}: "In my previous experience, we solved this by ${cleanSpeech}, ensuring zero disruption and 99.99% availability."`
            } else {
              return `${prefix}${idx + 1}. ${cleanHeader}: Applied to context: "${presentText}".`
            }
          }).join('\n')
          setSynthesizedFormatAnswer(result)
        } else {
          setSynthesizedFormatAnswer(`${prefix}1. What to say: "In my recent role, we addressed this by ${presentText.replace(/^we\s+|^i\s+/i, '')}, maintaining 99.99% uptime."`)
        }
      }
      setIsFormatGenerating(false)
    }, 250)
  }
  const [talentJobIdx, setTalentJobIdx] = useState<number>(0)
  const [talentSubmitted, setTalentSubmitted] = useState<boolean>(false)
  const [activeAiTab, setActiveAiTab] = useState<'remote' | 'copilot' | 'autoapply'>('remote')
  const [selectedAppFilter, setSelectedAppFilter] = useState<'all' | 'remote' | 'copilot' | 'autoapply'>('all')
  const [activeDeepDiveApp, setActiveDeepDiveApp] = useState<'remote' | 'copilot' | 'autoapply'>('remote')


  // Interactive sections state
  const [activeTelemetryTab, setActiveTelemetryTab] = useState<'interview' | 'autoapply' | 'remote'>('interview')
  const [activeBenchmarkTab, setActiveBenchmarkTab] = useState<'stealth' | 'resumeMatch' | 'latency' | 'cpu'>('stealth')
  const [activeScenario, setActiveScenario] = useState<number>(0)
  const [openFaq, setOpenFaq] = useState<Record<number, boolean>>({ 0: true })
  const [roiTeamSize, setRoiTeamSize] = useState<number>(6)
  const [roiHoursPerWeek, setRoiHoursPerWeek] = useState<number>(10)
  const [nodeFilter, setNodeFilter] = useState<'all' | 'na' | 'eu' | 'apac'>('all')

  // 3D Morning to Night Sky Engine State (Starts at Early Morning Dawn!)
  const [scrollProgress, setScrollProgress] = useState(0)

  const skyTheme =
    scrollProgress < 0.20 ? 'dawn' :
    scrollProgress < 0.48 ? 'morning' :
    scrollProgress < 0.74 ? 'sunset' : 'night'

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
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.01, rootMargin: '0px 0px 120px 0px' }
    )
    observerRef.current = observer

    const observeAll = () => {
      const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
      revealElements.forEach((el) => {
        if (!el.classList.contains('visible')) {
          observer.observe(el)
        }
      })
    }
    observeAll()

    const mutationObserver = new MutationObserver(() => {
      observeAll()
    })
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [])

  const toggleFaq = (index: number) => {
    setOpenFaq(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const filteredNodes = nodeFilter === 'all' 
    ? EDGE_NODES 
    : EDGE_NODES.filter(n => n.region === nodeFilter)

  // Calculations for ROI
  const hoursSavedPerMonth = Math.round(roiTeamSize * roiHoursPerWeek * 1.5)
  const annualDollarSavings = roiTeamSize * 780

  return (
    <>
      {/* 3D Morning to Night Dynamic Sky Canvas */}
      <SkyCanvas3D scrollProgress={scrollProgress} />

      {/* Hero Section - Early Morning Dawn Sky UI */}
      <section className="hero-peaceful-section reveal">
        <div className="hero-peaceful-content">
          <div className="peace-eyebrow-pill">
            <span className="eyebrow-dot"></span>
            <span>ENTERPRISE INFRASTRUCTURE</span>
            <span className="eyebrow-divider">•</span>
            <span>EXECUTIVE MEETING INTELLIGENCE</span>
            <span className="eyebrow-divider">•</span>
            <span className="eyebrow-highlight">TALENT MOBILITY</span>
          </div>

          <h1 className="hero-peace-heading">
            Unified Professional Infrastructure. <span className="serif-highlight">Engineered for Performance &amp; Trust.</span>
          </h1>

          <p className="hero-peace-subtitle">
            Helvia unites three enterprise-grade platforms into a unified subscription: zero-trust 60 FPS remote desktop access, real-time executive meeting intelligence with hardware display capture privacy, and data-driven ATS resume optimization with structured competency interview training.
          </p>

          {/* Triple-App Hero Launchpad */}
          <div className="hero-3apps-launchpad">
            <div className="hero-launchpad-grid">
              {/* App 1: Helvia Remote */}
              <div className="hero-launchpad-card card-remote">
                <div className="launchpad-card-header">
                  <span className="launchpad-badge remote">PLATFORM 01 • ZERO-TRUST REMOTE ACCESS</span>
                  <div className="launchpad-icon-wrap remote"><MonitorIcon /></div>
                </div>
                <h3 className="launchpad-title">Helvia Remote Desktop</h3>
                <p className="launchpad-desc">Hardware-accelerated 60 FPS remote workstation access with end-to-end AES-256 encryption and sub-15ms glass-to-glass latency.</p>
                <div className="launchpad-preview-pill">
                  <span className="sim-dot-green"></span>
                  <span>Direct P2P • 15ms Latency • SOC-2 Type II Standards</span>
                </div>
                <div className="launchpad-actions">
                  <a 
                    href="https://pub-4ec430c8cdbd49ffb57191dca016c43b.r2.dev/Helvia%20Remote%20Setup%200.1.0.exe"
                    className="launchpad-btn blue"
                    title="Download Windows Host (.exe)"
                  >
                    <span>Download Host (.exe)</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  </a>
                  <form className="launchpad-quick-pin" onSubmit={handleQuickConnect}>
                    <input 
                      type="text" 
                      placeholder="6-digit PIN (e.g. 942-817)..." 
                      value={quickConnectCode}
                      onChange={(e) => setQuickConnectCode(e.target.value)}
                      className="launchpad-pin-input"
                    />
                    <button type="submit" className="launchpad-pin-btn">Connect</button>
                  </form>
                </div>
              </div>

              {/* App 2: Meeting Copilot */}
              <div className="hero-launchpad-card card-copilot">
                <div className="launchpad-card-header">
                  <span className="launchpad-badge copilot">PLATFORM 02 • EXECUTIVE INTELLIGENCE</span>
                  <div className="launchpad-icon-wrap copilot"><GhostIcon /></div>
                </div>
                <h3 className="launchpad-title">Helvia Executive Copilot</h3>
                <p className="launchpad-desc">Real-time speech intelligence, automated briefing notes, and structured executive talking points with hardware-level display capture privacy.</p>
                <div className="launchpad-preview-pill">
                  <span className="app-dot purple"></span>
                  <span>🛡️ Hardware Capture Privacy • Sub-18ms Local Ingest</span>
                </div>
                <div className="launchpad-actions">
                  <button 
                    type="button"
                    className="launchpad-btn purple"
                    onClick={() => {
                      if (isSignedIn) navigate('/dashboard')
                      else signInWithGoogle()
                    }}
                  >
                    <span>Launch Executive Copilot</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </button>
                  <a href="#meeting-copilot" className="eco-secondary-btn" style={{ textAlign: 'center', textDecoration: 'none' }}>
                    <span>Explore Executive HUD</span>
                  </a>
                </div>
              </div>

              {/* App 3: Auto Apply & Interview Practicer */}
              <div className="hero-launchpad-card card-autoapply">
                <div className="launchpad-card-header">
                  <span className="launchpad-badge autoapply">PLATFORM 03 • TALENT MOBILITY &amp; ATS</span>
                  <div className="launchpad-icon-wrap autoapply"><FileTextIcon /></div>
                </div>
                <h3 className="launchpad-title">Helvia Talent Mobility</h3>
                <p className="launchpad-desc">Data-driven resume alignment with ATS parsing algorithms and structured competency-based interview preparation drills.</p>
                <div className="launchpad-preview-pill">
                  <span className="app-dot gold"></span>
                  <span>📄 99% ATS Compliance • Executive Interview Drills</span>
                </div>
                <div className="launchpad-actions">
                  <button 
                    type="button"
                    className="launchpad-btn gold"
                    onClick={() => {
                      if (isSignedIn) navigate('/dashboard')
                      else signInWithGoogle()
                    }}
                  >
                    <span>Launch Talent Mobility</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </button>
                  <a href="#auto-apply" className="eco-secondary-btn" style={{ textAlign: 'center', textDecoration: 'none' }}>
                    <span>Explore ATS Pipeline</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trusted Companies Banner */}
        <div className="trusted-companies-row" style={{ marginTop: '2rem' }}>
          <p className="trusted-title">TRUSTED BY ENGINEERING DIRECTORS, SYSADMINS &amp; ENTERPRISE PROFESSIONALS</p>
          <div className="company-pills-list">
            <span className="company-pill">DATALAYER INFRASTRUCTURE</span>
            <span className="company-pill">SCALEFLOW EDGE</span>
            <span className="company-pill active-pill">SYNAPSE LABS</span>
            <span className="company-pill">NEXUS ENTERPRISE</span>
            <span className="company-pill">HYPERGRID CLOUD</span>
          </div>
        </div>
      </section>

      {/* ALL 3 PRACTICALS AT THE SAME LEVEL - SIMULTANEOUS LIVE TESTBED */}
      <UnifiedSimultaneousPracticalsArena isSignedIn={isSignedIn} signInWithGoogle={signInWithGoogle} />

      {/* 3 INTEGRATED APPS SHOWCASE SECTION */}
      <section className="helvia-apps-ecosystem-section reveal" id="apps">
        <div className="section-header-center">
          <div className="ecosystem-badge-pill">
            <span className="pulse-dot-green"></span>
            <span>ENTERPRISE PLATFORM ECOSYSTEM</span>
            <span className="eyebrow-divider">•</span>
            <span className="highlight-pill-text">ALL IN ONE ACCOUNT</span>
          </div>
          <h2 className="ecosystem-main-title">
            One Unified Suite. <span className="gradient-highlight">Three Enterprise Platforms.</span>
          </h2>
          <p className="ecosystem-subtitle">
            Engineered for enterprise reliability, executive privacy, and career mobility — whether you manage high-throughput remote infrastructure, require confidential meeting advisory, or seek data-driven talent advancement.
          </p>

          {/* Interactive Filter Pills */}
          <div className="ecosystem-filter-bar">
            <button 
              type="button" 
              className={`eco-filter-tab ${selectedAppFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedAppFilter('all')}
            >
              <span>✨ View All 3 Platforms</span>
            </button>
            <button 
              type="button" 
              className={`eco-filter-tab ${selectedAppFilter === 'remote' ? 'active' : ''}`}
              onClick={() => setSelectedAppFilter('remote')}
            >
              <span>🖥️ 1. Helvia Remote Desktop</span>
            </button>
            <button 
              type="button" 
              className={`eco-filter-tab ${selectedAppFilter === 'copilot' ? 'active' : ''}`}
              onClick={() => setSelectedAppFilter('copilot')}
            >
              <span>🎙️ 2. Helvia Executive Copilot</span>
            </button>
            <button 
              type="button" 
              className={`eco-filter-tab ${selectedAppFilter === 'autoapply' ? 'active' : ''}`}
              onClick={() => setSelectedAppFilter('autoapply')}
            >
              <span>🚀 3. Helvia Talent Mobility &amp; ATS</span>
            </button>
          </div>
        </div>

        {/* 3-Cards Showcase Grid */}
        <div className="ecosystem-cards-grid">
          {/* APP 1: HELVIA REMOTE */}
          {(selectedAppFilter === 'all' || selectedAppFilter === 'remote') && (
            <div className="eco-app-card remote-card reveal stagger-1">
              <div className="eco-card-header">
                <div className="eco-app-badge remote">
                  <span className="app-dot blue"></span>
                  <span>PLATFORM 01 • ZERO-TRUST REMOTE ACCESS</span>
                </div>
                <div className="eco-app-icon-wrap blue-bg">
                  <MonitorIcon />
                </div>
              </div>

              <h3 className="eco-app-name">Helvia Remote Desktop</h3>
              <p className="eco-app-tagline">Zero-Trust Hardware-Accelerated Remote Desktop &amp; Workstation Control</p>
              
              <p className="eco-app-description">
                Direct hardware-level peer-to-peer control of your Windows PC from any smartphone, tablet, or browser. Operates with sub-15ms WebRTC response and complete background efficiency.
              </p>

              {/* Feature Checklist */}
              <div className="eco-features-list">
                <div className="eco-feat-item">
                  <div className="eco-check-icon blue"><CheckIcon /></div>
                  <div>
                    <strong>60 FPS P2P WebRTC Streaming:</strong> Glass-to-glass ultra-low latency without relay server lag.
                  </div>
                </div>
                <div className="eco-feat-item">
                  <div className="eco-check-icon blue"><CheckIcon /></div>
                  <div>
                    <strong>Zero-Install Mobile Touchpad:</strong> Full mouse navigation, click, and lock mode on iOS/Android.
                  </div>
                </div>
                <div className="eco-feat-item">
                  <div className="eco-check-icon blue"><CheckIcon /></div>
                  <div>
                    <strong>Low-Overhead Host Service:</strong> Native Windows service operates seamlessly without system lag or CPU throttling.
                  </div>
                </div>
                <div className="eco-feat-item">
                  <div className="eco-check-icon blue"><CheckIcon /></div>
                  <div>
                    <strong>Instant 6-Digit Linking:</strong> Pair any controller in seconds without installing client software.
                  </div>
                </div>
              </div>

              {/* Live Interactive UI Simulation Box */}
              <div className="eco-simulation-box remote-sim">
                <div className="eco-sim-topbar">
                  <span className="sim-dot-green"></span>
                  <span className="sim-host-name">DESKTOP-REMOTE-PRO</span>
                  <span className="sim-stat-pill">60.0 FPS • 12ms</span>
                </div>
                <div className="eco-sim-body">
                  <div className="sim-screen-preview">
                    <div className="sim-screen-inner">
                      <div className="sim-code-preview">
                        <code>P2P Encrypted Session Active [DTLS 1.3]</code>
                        <code>Host Status: Background Workstation Mode (0% CPU)</code>
                      </div>
                      <div className="sim-trackpad-hint">📱 Mobile Touchpad Linked</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="eco-card-footer">
                <a 
                  href="https://pub-4ec430c8cdbd49ffb57191dca016c43b.r2.dev/Helvia%20Remote%20Setup%200.1.0.exe"
                  className="eco-primary-btn blue"
                >
                  <span>Download Windows Host (.exe)</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </a>
                <button 
                  type="button" 
                  className="eco-secondary-btn"
                  onClick={() => {
                    const el = document.querySelector('.hero-quick-connect-bar input') as HTMLInputElement
                    if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                  }}
                >
                  <span>Enter Access Code</span>
                </button>
              </div>
            </div>
          )}

          {/* APP 2: HELVIA MEETING COPILOT */}
          {(selectedAppFilter === 'all' || selectedAppFilter === 'copilot') && (
            <div className="eco-app-card copilot-card reveal stagger-2">
              <div className="eco-card-header">
                <div className="eco-app-badge purple">
                  <span className="app-dot purple"></span>
                  <span>PLATFORM 02 • EXECUTIVE INTELLIGENCE</span>
                </div>
                <div className="eco-app-icon-wrap purple-bg">
                  <GhostIcon />
                </div>
              </div>

              <h3 className="eco-app-name">Helvia Executive Copilot</h3>
              <p className="eco-app-tagline">Real-Time Meeting Advisory &amp; Hardware Display Capture Privacy</p>
              
              <p className="eco-app-description">
                Your executive advisor for high-stakes leadership calls, technical evaluations, and board presentations. It transcribes discussions in real-time, synthesizes contextual talking points, and maintains absolute confidentiality via native OS display capture exclusion.
              </p>

              {/* Feature Checklist */}
              <div className="eco-features-list">
                <div className="eco-feat-item">
                  <div className="eco-check-icon purple"><CheckIcon /></div>
                  <div>
                    <strong>Hardware Screenshare Shield:</strong> Built on WDA_EXCLUDEFROMCAPTURE, ensuring private executive notes never leak to screenshares.
                  </div>
                </div>
                <div className="eco-feat-item">
                  <div className="eco-check-icon purple"><CheckIcon /></div>
                  <div>
                    <strong>Real-Time Speech Transcription:</strong> Direct local audio capture delivers sub-18ms transcription without cloud latency.
                  </div>
                </div>
                <div className="eco-feat-item">
                  <div className="eco-check-icon purple"><CheckIcon /></div>
                  <div>
                    <strong>Structured Executive Talking Points:</strong> Formats complex technical concepts into structured STAR bullets for articulate delivery.
                  </div>
                </div>
                <div className="eco-feat-item">
                  <div className="eco-check-icon purple"><CheckIcon /></div>
                  <div>
                    <strong>Zero Audio Echo or Loopback:</strong> Silent visual heads-up display ensures zero microphone feedback or audio disturbance.
                  </div>
                </div>
              </div>

              {/* Live Interactive UI Simulation Box */}
              <div className="eco-simulation-box copilot-sim">
                <div className="eco-sim-topbar">
                  <span className="sim-ghost-badge">🛡️ PRIVACY SHIELD: ACTIVE</span>
                  <span className="sim-screen-hidden-pill">SCREENSHARE EXCLUDED</span>
                </div>
                <div className="eco-sim-body">
                  <div className="copilot-hud-mock">
                    <div className="hud-incoming-q">
                      <span className="hud-q-icon"><MicIcon /></span>
                      <span className="hud-q-text">"How do you resolve distributed database split-brain scenarios?"</span>
                    </div>
                    <div className="hud-whisper-answer">
                      <span className="hud-ans-badge">💡 EXECUTIVE BRIEF &amp; TALKING POINTS</span>
                      <p className="hud-ans-lead">"1. Quorum-based consensus (Raft/Paxos). 2. Fencing tokens to invalidate partitioned leaders. 3. Cite practical Consul/etcd cluster topology."</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="eco-card-footer">
                <button 
                  type="button" 
                  className="eco-primary-btn purple"
                  onClick={() => {
                    if (isSignedIn) navigate('/dashboard')
                    else signInWithGoogle()
                  }}
                >
                  <span>Launch Executive Copilot</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
                <div className="eco-card-subtext">
                  <span>Included with Advisory Responses Quota</span>
                </div>
              </div>
            </div>
          )}

          {/* APP 3: AUTO APPLY & INTERVIEW PRACTICER */}
          {(selectedAppFilter === 'all' || selectedAppFilter === 'autoapply') && (
            <div className="eco-app-card autoapply-card reveal stagger-3">
              <div className="eco-card-header">
                <div className="eco-app-badge gold">
                  <span className="app-dot gold"></span>
                  <span>PLATFORM 03 • TALENT MOBILITY &amp; ATS</span>
                </div>
                <div className="eco-app-icon-wrap gold-bg">
                  <FileTextIcon />
                </div>
              </div>

              <h3 className="eco-app-name">Helvia Talent Mobility</h3>
              <p className="eco-app-tagline">Autonomous ATS Resume Optimization &amp; Competency Interview Training</p>
              
              <p className="eco-app-description">
                Accelerate career mobility with data-driven precision. The autonomous agent aligns your experience with target job algorithms across Greenhouse, Lever, and Workday, while the built-in Mock Interview Coach sharpens technical delivery.
              </p>

              {/* Feature Checklist */}
              <div className="eco-features-list">
                <div className="eco-feat-item">
                  <div className="eco-check-icon gold"><CheckIcon /></div>
                  <div>
                    <strong>99% ATS Match Optimization:</strong> Parses job descriptions in real time to dynamically inject required technical keywords and syntax.
                  </div>
                </div>
                <div className="eco-feat-item">
                  <div className="eco-check-icon gold"><CheckIcon /></div>
                  <div>
                    <strong>Multi-Portal Application Pipeline:</strong> Autonomously maps and formats submissions across enterprise job portals with human-emulated pace.
                  </div>
                </div>
                <div className="eco-feat-item">
                  <div className="eco-check-icon gold"><CheckIcon /></div>
                  <div>
                    <strong>Competency Interview Coach:</strong> Practice behavioral, coding, and system design rounds with instant rubric evaluation and scoring.
                  </div>
                </div>
                <div className="eco-feat-item">
                  <div className="eco-check-icon gold"><CheckIcon /></div>
                  <div>
                    <strong>Pipeline Status &amp; Analytics:</strong> Comprehensive dashboard tracking interview progression, application stages, and response rates.
                  </div>
                </div>
              </div>

              {/* Live Interactive UI Simulation Box */}
              <div className="eco-simulation-box autoapply-sim">
                <div className="eco-sim-topbar">
                  <span className="sim-dot-gold"></span>
                  <span className="sim-host-name">AUTONOMOUS TALENT AGENT</span>
                  <span className="sim-stat-pill gold">48 SUBMISSIONS ACTIVE</span>
                </div>
                <div className="eco-sim-body">
                  <div className="autoapply-metrics-row">
                    <div className="autoapply-stat-card">
                      <span className="stat-num">98%</span>
                      <span className="stat-sub">Resume Match Score</span>
                    </div>
                    <div className="autoapply-stat-card">
                      <span className="stat-num">AI Coach</span>
                      <span className="stat-sub">Interview Drill Ready</span>
                    </div>
                  </div>
                  <div className="autoapply-recent-badge">
                    <span>📄 Last Tailored: "Staff Systems Engineer" • Applied</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="eco-card-footer">
                <button 
                  type="button" 
                  className="eco-primary-btn gold"
                  onClick={() => {
                    if (isSignedIn) navigate('/dashboard')
                    else signInWithGoogle()
                  }}
                >
                  <span>Launch Talent Mobility</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
                <div className="eco-card-subtext">
                  <span>Included with Job Auto-Apply Quota</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Unified Ecosystem Account Banner */}
        <div className="ecosystem-unified-banner reveal">
          <div className="unified-banner-content">
            <div className="unified-banner-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <div className="unified-banner-text">
              <h4>All 3 Enterprise Platforms Unified in One Subscription</h4>
              <p>Your single Helvia account seamlessly unlocks <strong>Helvia Remote Desktop</strong> (session minutes), <strong>Executive Copilot</strong> (advisory responses), and <strong>Talent Mobility</strong> (application submissions). One predictable invoice with zero hidden tiers.</p>
            </div>
          </div>
          <div className="unified-banner-action">
            <button 
              type="button" 
              className="unified-banner-cta-btn"
              onClick={() => {
                const el = document.getElementById('pricing')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
                else if (isSignedIn) navigate('/dashboard')
                else signInWithGoogle()
              }}
            >
              <span>View Unified Plans</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      </section>

      {/* Enterprise Platform Capabilities — Dark Formal Design */}
      <section className="enterprise-capabilities-section reveal" id="features">
        <div className="enterprise-cap-container">
          <div className="section-header text-center" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="badge-tag" style={{ background: 'rgba(37, 99, 235, 0.08)', color: '#2563eb', border: '1px solid rgba(37, 99, 235, 0.2)', display: 'inline-flex', marginBottom: '1rem' }}>
              <span>THREE PLATFORMS • ONE SUBSCRIPTION • ZERO OVERHEAD</span>
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 3.8vw, 2.75rem)', fontWeight: 850, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: '1rem' }}>
              What You Get With Helvia
            </h2>
            <p style={{ maxWidth: 780, margin: '0 auto', fontSize: '1.08rem', color: '#475569', lineHeight: 1.7 }}>
              Three enterprise-grade tools that work independently or together. No bloat, no vendor lock-in, no per-seat licensing traps.
            </p>
          </div>

          <div className="enterprise-cap-grid">
            {/* Platform 1: Helvia Remote */}
            <div className="enterprise-cap-card">
              <div className="cap-card-header">
                <div className="cap-icon-wrap blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                </div>
                <span className="cap-platform-tag blue">HELVIA REMOTE</span>
              </div>
              <h3 className="cap-card-title">Control Any Workstation From Anywhere</h3>
              <p className="cap-card-desc">
                60 FPS hardware-accelerated remote desktop with sub-15ms latency. No client install needed — works directly from any browser or mobile device over encrypted P2P WebRTC.
              </p>
              <ul className="cap-card-metrics">
                <li>
                  <span className="cap-metric-value">&lt; 15ms</span>
                  <span className="cap-metric-label">Glass-to-Glass Latency</span>
                </li>
                <li>
                  <span className="cap-metric-value">60 FPS</span>
                  <span className="cap-metric-label">Hardware GPU Streaming</span>
                </li>
                <li>
                  <span className="cap-metric-value">0 MB</span>
                  <span className="cap-metric-label">Client-Side Install</span>
                </li>
              </ul>
            </div>

            {/* Platform 2: Helvia Interview & Copilot */}
            <div className="enterprise-cap-card">
              <div className="cap-card-header">
                <div className="cap-icon-wrap purple">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                </div>
                <span className="cap-platform-tag purple">HELVIA INTERVIEW</span>
              </div>
              <h3 className="cap-card-title">Invisible Meeting Intelligence</h3>
              <p className="cap-card-desc">
                Real-time executive speech advisory and meeting copilot that captures live audio and generates structured talking points — completely invisible to screenshare via hardware display exclusion.
              </p>
              <ul className="cap-card-metrics">
                <li>
                  <span className="cap-metric-value">&lt; 18ms</span>
                  <span className="cap-metric-label">Audio Transcription</span>
                </li>
                <li>
                  <span className="cap-metric-value">100%</span>
                  <span className="cap-metric-label">Screenshare Invisible</span>
                </li>
                <li>
                  <span className="cap-metric-value">Ring-0</span>
                  <span className="cap-metric-label">Hardware Display Hook</span>
                </li>
              </ul>
            </div>

            {/* Platform 3: Helvia Auto Apply */}
            <div className="enterprise-cap-card">
              <div className="cap-card-header">
                <div className="cap-icon-wrap gold">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <span className="cap-platform-tag gold">HELVIA AUTO APPLY</span>
              </div>
              <h3 className="cap-card-title">Autonomous Career Progression</h3>
              <p className="cap-card-desc">
                AI agent that auto-applies to matching roles with dynamically tailored resumes optimized for ATS scoring, paired with structured competency mock interview training.
              </p>
              <ul className="cap-card-metrics">
                <li>
                  <span className="cap-metric-value">98%</span>
                  <span className="cap-metric-label">ATS Match Rate</span>
                </li>
                <li>
                  <span className="cap-metric-value">Multi-Board</span>
                  <span className="cap-metric-label">Autonomous Submissions</span>
                </li>
                <li>
                  <span className="cap-metric-value">AI Coach</span>
                  <span className="cap-metric-label">Mock Interview Scoring</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Unified Account Banner */}
          <div className="enterprise-unified-strip">
            <div className="unified-strip-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div className="unified-strip-text">
              <strong>One Account. One Invoice. Zero Telemetry.</strong>
              <span>Single Google OAuth login pools remote minutes, advisory responses, and application quotas across all three platforms with no third-party tracking.</span>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Live Global P2P ICE Mesh & Real-Time Node Matrix */}
      {/* NEW: Live Multi-Platform Engine Telemetry & Performance Matrix */}
      <section className="network-telemetry-section reveal" id="live-mesh">
        <div className="edge-telemetry-card">
          <div className="edge-telemetry-header">
            <div className="edge-badge">
              <ActivityIcon />
              <span>LIVE MULTI-PLATFORM ENGINE TELEMETRY</span>
            </div>
            <h2>Real-Time Engine Telemetry &amp; Performance Matrix</h2>
            <p className="muted">
              Live operational metrics across Helvia's Executive Interview Intelligence, Autonomous ATS Pipeline, and Zero-Trust Remote Mesh.
            </p>

            {/* Platform Selector Nav */}
            <div className="telemetry-platform-tabs">
              <button 
                className={`telemetry-tab-btn ${activeTelemetryTab === 'interview' ? 'active' : ''}`} 
                onClick={() => setActiveTelemetryTab('interview')}
              >
                🎙️ Helvia Interview &amp; Copilot
              </button>
              <button 
                className={`telemetry-tab-btn ${activeTelemetryTab === 'autoapply' ? 'active' : ''}`} 
                onClick={() => setActiveTelemetryTab('autoapply')}
              >
                🚀 Auto Apply &amp; ATS Pipeline
              </button>
              <button 
                className={`telemetry-tab-btn ${activeTelemetryTab === 'remote' ? 'active' : ''}`} 
                onClick={() => setActiveTelemetryTab('remote')}
              >
                🖥️ Remote P2P ICE Mesh
              </button>
            </div>
          </div>

          {/* Tab 1: Executive Interview Intelligence Telemetry */}
          {activeTelemetryTab === 'interview' && (
            <div className="interview-telemetry-board telemetry-tab-pane">
              <div className="interview-telemetry-top">
                <div className="interview-telemetry-status">
                  <span className="live-audio-dot pulse-purple"></span>
                  <strong>Live Call Audio Ingest: Zoom Session Active</strong>
                  <span className="telemetry-chip purple">WDA_EXCLUDEFROMCAPTURE: 100% INVISIBLE</span>
                </div>
                <div className="interview-latency-badge">
                  <span className="bolt-icon">⚡</span> Sub-18ms Inference • Ring-0 Audio Hook
                </div>
              </div>

              <div className="interview-telemetry-main-grid">
                {/* Audio Waveform & Speaker Card */}
                <div className="interview-stream-card">
                  <div className="stream-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="speaker-avatar">SJ</span>
                      <div>
                        <strong>Sarah J. (Lead Technical Interviewer)</strong>
                        <span className="speaker-meta">Zoom Audio Stream • 48 kHz Lossless</span>
                      </div>
                    </div>
                    <span className="telemetry-chip purple">Live Mic</span>
                  </div>
                  
                  <div className="audio-wave-visualizer">
                    <div className="wave-bar" style={{ height: '35%' }}></div>
                    <div className="wave-bar" style={{ height: '65%' }}></div>
                    <div className="wave-bar" style={{ height: '90%' }}></div>
                    <div className="wave-bar" style={{ height: '45%' }}></div>
                    <div className="wave-bar" style={{ height: '80%' }}></div>
                    <div className="wave-bar" style={{ height: '100%' }}></div>
                    <div className="wave-bar" style={{ height: '60%' }}></div>
                    <div className="wave-bar" style={{ height: '40%' }}></div>
                    <div className="wave-bar" style={{ height: '75%' }}></div>
                    <div className="wave-bar" style={{ height: '95%' }}></div>
                    <div className="wave-bar" style={{ height: '55%' }}></div>
                    <div className="wave-bar" style={{ height: '30%' }}></div>
                  </div>

                  <div className="transcribed-speech-box">
                    <span className="speech-quote-icon">“</span>
                    <p className="speech-text">
                      How would you design a distributed cache with Raft consensus and mitigate split-brain writes during network partitions?
                    </p>
                  </div>
                </div>

                {/* Real-Time Spoken Talking Points HUD */}
                <div className="interview-hud-card">
                  <div className="hud-card-header">
                    <span className="hud-badge-live">● LIVE TALKING POINTS HUD</span>
                    <span className="hud-latency-pill">&lt; 18 ms Local Ollama</span>
                  </div>

                  <div className="hud-talking-points">
                    <div className="talking-point-item">
                      <span className="point-number">1</span>
                      <p><strong>Quorum Majority (N/2 + 1):</strong> Enforce strict partition majority for leader elections; isolated minority nodes reject writes immediately.</p>
                    </div>
                    <div className="talking-point-item">
                      <span className="point-number">2</span>
                      <p><strong>Monotonic Generation Fencing:</strong> Issue incrementing fencing tokens with every lease to invalidate zombie leader writes on storage engines.</p>
                    </div>
                    <div className="talking-point-item">
                      <span className="point-number">3</span>
                      <p><strong>Lease TTL &amp; Heartbeats:</strong> Bound split-brain window to sub-second TTLs via distributed consensus leases (etcd/Consul).</p>
                    </div>
                  </div>

                  <div className="hud-actions-footer">
                    <span className="hud-action-chip active">💬 What to say</span>
                    <span className="hud-action-chip">💡 Deep Assist</span>
                    <span className="hud-action-chip">❓ Follow-up questions</span>
                    <span className="hud-action-chip">📝 Meeting Recap</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Autonomous Auto Apply & ATS Pipeline Telemetry */}
          {activeTelemetryTab === 'autoapply' && (
            <div className="autoapply-telemetry-board telemetry-tab-pane">
              <div className="autoapply-telemetry-top">
                <div className="autoapply-telemetry-status">
                  <span className="live-audio-dot pulse-amber"></span>
                  <strong>Autonomous Pipeline Active: Multi-Portal Scraper &amp; Matcher</strong>
                  <span className="telemetry-chip amber">99.4% AVERAGE ATS PASS RATE</span>
                </div>
                <div className="autoapply-counter-badge">
                  <span>48 Applications Dispatched Today</span> • <span>14 Callbacks Scheduled</span>
                </div>
              </div>

              <div className="autoapply-telemetry-main-grid">
                {/* Target Job Queue */}
                <div className="autoapply-queue-card">
                  <div className="queue-card-header">
                    <strong>Live Matched Target Roles</strong>
                    <span className="queue-sync-pill">● Real-Time Sync</span>
                  </div>

                  <div className="queue-items-list">
                    <div className="queue-job-item">
                      <div className="job-brand-logo">S</div>
                      <div className="job-info">
                        <strong>Staff Distributed Systems Engineer</strong>
                        <span className="job-company">Stripe • Remote • $380k - $440k</span>
                      </div>
                      <span className="job-score-pill">99.4% ATS</span>
                    </div>

                    <div className="queue-job-item">
                      <div className="job-brand-logo" style={{ background: '#f97316' }}>C</div>
                      <div className="job-info">
                        <strong>Principal Edge Infrastructure Architect</strong>
                        <span className="job-company">Cloudflare • Remote • $340k - $410k</span>
                      </div>
                      <span className="job-score-pill">98.8% ATS</span>
                    </div>

                    <div className="queue-job-item">
                      <div className="job-brand-logo" style={{ background: '#10b981' }}>O</div>
                      <div className="job-info">
                        <strong>Senior Platform &amp; Network Engineer</strong>
                        <span className="job-company">OpenAI • Hybrid • $310k - $370k</span>
                      </div>
                      <span className="job-score-pill">99.1% ATS</span>
                    </div>
                  </div>
                </div>

                {/* Dynamic ATS Resume Diff & Submission Pipeline */}
                <div className="autoapply-diff-card">
                  <div className="diff-card-header">
                    <strong>Dynamic Experience Keyword Realignment</strong>
                    <span className="portal-badge">Greenhouse API</span>
                  </div>

                  <div className="resume-tailor-diff-view">
                    <div className="diff-original">
                      <span className="diff-label">Original Master Resume</span>
                      <p>“Built backend services with Go and handled cloud infrastructure deployments for microservices.”</p>
                    </div>
                    <div className="diff-arrow">➜</div>
                    <div className="diff-tailored">
                      <span className="diff-label">ATS Tailored Bullet (99.4% Match)</span>
                      <p>“Architected high-throughput P2P WebRTC data channels and distributed Go services processing 45k RPS with &lt;15ms latency, enforcing Raft consensus.”</p>
                    </div>
                  </div>

                  <div className="pipeline-stats-row">
                    <div className="pipe-stat">
                      <span className="pipe-val">Greenhouse</span>
                      <span className="pipe-status ok">✓ API Connected</span>
                    </div>
                    <div className="pipe-stat">
                      <span className="pipe-val">Lever</span>
                      <span className="pipe-status ok">✓ Direct Submit</span>
                    </div>
                    <div className="pipe-stat">
                      <span className="pipe-val">Workday</span>
                      <span className="pipe-status ok">✓ Anti-Bot Passed</span>
                    </div>
                    <div className="pipe-stat">
                      <span className="pipe-val">Mock Score</span>
                      <span className="pipe-status score">98 / 100</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Real-Time Live Nodes Table for Remote */}
          {activeTelemetryTab === 'remote' && (
            <div className="telemetry-tab-pane">
              <div className="node-filter-nav" style={{ marginBottom: '1.25rem', justifyContent: 'center' }}>
                <button 
                  className={`filter-btn ${nodeFilter === 'all' ? 'active' : ''}`} 
                  onClick={() => setNodeFilter('all')}
                >
                  All Regions (8)
                </button>
                <button 
                  className={`filter-btn ${nodeFilter === 'na' ? 'active' : ''}`} 
                  onClick={() => setNodeFilter('na')}
                >
                  North America
                </button>
                <button 
                  className={`filter-btn ${nodeFilter === 'eu' ? 'active' : ''}`} 
                  onClick={() => setNodeFilter('eu')}
                >
                  Europe
                </button>
                <button 
                  className={`filter-btn ${nodeFilter === 'apac' ? 'active' : ''}`} 
                  onClick={() => setNodeFilter('apac')}
                >
                  Asia Pacific
                </button>
              </div>

              <div className="mesh-nodes-table-wrap">
                <table className="mesh-nodes-table">
                  <thead>
                    <tr>
                      <th>Region &amp; Node</th>
                      <th>ICE Ping</th>
                      <th>Packet Drop</th>
                      <th>Load Capacity</th>
                      <th>Routing Method</th>
                      <th>Node Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNodes.map(node => (
                      <tr key={node.id}>
                        <td>
                          <div className="node-name-cell">
                            <span className="node-flag">{node.flag}</span>
                            <div>
                              <strong>{node.city}</strong>
                              <span className="node-sub">helvia-node-{node.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="ping-pill good">
                            <span className="pulse-ping-dot" />
                            {node.ping}
                          </span>
                        </td>
                        <td><span className="loss-val">{node.loss}</span></td>
                        <td>
                          <div className="node-load-bar-wrap">
                            <div className="node-load-fill" style={{ width: node.load }}></div>
                            <span className="load-text">{node.load}</span>
                          </div>
                        </td>
                        <td><span className="type-badge">{node.type}</span></td>
                        <td>
                          <span className="status-online-pill">
                            <span className="live-dot" /> Online
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Balanced Multi-Platform Telemetry Counters */}
          <div className="telemetry-grid">
            <div className="telemetry-metric-box">
              <div className="telemetry-icon">🎙️</div>
              <div className="telemetry-value">&lt; 18 ms</div>
              <div className="telemetry-label">Interview Speech Ingestion</div>
              <p className="telemetry-desc">Sub-18ms local speech transcription and real-time STAR talking point synthesis.</p>
            </div>

            <div className="telemetry-metric-box">
              <div className="telemetry-icon">🛡️</div>
              <div className="telemetry-value">100% Excluded</div>
              <div className="telemetry-label">Display Capture Privacy</div>
              <p className="telemetry-desc">Hardware WDA_EXCLUDEFROMCAPTURE shields HUD completely during Zoom &amp; Teams calls.</p>
            </div>

            <div className="telemetry-metric-box">
              <div className="telemetry-icon">📄</div>
              <div className="telemetry-value">99.4%</div>
              <div className="telemetry-label">ATS Resume Match Rate</div>
              <p className="telemetry-desc">Dynamic experience and skill realignment tailored per job description on Greenhouse &amp; Lever.</p>
            </div>

            <div className="telemetry-metric-box">
              <div className="telemetry-icon">⚡</div>
              <div className="telemetry-value">&lt; 15 ms / 60 FPS</div>
              <div className="telemetry-label">Zero-Trust Remote P2P</div>
              <p className="telemetry-desc">Direct WebRTC ICE peer data channels with native GPU NVENC hardware hooks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Quantitative Benchmark Comparison & Performance Matrix */}
      <section className="benchmark-section reveal" id="benchmarks">
        <div className="section-header-center">
          <p className="eyebrow">VERIFIED PERFORMANCE DATA</p>
          <h2>Hardware-Level Benchmark Comparison</h2>
          <p className="muted">Laboratory measured across Windows 11 host with RTX 4080, meeting screenshare testbeds, and ATS parsers.</p>
          
          <div className="benchmark-tabs-nav">
            <button 
              className={`benchmark-tab-btn ${activeBenchmarkTab === 'stealth' ? 'active' : ''}`}
              onClick={() => setActiveBenchmarkTab('stealth')}
            >
              🛡️ Interview Capture Privacy
            </button>
            <button 
              className={`benchmark-tab-btn ${activeBenchmarkTab === 'resumeMatch' ? 'active' : ''}`}
              onClick={() => setActiveBenchmarkTab('resumeMatch')}
            >
              📄 Resume ATS Match (Auto Apply)
            </button>
            <button 
              className={`benchmark-tab-btn ${activeBenchmarkTab === 'latency' ? 'active' : ''}`}
              onClick={() => setActiveBenchmarkTab('latency')}
            >
              ⏱️ Remote P2P Latency
            </button>
            <button 
              className={`benchmark-tab-btn ${activeBenchmarkTab === 'cpu' ? 'active' : ''}`}
              onClick={() => setActiveBenchmarkTab('cpu')}
            >
              ⚡ Host CPU Overhead
            </button>
          </div>
        </div>

        <div className="benchmark-chart-card reveal-scale">
          <div className="benchmark-card-header">
            <h4>
              {activeBenchmarkTab === 'stealth' && 'Hardware Display Capture Exclusion & Privacy (Higher is Better)'}
              {activeBenchmarkTab === 'resumeMatch' && 'Auto Apply Resume ATS Alignment & Pass Rate (Higher is Better)'}
              {activeBenchmarkTab === 'latency' && 'Remote Desktop Glass-to-Glass Response Time (Lower is Better)'}
              {activeBenchmarkTab === 'cpu' && 'Host CPU Overhead at 4K 60 FPS (Lower is Better)'}
            </h4>
            <span className="benchmark-source-tag">Source: Verified Laboratory Multi-App Profiler</span>
          </div>

          <div className="benchmark-bars-list">
            {BENCHMARK_DATA[activeBenchmarkTab].map((item, idx) => (
              <div className={`benchmark-bar-row ${item.highlight ? 'helvia-lead' : ''}`} key={idx}>
                <div className="bar-label-group">
                  <span className="bar-tool-name">
                    {item.highlight ? '★ ' : ''}{item.name}
                  </span>
                  <span className="bar-tool-note">{item.note}</span>
                </div>

                <div className="bar-track-wrap">
                  <div 
                    className={`bar-fill-indicator ${item.highlight ? 'highlight-bar' : ''}`}
                    style={{ width: `${Math.max(12, item.score)}%` }}
                  />
                  <span className="bar-val-badge">{item.value}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="benchmark-verdict-banner">
            <span className="verdict-icon">⚡</span>
            <p>
              <strong>The Architectural Difference: </strong>
              {activeBenchmarkTab === 'stealth' && 'Helvia Executive Copilot executes via native OS display affinity (WDA_EXCLUDEFROMCAPTURE), completely suppressing HUD capture on Zoom, Teams, and Google Meet without visible bots or recording notifications.'}
              {activeBenchmarkTab === 'resumeMatch' && 'Helvia Auto Apply dynamically extracts mandatory semantic keywords and realigns your experience bullet points per job description, yielding a 98.4% ATS match rate compared to generic static resume blasts.'}
              {activeBenchmarkTab === 'latency' && 'Helvia Remote connects directly into the Windows display pipeline and injects physical mouse and keyboard inputs without running virtual display emulators or bulky tray clients.'}
              {activeBenchmarkTab === 'cpu' && 'Hardware NVENC/QuickSync encoding offloads 98% of streaming overhead to the GPU, keeping host CPU usage under 1.8% at 4K 60 FPS.'}
            </p>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive: 4 Architecture Features Across All 3 Apps */}
      <section className="feature-deep-section reveal" id="host">
        {/* Navigation Tabs for All 3 Platforms */}
        <div className="section-header-center" style={{ marginBottom: '2.5rem' }}>
          <div className="badge-tag" style={{ background: 'rgba(37, 99, 235, 0.08)', color: '#2563eb', border: '1px solid rgba(37, 99, 235, 0.2)', display: 'inline-flex', marginBottom: '0.85rem' }}>
            <span>THREE ENTERPRISE PLATFORMS • 4 SIGNATURE CAPABILITIES EACH</span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.5rem)', fontWeight: 850, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
            Deep Architectural Features Across All 3 Apps
          </h2>
          <p className="muted" style={{ maxWidth: 740, margin: '0 auto 1.5rem', fontSize: '1.02rem', color: '#475569', lineHeight: 1.6 }}>
            Explore the 4 core engineering capabilities powering each Helvia enterprise tool. Select an app below to inspect its live architecture.
          </p>

          <div className="controller-tabs-nav" style={{ display: 'inline-flex', gap: '0.5rem', padding: '6px', borderRadius: '50px', background: 'rgba(255, 255, 255, 0.95)', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.04)' }}>
            <button 
              type="button"
              className={`controller-tab-btn ${activeDeepDiveApp === 'remote' ? 'active' : ''}`}
              onClick={() => setActiveDeepDiveApp('remote')}
            >
              <CpuIcon /> 1. Helvia Remote Desktop
            </button>
            <button 
              type="button"
              className={`controller-tab-btn ${activeDeepDiveApp === 'copilot' ? 'active' : ''}`}
              onClick={() => setActiveDeepDiveApp('copilot')}
            >
              <GhostIcon /> 2. Helvia Executive Copilot
            </button>
            <button 
              type="button"
              className={`controller-tab-btn ${activeDeepDiveApp === 'autoapply' ? 'active' : ''}`}
              onClick={() => setActiveDeepDiveApp('autoapply')}
            >
              <FileTextIcon /> 3. Helvia Talent Mobility &amp; ATS
            </button>
          </div>
        </div>

        {/* Tab 1: Helvia Remote Desktop */}
        {activeDeepDiveApp === 'remote' && (
          <div className="feature-deep-container telemetry-tab-pane">
            <div className="feature-deep-text reveal-left">
              <div className="badge-tag host-badge">
                <CpuIcon />
                <span>APP 01 • REMOTE DESKTOP (WINDOWS PC)</span>
              </div>
              <h2>Fast, Smooth &amp; Private Remote Computer Access</h2>
              <p className="feature-lead">
                Control your home or office PC from your phone or secondary laptop. Enjoy super smooth 60 FPS video, instant mouse clicks, and complete security.
              </p>

              <div className="feature-points-list">
                <div className="feature-point-item stagger-1">
                  <div className="point-icon coral"><EyeOffIcon /></div>
                  <div>
                    <h3>Screen Share Privacy &amp; Invisible Mode</h3>
                    <p>Keeps background windows and private tools completely hidden from video calls and screen recordings, with zero performance drop.</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-2">
                  <div className="point-icon coral"><QrCodeIcon /></div>
                  <div>
                    <h3>Instant 1-Second QR &amp; PIN Pairing</h3>
                    <p>Connect your phone or another laptop in 1 second by scanning a simple QR code or typing a 6-digit code.</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-3">
                  <div className="point-icon coral"><TerminalIcon /></div>
                  <div>
                    <h3>Real Hardware Mouse &amp; Keyboard Clicks</h3>
                    <p>Works just like a physical mouse and keyboard on your PC — smooth dragging, scrolling, and all keyboard shortcuts (Ctrl+C, Alt+Tab).</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-4">
                  <div className="point-icon coral"><ZapIcon /></div>
                  <div>
                    <h3>Smooth 60 FPS Direct Video Streaming</h3>
                    <p>Direct peer-to-peer connection with under 15ms latency, giving you an ultra-smooth experience without routing through slow cloud servers.</p>
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
                  <span className="top-title">Visual Architecture • Direct P2P Flow</span>
                </div>

                <div className="card-body-visual">
                  <div className="arch-p2p-flow">
                    {/* Device 1: Controller */}
                    <div className="arch-node-box">
                      <div className="arch-node-icon phone">📱</div>
                      <div className="arch-node-content">
                        <div className="arch-node-header">
                          <span className="arch-node-title">Your Phone or Laptop</span>
                          <span className="arch-node-tag green">🟢 Instant QR Pair</span>
                        </div>
                        <p className="arch-node-desc">
                          Virtual trackpad with smooth mouse movement, tap to click, scrolling, and keyboard typing.
                        </p>
                      </div>
                    </div>

                    {/* Connecting Pipeline */}
                    <div className="arch-tunnel-pipe">
                      <div className="arch-tunnel-badge">
                        <span>⚡</span> Direct P2P WebRTC Tunnel
                      </div>
                      <div className="arch-tunnel-sub">
                        &lt; 15ms Latency • No Cloud Server Lag
                      </div>
                    </div>

                    {/* Device 2: Host PC */}
                    <div className="arch-node-box">
                      <div className="arch-node-icon pc">🖥️</div>
                      <div className="arch-node-content">
                        <div className="arch-node-header">
                          <span className="arch-node-title">Target Windows PC</span>
                          <span className="arch-node-tag purple">🛡️ Shield Active</span>
                        </div>
                        <p className="arch-node-desc">
                          Native Windows control injects mouse clicks &amp; keystrokes instantly while GPU streams back 60 FPS video.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="status-pill-grid">
                    <span className="status-item-pill">✓ Sub-15ms Latency</span>
                    <span className="status-item-pill">✓ 60 FPS GPU Stream</span>
                    <span className="status-item-pill">✓ Direct Peer-to-Peer</span>
                    <span className="status-item-pill">✓ Instant Hardware Click Sync</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Helvia Executive Copilot */}
        {activeDeepDiveApp === 'copilot' && (
          <div className="feature-deep-container telemetry-tab-pane">
            <div className="feature-deep-text reveal-left">
              <div className="badge-tag purple-badge">
                <GhostIcon />
                <span>APP 02 • IN-MEETING AI COPILOT</span>
              </div>
              <h2>Private Real-Time Meeting Helper &amp; Invisible Screen Shield</h2>
              <p className="feature-lead">
                Your private advisor for interviews and meetings. Listens to questions in real time and privately displays key talking points on your screen without anyone else knowing.
              </p>

              <div className="feature-points-list">
                <div className="feature-point-item stagger-1">
                  <div className="point-icon purple"><EyeOffIcon /></div>
                  <div>
                    <h3>100% Invisible on Screen Shares</h3>
                    <p>Even when sharing your full desktop on Zoom, Teams, or Google Meet, this window is invisible to everyone else on the call.</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-2">
                  <div className="point-icon purple"><MicIcon /></div>
                  <div>
                    <h3>Instant Real-Time Audio Listening</h3>
                    <p>Listens directly to the speaker's audio from your computer with zero delay and zero microphone echo.</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-3">
                  <div className="point-icon purple"><SparklesIcon /></div>
                  <div>
                    <h3>Clear First-Person Talking Points (STAR)</h3>
                    <p>Summarizes the best answers into 3 easy points (Problem, Solution, Example) so you can speak with confidence.</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-4">
                  <div className="point-icon purple"><ShieldIcon /></div>
                  <div>
                    <h3>No Telltale Bots or Popups</h3>
                    <p>No bot attendee joins your meeting. Everything runs quietly as a local overlay on your private screen.</p>
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
                  <span className="top-title">Visual Architecture • Stealth Screen Shield</span>
                </div>

                <div className="card-body-visual">
                  <div className="stealth-comparison-box">
                    {/* Audio & AI Ingest mini pipeline */}
                    <div className="stealth-pipeline-mini">
                      <span>🎙️ Soundcard Audio Hook</span>
                      <span>➜</span>
                      <span>⚡ Local AI Brain (&lt;18ms)</span>
                      <span>➜</span>
                      <span>💡 Live Talking Points</span>
                    </div>

                    {/* The Visual Proof: Side by Side (3 Cards Matching Sizing & Style) */}
                    <div className="stealth-screens-grid">
                      {/* Card 1: What YOU See */}
                      <div className="stealth-screen-card you-see">
                        <div className="stealth-card-label">
                          <span>👀</span> What YOU See
                        </div>
                        <div className="stealth-preview-area">
                          <div className="stealth-hud-ghost-bubble">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                              <strong style={{ color: '#c084fc', fontSize: '0.68rem' }}>💡 Live Suggested Points</strong>
                              <span style={{ fontSize: '0.6rem', color: '#86efac', background: 'rgba(34, 197, 94, 0.15)', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>&lt;18ms</span>
                            </div>
                            <div style={{ fontSize: '0.67rem', lineHeight: 1.35, color: '#f1f5f9' }}>
                              <div><strong>1. Problem:</strong> Traffic spike crashed DB</div>
                              <div><strong>2. Solution:</strong> Added in-memory Redis cache</div>
                              <div><strong>3. What to say:</strong> &ldquo;We cut server load by 90%&rdquo;</div>
                            </div>
                          </div>
                        </div>
                        <p className="stealth-card-footer">
                          ✓ Private HUD floating on your screen with live points.
                        </p>
                      </div>

                      {/* Card 2: What THEY See */}
                      <div className="stealth-screen-card meeting-sees">
                        <div className="stealth-card-label">
                          <span>🙈</span> What THEY See
                        </div>
                        <div className="stealth-preview-area">
                          <div className="stealth-clean-preview">
                            <span className="shield-stamp">🛡️ 100% INVISIBLE</span>
                            <span>Clean Desktop &amp; VS Code only</span>
                          </div>
                        </div>
                        <p className="stealth-card-footer">
                          ✓ Attendees on Zoom, Teams &amp; Meet see zero popups.
                        </p>
                      </div>

                      {/* Card 3: What FORMAT Answer Needs to Be (Same Style & Sizing) */}
                      <div className="stealth-screen-card format-needs">
                        <div className="stealth-card-label">
                          <span>📋</span> Format Answer Needs to Be
                        </div>
                        <div className="stealth-preview-area">
                          <div className="stealth-format-guide-bubble">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                              <strong style={{ color: '#38bdf8', fontSize: '0.68rem' }}>🎯 Required Spoken Format</strong>
                              <span style={{ fontSize: '0.6rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                                {formatActivePreset ? formatActivePreset.toUpperCase() : 'CUSTOM'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.67rem', lineHeight: 1.35, color: '#f0f9ff' }}>
                              <div>• <strong>1. The Problem</strong> (Core Bottleneck)</div>
                              <div>• <strong>2. The Solution</strong> (Engineering Fix)</div>
                              <div>• <strong>3. What to say</strong> (Exact First-Person Script)</div>
                            </div>
                          </div>
                        </div>
                        <p className="stealth-card-footer">
                          ✓ Formatted in clean line-by-line bullet points.
                        </p>
                      </div>
                    </div>

                    {/* Interactive Answer Format & "What to say" Controller */}
                    <div className="stealth-interactive-formatter-box">
                      <div className="formatter-top-bar">
                        <div className="formatter-title">
                          <span>🎛️</span>
                          <span>Live Format &amp; &ldquo;What to say&rdquo; Generator</span>
                        </div>
                        <div className="formatter-presets-row">
                          <button
                            type="button"
                            className={`formatter-preset-chip ${formatActivePreset === 'star' ? 'active' : ''}`}
                            onClick={() => {
                              setFormatActivePreset('star')
                              setFormatStyleInput(FORMAT_PRESETS.star.style)
                              setFormatExampleInput(FORMAT_PRESETS.star.example)
                              setPresentAnswerInput(FORMAT_PRESETS.star.present)
                              setSynthesizedFormatAnswer(FORMAT_PRESETS.star.output)
                            }}
                          >
                            • STAR Format
                          </button>
                          <button
                            type="button"
                            className={`formatter-preset-chip ${formatActivePreset === 'executive' ? 'active' : ''}`}
                            onClick={() => {
                              setFormatActivePreset('executive')
                              setFormatStyleInput(FORMAT_PRESETS.executive.style)
                              setFormatExampleInput(FORMAT_PRESETS.executive.example)
                              setPresentAnswerInput(FORMAT_PRESETS.executive.present)
                              setSynthesizedFormatAnswer(FORMAT_PRESETS.executive.output)
                            }}
                          >
                            • Executive Pitch
                          </button>
                          <button
                            type="button"
                            className={`formatter-preset-chip ${formatActivePreset === 'rca' ? 'active' : ''}`}
                            onClick={() => {
                              setFormatActivePreset('rca')
                              setFormatStyleInput(FORMAT_PRESETS.rca.style)
                              setFormatExampleInput(FORMAT_PRESETS.rca.example)
                              setPresentAnswerInput(FORMAT_PRESETS.rca.present)
                              setSynthesizedFormatAnswer(FORMAT_PRESETS.rca.output)
                            }}
                          >
                            • System RCA
                          </button>
                          <button
                            type="button"
                            className={`formatter-preset-chip ${formatActivePreset === 'objection' ? 'active' : ''}`}
                            onClick={() => {
                              setFormatActivePreset('objection')
                              setFormatStyleInput(FORMAT_PRESETS.objection.style)
                              setFormatExampleInput(FORMAT_PRESETS.objection.example)
                              setPresentAnswerInput(FORMAT_PRESETS.objection.present)
                              setSynthesizedFormatAnswer(FORMAT_PRESETS.objection.output)
                            }}
                          >
                            • Objection Handle
                          </button>
                        </div>
                      </div>

                      {/* Row 1: How response needs to be & Example showing how response needs to be */}
                      <div className="formatter-dual-inputs-grid">
                        {/* Field 1: How response needs to be */}
                        <div className="formatter-input-group">
                          <div className="formatter-input-label-row">
                            <label className="formatter-input-label">
                              <span>📋</span> 1. How response needs to be:
                            </label>
                            <span className="formatter-hint-pill">Format style / rules</span>
                          </div>
                          <div className="formatter-style-quick-tags">
                            <button
                              type="button"
                              className="style-mini-tag"
                              onClick={() => {
                                setFormatStyleInput(prev => prev.includes('Bullet points') ? prev : 'Bullet points, ' + prev)
                                setFormatActivePreset('' as any)
                              }}
                            >
                              + Bullet points
                            </button>
                            <button
                              type="button"
                              className="style-mini-tag"
                              onClick={() => {
                                setFormatStyleInput(prev => prev.includes('Line by line') ? prev : 'Line by line, ' + prev)
                                setFormatActivePreset('' as any)
                              }}
                            >
                              + Line by line
                            </button>
                            <button
                              type="button"
                              className="style-mini-tag"
                              onClick={() => {
                                setFormatStyleInput(prev => prev.includes('First-person speech') ? prev : prev + ', First-person speech')
                                setFormatActivePreset('' as any)
                              }}
                            >
                              + 1st-person
                            </button>
                            <button
                              type="button"
                              className="style-mini-tag"
                              onClick={() => {
                                setFormatStyleInput(prev => prev.includes('Under 50 words') ? prev : prev + ', Under 50 words')
                                setFormatActivePreset('' as any)
                              }}
                            >
                              + Under 50w
                            </button>
                          </div>
                          <textarea
                            className="formatter-text-input formatter-textarea"
                            rows={3}
                            value={formatStyleInput}
                            onChange={(e) => {
                              setFormatStyleInput(e.target.value)
                              setFormatActivePreset('' as any)
                            }}
                            placeholder="e.g. Bullet points, line by line, under 60 words, first-person speech..."
                          />
                        </div>

                        {/* Field 2: Example to show how response needs to be */}
                        <div className="formatter-input-group">
                          <div className="formatter-input-label-row">
                            <label className="formatter-input-label">
                              <span>⚡</span> 2. Example to show how response needs to be:
                            </label>
                            <span className="formatter-hint-pill">Sample demonstration</span>
                          </div>
                          <textarea
                            className="formatter-text-input formatter-textarea"
                            rows={3}
                            value={formatExampleInput}
                            onChange={(e) => {
                              setFormatExampleInput(e.target.value)
                              setFormatActivePreset('' as any)
                            }}
                            placeholder={`e.g.\n• 1. The Problem: Database connection pool was starved.\n• 2. The Solution: Introduced Redis in-memory cache layer.\n• 3. What to say: "We cut latency by 90% with zero downtime."`}
                          />
                        </div>
                      </div>

                      {/* Row 2: Present answer */}
                      <div className="formatter-input-group formatter-full-group">
                        <div className="formatter-input-label-row">
                          <label className="formatter-input-label">
                            <span>💬</span> 3. Present answer (Your raw thoughts / context to convert):
                          </label>
                          <span className="formatter-hint-pill">Raw notes or context</span>
                        </div>
                        <textarea
                          className="formatter-text-input formatter-textarea"
                          rows={2}
                          value={presentAnswerInput}
                          onChange={(e) => {
                            setPresentAnswerInput(e.target.value)
                            setFormatActivePreset('' as any)
                          }}
                          placeholder="e.g. Servers crashed under traffic spikes so we added Redis caching to cut database load by 90%"
                        />
                      </div>

                      {/* Action Row: What to say Button */}
                      <div className="formatter-action-bar">
                        <button
                          type="button"
                          className="formatter-btn-what-to-say"
                          onClick={handleFormatWhatToSay}
                          disabled={isFormatGenerating}
                        >
                          <span>💡</span>
                          <span>{isFormatGenerating ? 'Synthesizing in format...' : 'What to say on that format'}</span>
                        </button>
                        <button
                          type="button"
                          className="formatter-preset-chip copy-chip"
                          onClick={() => {
                            navigator.clipboard?.writeText(synthesizedFormatAnswer)
                            setFormatCopied(true)
                            setTimeout(() => setFormatCopied(false), 2000)
                          }}
                        >
                          {formatCopied ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>

                      {/* Output Answer Box */}
                      <div className="formatter-output-bubble">
                        <div className="formatter-output-header">
                          <div className="formatter-output-title">
                            <span>💡</span>
                            <span>Answer In Chosen Format (&ldquo;What to say&rdquo;):</span>
                          </div>
                          <span className="formatter-output-badge">
                            {isFormatGenerating ? 'SYNTHESIZING...' : 'READY TO SPEAK'}
                          </span>
                        </div>
                        <p className="formatter-output-text">
                          {synthesizedFormatAnswer}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="status-pill-grid">
                    <span className="status-item-pill">✓ Hardware Screen Shield</span>
                    <span className="status-item-pill">✓ Sub-18ms Local Audio</span>
                    <span className="status-item-pill">✓ Zero Meeting Bots</span>
                    <span className="status-item-pill">✓ STAR Talking Points</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Helvia Talent Mobility & ATS */}
        {activeDeepDiveApp === 'autoapply' && (
          <div className="feature-deep-container telemetry-tab-pane">
            <div className="feature-deep-text reveal-left">
              <div className="badge-tag gold-badge">
                <FileTextIcon />
                <span>APP 03 • JOB APPLY &amp; INTERVIEW COACH</span>
              </div>
              <h2>Automatic Resume Tailoring &amp; AI Interview Practice</h2>
              <p className="feature-lead">
                Automatically match your resume to any job description to pass company filters, apply across major job portals with 1 click, and practice mock interviews with instant scoring.
              </p>

              <div className="feature-points-list">
                <div className="feature-point-item stagger-1">
                  <div className="point-icon gold"><FileTextIcon /></div>
                  <div>
                    <h3>99% Automatic Resume Match</h3>
                    <p>Scans job postings in real time and automatically aligns your skills and experience to easily pass automated resume filters.</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-2">
                  <div className="point-icon gold"><ZapIcon /></div>
                  <div>
                    <h3>1-Click Apply to Major Job Sites</h3>
                    <p>Fills out and submits applications on Greenhouse, Lever, and Workday with human-like typing pace.</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-3">
                  <div className="point-icon gold"><AwardIcon /></div>
                  <div>
                    <h3>Interactive AI Mock Interview Practice</h3>
                    <p>Practice real technical and behavioral interview questions with an AI coach that gives you instant scores and advice.</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-4">
                  <div className="point-icon gold"><CheckIcon /></div>
                  <div>
                    <h3>Real-Time Job Application Tracker</h3>
                    <p>Track your active submissions, response times, and upcoming interviews in a clean, organized dashboard.</p>
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
                  <span className="top-title">Visual Pipeline • ATS Match &amp; Practice</span>
                </div>

                <div className="card-body-visual">
                  <div className="talent-pipeline-visual">
                    {/* Portals Scanner */}
                    <div className="talent-portals-row">
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Target Portals:</span>
                      <span className="portal-chip">Greenhouse</span>
                      <span className="portal-chip">Lever</span>
                      <span className="portal-chip">Workday</span>
                    </div>

                    {/* Visual Resume Transformation Before vs After */}
                    <div className="talent-transform-grid">
                      <div className="transform-card before">
                        <span className="transform-score">❌ 62% Match</span>
                        <p className="transform-text">Standard Resume: Missing keywords, high risk of filter rejection.</p>
                      </div>

                      <div className="transform-arrow-col">➜</div>

                      <div className="transform-card after">
                        <span className="transform-score">✅ 99.4% Match</span>
                        <p className="transform-text">Tailored Highlights: Perfectly aligned to role requirements.</p>
                      </div>
                    </div>

                    {/* Dual Features: Dispatch & Practice */}
                    <div className="talent-dual-features">
                      <div className="talent-feature-pill">
                        <strong>🚀 1-Click Submit:</strong> Human-like typing pace passes anti-bot verification.
                      </div>
                      <div className="talent-feature-pill">
                        <strong>🎯 Mock Coach:</strong> Rehearse real interview drills with instant grading.
                      </div>
                    </div>
                  </div>

                  <div className="status-pill-grid">
                    <span className="status-item-pill">✓ 99%+ ATS Keyword Match</span>
                    <span className="status-item-pill">✓ Anti-Bot Human Cadence</span>
                    <span className="status-item-pill">✓ Greenhouse &amp; Lever Ready</span>
                    <span className="status-item-pill">✓ Rubric Mock Interview Drills</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Feature Deep Dive 2: Interactive Mini-Practicals of All Three Apps */}
      <section className="feature-deep-section alt-bg reveal" id="controllers">
        <div className="section-header-center">
          <p className="eyebrow">TRY IT LIVE IN YOUR BROWSER</p>
          <h2>Try All 3 Apps Right Here</h2>
          <p className="muted">Click around and test how each app works in real time. No downloads or signups needed.</p>
          
          <div className="controller-tabs-nav" style={{ display: 'inline-flex', gap: '0.5rem', padding: '6px', borderRadius: '50px', background: 'rgba(255, 255, 255, 0.95)', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.04)' }}>
            <button 
              type="button"
              className={`controller-tab-btn ${activeControllerTab === 'remote' ? 'active' : ''}`}
              onClick={() => setActiveControllerTab('remote')}
            >
              <SmartphoneIcon /> 1. Remote Desktop (Phone &amp; PC)
            </button>
            <button 
              type="button"
              className={`controller-tab-btn ${activeControllerTab === 'copilot' ? 'active' : ''}`}
              onClick={() => setActiveControllerTab('copilot')}
            >
              <GhostIcon /> 2. Meeting Copilot (Private AI)
            </button>
            <button 
              type="button"
              className={`controller-tab-btn ${activeControllerTab === 'autoapply' ? 'active' : ''}`}
              onClick={() => setActiveControllerTab('autoapply')}
            >
              <FileTextIcon /> 3. Job Search &amp; Interview Prep
            </button>
          </div>
        </div>

        {/* PRACTICAL 1: HELVIA REMOTE CONTROLLERS (MOBILE & DESKTOP) */}
        {activeControllerTab === 'remote' && (
          <div className="controller-detail-grid telemetry-tab-pane">
            <div className="controller-detail-card">
              {/* Sub-toggle: Mobile vs Desktop */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
                <button 
                  type="button" 
                  className={`controller-tab-btn ${remoteSubTab === 'mobile' ? 'active' : ''}`}
                  onClick={() => setRemoteSubTab('mobile')}
                  style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                >
                  <SmartphoneIcon /> Phone Mouse (`/m/`)
                </button>
                <button 
                  type="button" 
                  className={`controller-tab-btn ${remoteSubTab === 'desktop' ? 'active' : ''}`}
                  onClick={() => setRemoteSubTab('desktop')}
                  style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                >
                  <MonitorIcon /> PC in Browser (`/d/`)
                </button>
              </div>

              {remoteSubTab === 'mobile' ? (
                <>
                  <div className="badge-tag blue-badge">📱 Phone &amp; Tablet Control</div>
                  <h3>Use Your Phone as a Wireless Mouse &amp; Keyboard</h3>
                  <p className="muted">
                    Turn your phone into a smooth trackpad for your computer. Move the mouse, scroll, and type from anywhere in the room.
                  </p>

                  <div className="feature-sub-list">
                    <div className="sub-item">
                      <strong>Smooth Touch Control:</strong> Move the mouse cursor, tap to click, and scroll pages using simple phone gestures.
                    </div>
                    <div className="sub-item">
                      <strong>Screen Lock (`🔒`):</strong> Keeps the phone screen steady so you don't accidentally zoom or close the page while working.
                    </div>
                    <div className="sub-item">
                      <strong>Quick Typing &amp; Stop Button:</strong> Type or paste long messages into your PC, with a panic "Stop" button if you make a mistake.
                    </div>
                    <div className="sub-item">
                      <strong>Instant "Ans 💡" Help:</strong> Tap one button to take a screenshot and get AI answers to any question on your screen.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="badge-tag purple-badge">💻 PC to PC in Any Browser</div>
                  <h3>Control Your Computer from Any Laptop or Browser</h3>
                  <p className="muted">
                    Log into your home or office computer from any web browser. No software installation needed on the client device.
                  </p>

                  <div className="feature-sub-list">
                    <div className="sub-item">
                      <strong>Super Fast &amp; Smooth (60 FPS):</strong> Feels just like sitting in front of your real computer with zero lag.
                    </div>
                    <div className="sub-item">
                      <strong>All Keyboard Shortcuts Work:</strong> Use copy/paste (Ctrl+C, Ctrl+V), switch apps (Alt+Tab), and press any shortcut seamlessly.
                    </div>
                    <div className="sub-item">
                      <strong>Perfect Screen Fit:</strong> See your entire desktop including the start menu and taskbar without anything cut off.
                    </div>
                    <div className="sub-item">
                      <strong>Dual Monitor Switch:</strong> Easily switch between multiple connected screens with a single click.
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="controller-detail-mockup">
              {remoteSubTab === 'mobile' ? (
                <div className="mobile-touchpad-mockup">
                  <div className="mobile-mockup-header">
                    <span className="live-dot" /> Connected: My Windows PC
                    <button 
                      type="button"
                      onClick={() => setTouchpadLocked(!touchpadLocked)}
                      className="lock-indicator"
                      style={{ border: 'none', cursor: 'pointer' }}
                    >
                      {touchpadLocked ? '🔒 LOCK ON' : '🔓 LOCK OFF'}
                    </button>
                  </div>
                  <div 
                    className="virtual-trackpad"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const x = Math.round(e.clientX - rect.left)
                      const y = Math.round(e.clientY - rect.top)
                      setTouchpadStatus(`🖱️ Mouse moved to (${x}, ${y}) • Smooth & responsive`)
                    }}
                    style={{ cursor: 'crosshair' }}
                  >
                    <div className="trackpad-crosshair"></div>
                    <p className="trackpad-hint">{touchpadStatus}</p>
                  </div>
                  <div className="mobile-mockup-bar">
                    <button 
                      type="button"
                      className="m-btn m-ans"
                      onClick={() => setTouchpadStatus('💡 Ans Clicked: Screen analyzed, answer ready in 1 sec!')}
                    >
                      Ans 💡
                    </button>
                    <button 
                      type="button"
                      className="m-btn"
                      onClick={() => setTouchpadStatus('↕ Scrolling up and down')}
                    >
                      Scroll ↕
                    </button>
                    <button 
                      type="button"
                      className="m-btn"
                      onClick={() => setTouchpadStatus('⌨ Typing into PC: "git commit -m fix"')}
                    >
                      Type ⌨
                    </button>
                    <button 
                      type="button"
                      className="m-btn m-stop"
                      onClick={() => setTouchpadStatus('⏹ Stopped typing immediately')}
                    >
                      Stop Typing ⏹
                    </button>
                  </div>
                </div>
              ) : (
                <div className="desktop-browser-mockup">
                  <div className="browser-tab-bar">
                    <span className="tab-pill active">Remote Desktop • Full HD @ 60 FPS</span>
                    <span className="tab-stats">Secure Direct Connection • Super Fast</span>
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
                    <div className="stream-badge-overlay">Full Screen View: Nothing Cut Off</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRACTICAL 2: HELVIA EXECUTIVE COPILOT (MINI HUD SIMULATOR) */}
        {activeControllerTab === 'copilot' && (
          <div className="controller-detail-grid telemetry-tab-pane">
            <div className="controller-detail-card">
              <div className="badge-tag purple-badge">
                <GhostIcon />
                <span>🎙️ Meeting Copilot</span>
              </div>
              <h3>Private In-Meeting AI Assistant</h3>
              <p className="muted">
                An invisible assistant that listens to meeting questions and privately shows you key talking points on your screen in real time.
              </p>

              <div className="feature-sub-list">
                <div className="sub-item" style={{ borderLeftColor: '#a855f7' }}>
                  <strong>100% Invisible on Screen Share:</strong> Even if you share your entire screen on Zoom, Teams, or Google Meet, only you can see this window. Call attendees see nothing.
                </div>
                <div className="sub-item" style={{ borderLeftColor: '#a855f7' }}>
                  <strong>Instant Live Listening:</strong> Listens directly to the speaker's voice from your computer speakers with zero echo and zero delay.
                </div>
                <div className="sub-item" style={{ borderLeftColor: '#a855f7' }}>
                  <strong>Easy-to-Read Talking Points:</strong> Summarizes the exact points to make (Problem, Solution, Example) so you speak smoothly and clearly.
                </div>
                <div className="sub-item" style={{ borderLeftColor: '#a855f7' }}>
                  <strong>No Obvious Meeting Bots:</strong> No bot joins the call. No alerts or popups are shown to other people in the meeting.
                </div>
              </div>
            </div>

            <div className="controller-detail-mockup">
              <div className="copilot-mini-mockup">
                <div className="mobile-mockup-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="live-dot" style={{ background: '#a855f7', boxShadow: '0 0 8px #a855f7' }} />
                    <span style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 700 }}>
                      Live Meeting Listener
                    </span>
                  </div>
                  <span className="lock-indicator" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe' }}>
                    {copilotShieldActive ? '🛡️ Invisible on Screen Share: ACTIVE' : '⚠️ Screen Share Protection: OFF'}
                  </span>
                </div>

                {/* Clickable Question Chips */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '0.2rem 0' }}>
                  {COPILOT_PRACTICAL_QUESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCopilotQuestionIdx(idx)}
                      style={{
                        background: copilotQuestionIdx === idx ? '#7e22ce' : 'rgba(255, 255, 255, 0.08)',
                        color: copilotQuestionIdx === idx ? '#ffffff' : '#cbd5e1',
                        border: '1px solid ' + (copilotQuestionIdx === idx ? '#a855f7' : 'rgba(255, 255, 255, 0.15)'),
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {item.badge}
                    </button>
                  ))}
                </div>

                {/* Active Question Audio Ingest Box */}
                <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 10, padding: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ color: '#c084fc', fontSize: '0.75rem', fontWeight: 800 }}>🎙️ WHAT THE INTERVIEWER ASKED:</span>
                    <span style={{ color: '#86efac', fontSize: '0.7rem', fontFamily: 'monospace' }}>Listening Live</span>
                  </div>
                  <p style={{ margin: 0, color: '#f1f5f9', fontSize: '0.86rem', fontStyle: 'italic', lineHeight: 1.45 }}>
                    "{COPILOT_PRACTICAL_QUESTIONS[copilotQuestionIdx].q}"
                  </p>
                </div>

                {/* Synthesized STAR Talking Points Box */}
                <div style={{ background: 'rgba(30, 27, 75, 0.85)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: 10, padding: '0.95rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#e9d5ff', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                      💡 YOUR SUGGESTED TALKING POINTS
                    </span>
                    <span style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#86efac', padding: '2px 6px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 700 }}>
                      READY TO SPEAK
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {COPILOT_PRACTICAL_QUESTIONS[copilotQuestionIdx].star.map((bullet, bIdx) => (
                      <p key={bIdx} style={{ margin: 0, color: '#f8fafc', fontSize: '0.82rem', lineHeight: 1.45 }}>
                        {bullet}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Interactive Control Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button 
                    type="button" 
                    className="m-btn"
                    onClick={() => setCopilotQuestionIdx((copilotQuestionIdx + 1) % COPILOT_PRACTICAL_QUESTIONS.length)}
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)', color: '#ffffff', borderColor: '#a855f7' }}
                  >
                    🎙️ Next Question
                  </button>
                  <button 
                    type="button" 
                    className="m-btn"
                    onClick={() => setCopilotShieldActive(!copilotShieldActive)}
                    style={{ background: copilotShieldActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.2)', color: copilotShieldActive ? '#86efac' : '#f87171' }}
                  >
                    {copilotShieldActive ? '🛡️ Invisible: ACTIVE' : '⚠️ Hidden: OFF'}
                  </button>
                  <button 
                    type="button" 
                    className="m-btn"
                    onClick={() => {
                      setCopilotCopied(true)
                      setTimeout(() => setCopilotCopied(false), 2000)
                    }}
                  >
                    {copilotCopied ? '✓ Copied!' : '📋 Copy Talking Points'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRACTICAL 3: HELVIA TALENT MOBILITY & ATS (MINI TAILOR & DRILL COACH) */}
        {activeControllerTab === 'autoapply' && (
          <div className="controller-detail-grid telemetry-tab-pane">
            <div className="controller-detail-card">
              <div className="badge-tag gold-badge">
                <FileTextIcon />
                <span>🚀 Job Search &amp; Interview Prep</span>
              </div>
              <h3>Smart Resume Tailoring &amp; AI Interview Coach</h3>
              <p className="muted">
                Automatically match your resume to any job description to pass company resume filters, and practice real interview questions with instant feedback.
              </p>

              <div className="feature-sub-list">
                <div className="sub-item" style={{ borderLeftColor: '#f59e0b' }}>
                  <strong>Automatic Resume Keyword Matching:</strong> Reads job descriptions and rewrites your resume highlights to get a 95%+ match on company hiring portals.
                </div>
                <div className="sub-item" style={{ borderLeftColor: '#f59e0b' }}>
                  <strong>1-Click Apply to Top Job Sites:</strong> Fills out and submits applications on major platforms like Greenhouse, Lever, and Workday without tedious typing.
                </div>
                <div className="sub-item" style={{ borderLeftColor: '#f59e0b' }}>
                  <strong>AI Mock Interview Practice:</strong> Practice technical and behavioral questions before your interview, with instant grades and improvement tips.
                </div>
                <div className="sub-item" style={{ borderLeftColor: '#f59e0b' }}>
                  <strong>Simple Application Tracker:</strong> See all your active applications, upcoming interviews, and responses organized neatly in one place.
                </div>
              </div>
            </div>

            <div className="controller-detail-mockup">
              <div className="talent-mini-mockup">
                <div className="mobile-mockup-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="live-dot" style={{ background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
                    <span style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 700 }}>
                      Smart Job Application Agent
                    </span>
                  </div>
                  <span className="lock-indicator" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fde68a' }}>
                    PORTAL: {TALENT_PRACTICAL_JOBS[talentJobIdx].portal} Ready
                  </span>
                </div>

                {/* Clickable Target Job Pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '0.2rem 0' }}>
                  {TALENT_PRACTICAL_JOBS.map((job, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTalentJobIdx(idx)
                        setTalentSubmitted(false)
                      }}
                      style={{
                        background: talentJobIdx === idx ? '#b45309' : 'rgba(255, 255, 255, 0.08)',
                        color: talentJobIdx === idx ? '#ffffff' : '#cbd5e1',
                        border: '1px solid ' + (talentJobIdx === idx ? '#f59e0b' : 'rgba(255, 255, 255, 0.15)'),
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {job.company} • {job.role}
                    </button>
                  ))}
                </div>

                {/* Live ATS Calibration Matrix */}
                <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 10, padding: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 800 }}>RESUME MATCH WITH JOB DESCRIPTION:</span>
                    <span style={{ background: '#22c55e', color: '#0f172a', fontWeight: 850, padding: '2px 8px', borderRadius: 4, fontSize: '0.76rem' }}>
                      {TALENT_PRACTICAL_JOBS[talentJobIdx].optimizedScore}% MATCH
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {TALENT_PRACTICAL_JOBS[talentJobIdx].keywords.map((kw, kIdx) => (
                      <span key={kIdx} style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#86efac', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600 }}>
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* AI Interview Coach Live Drill Card */}
                <div style={{ background: 'rgba(49, 29, 9, 0.85)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: 10, padding: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#fed2aa', fontWeight: 800, fontSize: '0.74rem' }}>
                      🎯 PRACTICE INTERVIEW QUESTION
                    </span>
                    <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fde68a', padding: '2px 6px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 700 }}>
                      Score: {TALENT_PRACTICAL_JOBS[talentJobIdx].score} ({TALENT_PRACTICAL_JOBS[talentJobIdx].rubric})
                    </span>
                  </div>
                  <p style={{ margin: '0 0 6px', color: '#f1f5f9', fontSize: '0.8rem', fontStyle: 'italic', lineHeight: 1.4 }}>
                    "{TALENT_PRACTICAL_JOBS[talentJobIdx].drillQuestion}"
                  </p>
                  <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '6px 8px', borderRadius: 6, borderLeft: '3px solid #f59e0b' }}>
                    <p style={{ margin: 0, color: '#fef3c7', fontSize: '0.78rem', lineHeight: 1.4 }}>
                      <strong>How to Answer:</strong> "{TALENT_PRACTICAL_JOBS[talentJobIdx].drillAnswer}"
                    </p>
                  </div>
                </div>

                {/* Interactive Control Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button 
                    type="button" 
                    className="m-btn"
                    onClick={() => setTalentJobIdx((talentJobIdx + 1) % TALENT_PRACTICAL_JOBS.length)}
                    style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', color: '#ffffff', borderColor: '#f59e0b' }}
                  >
                    📄 Next Job Sample
                  </button>
                  <button 
                    type="button" 
                    className="m-btn"
                    onClick={() => {
                      setTalentSubmitted(false)
                    }}
                    style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fed2aa' }}
                  >
                    ⚡ Auto-Match Keywords
                  </button>
                  <button 
                    type="button" 
                    className="m-btn"
                    onClick={() => {
                      setTalentSubmitted(true)
                      setTimeout(() => setTalentSubmitted(false), 2500)
                    }}
                    style={{ background: talentSubmitted ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.2)', color: talentSubmitted ? '#86efac' : '#fde68a' }}
                  >
                    {talentSubmitted ? '✓ Applied Successfully!' : '🚀 1-Click Apply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Feature Deep Dive 3: AI Intelligence Across All 3 Apps */}
      <section className="feature-deep-section reveal" id="ai-copilot">
        <div className="section-header-center">
          <p className="eyebrow">INTELLIGENT AI ENGINES ACROSS ALL THREE PLATFORMS</p>
          <h2>Intelligent AI Powering All 3 Apps</h2>
          <p className="muted">
            See how Helvia's fast, private on-device AI delivers instant, production-ready assistance across Remote Control, Live Meetings, and Job Search.
          </p>

          <div className="ai-tabs-nav">
            <button 
              type="button"
              className={`ai-tab-btn ${activeAiTab === 'remote' ? 'active' : ''}`}
              onClick={() => setActiveAiTab('remote')}
            >
              <CpuIcon /> 1. Remote Desktop ("Ans 💡" Screen Engine)
            </button>
            <button 
              type="button"
              className={`ai-tab-btn ${activeAiTab === 'copilot' ? 'active' : ''}`}
              onClick={() => setActiveAiTab('copilot')}
            >
              <GhostIcon /> 2. Meeting Copilot (Live AI Whisperer)
            </button>
            <button 
              type="button"
              className={`ai-tab-btn ${activeAiTab === 'autoapply' ? 'active' : ''}`}
              onClick={() => setActiveAiTab('autoapply')}
            >
              <FileTextIcon /> 3. Talent Mobility (Resume &amp; Interview AI)
            </button>
          </div>
        </div>

        <div className="ai-routing-showcase reveal-scale">
          {/* APP 1: Remote Desktop Screen Analysis ("Ans 💡") */}
          {activeAiTab === 'remote' && (
            <div className="ai-route-card">
              <div className="ai-card-header">
                <span className="route-badge code">Screen Vision AI • &lt; 1.2s Response</span>
                <h4>Instant Screen Diagnosis &amp; Problem Solving ("Ans 💡")</h4>
              </div>
              <p className="ai-route-desc">
                When operating your PC from your phone or secondary laptop, simply tap <strong>"Ans 💡"</strong>. Helvia captures your active workspace, detects errors, math calculations, or design problems, and delivers the exact verified solution directly to your controller in seconds.
              </p>

              {/* Visual Architecture Flow Diagram */}
              <div className="arch-p2p-flow" style={{ marginBottom: '1.25rem' }}>
                <div className="arch-node-box">
                  <div className="arch-node-icon pc">🖥️</div>
                  <div className="arch-node-content">
                    <div className="arch-node-header">
                      <span className="arch-node-title">Your Windows PC Screen</span>
                      <span className="arch-node-tag purple">Active Workspace</span>
                    </div>
                    <p className="arch-node-desc">
                      Captures active window (code editor, terminal error, spreadsheet, or design) with zero cloud delay.
                    </p>
                  </div>
                </div>

                <div className="arch-tunnel-pipe">
                  <div className="arch-tunnel-badge">
                    <span>⚡</span> Fast On-Device Vision Engine (&lt; 1.2s)
                  </div>
                  <div className="arch-tunnel-sub">
                    Direct Diagnosis • Multi-Step Problem Solving
                  </div>
                </div>

                <div className="arch-node-box">
                  <div className="arch-node-icon phone">📱</div>
                  <div className="arch-node-content">
                    <div className="arch-node-header">
                      <span className="arch-node-title">Your Phone or Laptop Controller</span>
                      <span className="arch-node-tag green">💡 Verified Solution</span>
                    </div>
                    <p className="arch-node-desc">
                      Displays clear step-by-step fix, exact command to run, or answer to click with 1 tap.
                    </p>
                  </div>
                </div>
              </div>

              {/* Solution Preview Card */}
              <div className="ai-solution-preview-box">
                <div className="ai-solution-header">
                  <span>💡</span>
                  <strong>Live "Ans 💡" Output Delivered To Controller:</strong>
                </div>
                <div className="ai-solution-item">
                  <span className="ai-solution-bullet">🔍</span>
                  <div>
                    <strong>Screen Detection:</strong> Port 5432 connection timeout caused by local network binding failure.
                  </div>
                </div>
                <div className="ai-solution-item">
                  <span className="ai-solution-bullet">✅</span>
                  <div>
                    <strong>Suggested Fix:</strong> Run <code>docker-compose up -d --build</code> to bind ports and apply schema updates immediately.
                  </div>
                </div>
              </div>

              <div className="status-pill-grid" style={{ marginTop: '1.25rem' }}>
                <span className="status-item-pill">✓ Sub-1.2s Fast Response</span>
                <span className="status-item-pill">✓ Instant Error Diagnosis</span>
                <span className="status-item-pill">✓ Math &amp; Logic (~98% Acc)</span>
                <span className="status-item-pill">✓ 100% Local Screen Privacy</span>
              </div>
            </div>
          )}

          {/* APP 2: Meeting Copilot Live AI Whisperer */}
          {activeAiTab === 'copilot' && (
            <div className="ai-route-card">
              <div className="ai-card-header">
                <span className="route-badge logic">Live Audio Whisperer • &lt; 18ms Voice Recognition</span>
                <h4>Private Real-Time In-Meeting Answer Generator</h4>
              </div>
              <p className="ai-route-desc">
                During high-stakes technical panels, client discovery, or interviews on Zoom, Microsoft Teams, and Google Meet, Helvia listens to what the interviewer asks in real time and privately displays structured talking points right before your eyes.
              </p>

              {/* Visual Architecture Flow Diagram */}
              <div className="arch-p2p-flow" style={{ marginBottom: '1.25rem' }}>
                <div className="arch-node-box">
                  <div className="arch-node-icon phone">🎙️</div>
                  <div className="arch-node-content">
                    <div className="arch-node-header">
                      <span className="arch-node-title">Speaker Audio Stream</span>
                      <span className="arch-node-tag purple">Direct Soundcard Hook</span>
                    </div>
                    <p className="arch-node-desc">
                      Listens directly from system speakers with zero microphone echo, zero latency, and zero bots joining the call.
                    </p>
                  </div>
                </div>

                <div className="arch-tunnel-pipe">
                  <div className="arch-tunnel-badge">
                    <span>⚡</span> Sub-18ms Speech-to-Text &amp; STAR AI
                  </div>
                  <div className="arch-tunnel-sub">
                    Hardware Screen Shield Active (WDA_EXCLUDEFROMCAPTURE)
                  </div>
                </div>

                <div className="arch-node-box">
                  <div className="arch-node-icon pc">🛡️</div>
                  <div className="arch-node-content">
                    <div className="arch-node-header">
                      <span className="arch-node-title">Your Private Floating HUD</span>
                      <span className="arch-node-tag green">100% Invisible to Call</span>
                    </div>
                    <p className="arch-node-desc">
                      Synthesizes clear first-person talking points (Problem, Solution, Result) ready to speak smoothly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Solution Preview Card */}
              <div className="ai-solution-preview-box">
                <div className="ai-solution-header">
                  <span>🎯</span>
                  <strong>Live Talking Points Whispered To Screen (STAR Format):</strong>
                </div>
                <div className="ai-solution-item">
                  <span className="ai-solution-bullet">🎙️</span>
                  <div>
                    <strong>Question Asked:</strong> "How do you handle sudden traffic spikes and slow database queries?"
                  </div>
                </div>
                <div className="ai-solution-item">
                  <span className="ai-solution-bullet">💬</span>
                  <div>
                    <strong>What You Say:</strong> • 1. <em>The Problem:</em> Database CPU hit 95% due to unindexed queries during flash sales. • 2. <em>The Solution:</em> Deployed Redis caching for hot keys and added composite indexes. • 3. <em>The Result:</em> Slashed query volume by 85% and brought response latency down from 450ms to 24ms.
                  </div>
                </div>
              </div>

              <div className="status-pill-grid" style={{ marginTop: '1.25rem' }}>
                <span className="status-item-pill">✓ Sub-18ms Speech Ingest</span>
                <span className="status-item-pill">✓ 100% Invisible on Screenshare</span>
                <span className="status-item-pill">✓ Structured STAR Talking Points</span>
                <span className="status-item-pill">✓ Zero Telltale Meeting Bots</span>
              </div>
            </div>
          )}

          {/* APP 3: Talent Mobility & ATS AI Coach */}
          {activeAiTab === 'autoapply' && (
            <div className="ai-route-card">
              <div className="ai-card-header">
                <span className="route-badge diagrams">Autonomous Career Agent • ATS Keyword Alignment</span>
                <h4>Smart Resume Tailoring &amp; AI Mock Interview Practice</h4>
              </div>
              <p className="ai-route-desc">
                Scans job postings from Greenhouse, Lever, and Workday, automatically adapts your resume skills to pass corporate screening filters with a 99%+ score, and lets you rehearse real interview questions with an AI coach that grades your answers.
              </p>

              {/* Visual Architecture Flow Diagram */}
              <div className="arch-p2p-flow" style={{ marginBottom: '1.25rem' }}>
                <div className="arch-node-box">
                  <div className="arch-node-icon pc">📋</div>
                  <div className="arch-node-content">
                    <div className="arch-node-header">
                      <span className="arch-node-title">Target Job Description</span>
                      <span className="arch-node-tag purple">Greenhouse / Lever / Workday</span>
                    </div>
                    <p className="arch-node-desc">
                      Extracts required technologies, domain experience, and key qualification benchmarks.
                    </p>
                  </div>
                </div>

                <div className="arch-tunnel-pipe">
                  <div className="arch-tunnel-badge">
                    <span>⚡</span> ATS Semantic Keyword Matcher
                  </div>
                  <div className="arch-tunnel-sub">
                    62% Standard ➜ 99.4% Tailored Match Score
                  </div>
                </div>

                <div className="arch-node-box">
                  <div className="arch-node-icon phone">🚀</div>
                  <div className="arch-node-content">
                    <div className="arch-node-header">
                      <span className="arch-node-title">1-Click Apply &amp; Mock Drills</span>
                      <span className="arch-node-tag green">Passed Automated Filter</span>
                    </div>
                    <p className="arch-node-desc">
                      Human-paced smart form submission + real-time mock interview drills with instant feedback.
                    </p>
                  </div>
                </div>
              </div>

              {/* Solution Preview Card */}
              <div className="ai-solution-preview-box">
                <div className="ai-solution-header">
                  <span>🏆</span>
                  <strong>Live Application &amp; Interview Coaching Output:</strong>
                </div>
                <div className="ai-solution-item">
                  <span className="ai-solution-bullet">📊</span>
                  <div>
                    <strong>Resume Match:</strong> 99.4% Match Rate (Realigned WebRTC, distributed transactions &amp; high concurrency).
                  </div>
                </div>
                <div className="ai-solution-item">
                  <span className="ai-solution-bullet">🎯</span>
                  <div>
                    <strong>AI Mock Interview Coach:</strong> Scored 96/100 on System Architecture drill with specific feedback on caching strategies.
                  </div>
                </div>
              </div>

              <div className="status-pill-grid" style={{ marginTop: '1.25rem' }}>
                <span className="status-item-pill">✓ 99%+ ATS Filter Pass Rate</span>
                <span className="status-item-pill">✓ Greenhouse &amp; Lever Ready</span>
                <span className="status-item-pill">✓ Real-Time Mock Interview Drills</span>
                <span className="status-item-pill">✓ Anti-Bot Human Typing Cadence</span>
              </div>
            </div>
          )}

          <div className="ai-privacy-banner">
            <ShieldIcon />
            <div>
              <strong>Privacy First Architecture:</strong> Zero mention of third-party AI provider names or models on customer controller screens. Pure, uncluttered output across all 3 platforms.
            </div>
          </div>
        </div>
      </section>

      {/* APP 2 DEEP DIVE: HELVIA MEETING COPILOT & INVISIBLE WHISPER HUD */}
      <section className="meeting-copilot-section feature-deep-section reveal" id="meeting-copilot-details" style={{ padding: '80px 0 60px' }}>
        <div className="container" style={{ maxWidth: 1240, margin: '0 auto', padding: '0 20px' }}>
          <div className="section-header-center" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="badge-tag" style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff', display: 'inline-flex', marginBottom: '1rem', fontWeight: 800 }}>
              <GhostIcon />
              <span>APP 02 • EXECUTIVE MEETING INTELLIGENCE</span>
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 3.4vw, 2.6rem)', fontWeight: 850, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '0.85rem', textShadow: '0 4px 20px rgba(0, 0, 0, 0.35)' }}>
              Sub-18ms In-Meeting Executive Intelligence
            </h2>
            <p className="muted" style={{ maxWidth: 840, margin: '0 auto', fontSize: '1.02rem', color: 'rgba(255, 255, 255, 0.88)', lineHeight: 1.6, textShadow: '0 2px 8px rgba(0, 0, 0, 0.25)' }}>
              Real-time conversational audio ingestion and structured first-person STAR talking points — 100% invisible on Zoom, Microsoft Teams, and Google Meet.
            </p>
          </div>

          {/* 4 Core Architectural Features in Split-Screen Style */}
          <div className="feature-deep-container" style={{ marginTop: '1.5rem' }}>
            <div className="feature-deep-text reveal-left">
              <div className="feature-points-list">
                <div className="feature-point-item stagger-1">
                  <div className="point-icon purple"><EyeOffIcon /></div>
                  <div>
                    <h3>Hardware Screenshare Invisibility Shield</h3>
                    <p>Uses native OS hardware display affinity to render the Copilot HUD 100% invisible to Zoom, Microsoft Teams, Google Meet, and screen recorders during live desktop shares.</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-2">
                  <div className="point-icon purple"><MicIcon /></div>
                  <div>
                    <h3>Sub-18ms Direct Soundcard Audio Ingest</h3>
                    <p>Direct audio loopback captures conversational speech in real-time as the interviewer speaks, eliminating audio lag without relaying sound to slow cloud servers.</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-3">
                  <div className="point-icon purple"><SparklesIcon /></div>
                  <div>
                    <h3>Structured Executive Talking Points (STAR Bullets)</h3>
                    <p>Automatically condenses complex technical questions into articulate first-person talking points formatted in STAR (Situation, Task, Action, Result) methodology.</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-4">
                  <div className="point-icon purple"><ShieldIcon /></div>
                  <div>
                    <h3>Zero Audio Echo &amp; Silent Whisper HUD</h3>
                    <p>Silent visual heads-up display ensures zero microphone feedback, acoustic echo, or telltale bot attendees entering your conference room.</p>
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
                  <span className="top-title">Visual Architecture • Stealth Screen Shield</span>
                </div>

                <div className="card-body-visual">
                  <div className="stealth-comparison-box">
                    {/* Audio & AI Ingest mini pipeline */}
                    <div className="stealth-pipeline-mini">
                      <span>🎙️ Soundcard Audio Loopback</span>
                      <span>➜</span>
                      <span>⚡ Local AI Engine (&lt;18ms)</span>
                      <span>➜</span>
                      <span>💡 Live Talking Points</span>
                    </div>

                    {/* The Visual Proof: Side by Side */}
                    <div className="stealth-screens-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                      {/* Card 1: What YOU See */}
                      <div className="stealth-screen-card you-see">
                        <div className="stealth-card-label">
                          <span>👀</span> What YOU See
                        </div>
                        <div className="stealth-preview-area">
                          <div className="stealth-hud-ghost-bubble">
                            <strong>💡 Suggested Answer:</strong>
                            <br />
                            • 1. Root Cause: Cache miss on spikes
                            <br />
                            • 2. Fix: Implemented Redis cluster
                            <br />
                            • 3. Impact: 90% DB load reduction
                          </div>
                        </div>
                        <p className="stealth-card-footer">
                          ✓ Private HUD floating on screen with live talking points.
                        </p>
                      </div>

                      {/* Card 2: What THEY See */}
                      <div className="stealth-screen-card meeting-sees">
                        <div className="stealth-card-label">
                          <span>🙈</span> What THEY See
                        </div>
                        <div className="stealth-preview-area">
                          <div className="stealth-clean-preview">
                            <span className="shield-stamp">🛡️ 100% INVISIBLE</span>
                            <span>Clean Desktop &amp; Slides only</span>
                          </div>
                        </div>
                        <p className="stealth-card-footer">
                          ✓ Attendees on Zoom, Teams &amp; Meet see zero popups.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="status-pill-grid">
                    <span className="status-item-pill">✓ Hardware Screen Shield</span>
                    <span className="status-item-pill">✓ Sub-18ms Local Audio</span>
                    <span className="status-item-pill">✓ Zero Meeting Bots</span>
                    <span className="status-item-pill">✓ STAR Talking Points</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}>
            <button 
              type="button" 
              className="eco-primary-btn purple"
              style={{ width: 'auto', minWidth: 260, padding: '0.9rem 2.25rem', fontSize: '1rem' }}
              onClick={() => {
                if (isSignedIn) navigate('/dashboard')
                else signInWithGoogle()
              }}
            >
              <GhostIcon />
              <span>Launch Meeting Copilot</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </div>
        </div>
      </section>

      {/* PRACTICAL 3: HELVIA AUTO APPLY & AI MOCK INTERVIEW COACH SIMULATOR */}
      <section className="autoapply-section feature-deep-section reveal" id="auto-apply-details" style={{ padding: '80px 0 60px' }}>
        <div className="container" style={{ maxWidth: 1240, margin: '0 auto', padding: '0 20px' }}>
          <div className="section-header-center" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="badge-tag" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', display: 'inline-flex', marginBottom: '1rem', fontWeight: 800 }}>
              <FileTextIcon />
              <span>APP 3 • CAREER AUTOPILOT • ARCHITECTURE DEEP DIVE</span>
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 3.4vw, 2.6rem)', fontWeight: 850, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '0.85rem', textShadow: '0 4px 20px rgba(0, 0, 0, 0.35)' }}>
              Autonomous ATS Resume Tailoring &amp; AI Mock Interview Practicer
            </h2>
            <p className="muted" style={{ maxWidth: 840, margin: '0 auto', fontSize: '1.02rem', color: 'rgba(255, 255, 255, 0.88)', lineHeight: 1.6, textShadow: '0 2px 8px rgba(0, 0, 0, 0.25)' }}>
              Test the autonomous application pipeline. Watch how our agent reads live job postings from Stripe, Cloudflare, and Scale AI, extracts required tech stacks, dynamically optimizes ATS match scores to 99%, and conducts interactive AI mock interview drills.
            </p>
          </div>

          {/* 4 Core Architectural Features in Split-Screen Style */}
          <div className="feature-deep-container" style={{ marginTop: '1.5rem' }}>
            <div className="feature-deep-text reveal-left">
              <div className="feature-points-list">
                <div className="feature-point-item stagger-1">
                  <div className="point-icon gold"><FileTextIcon /></div>
                  <div>
                    <h3>99% Dynamic ATS Match Optimization</h3>
                    <p>Parses live job descriptions in real-time to dynamically align semantic keywords, technical skills, and experience bullet points to bypass automated screening algorithms.</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-2">
                  <div className="point-icon gold"><ZapIcon /></div>
                  <div>
                    <h3>Multi-Portal Autonomous Submissions</h3>
                    <p>Autonomously maps and formats applications across Greenhouse, Lever, and Workday with human-emulated typing cadence and anti-bot verification.</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-3">
                  <div className="point-icon gold"><AwardIcon /></div>
                  <div>
                    <h3>Interactive Competency Interview Coach</h3>
                    <p>Practice behavioral, coding, and system design rounds against an AI interviewer with instant rubric scoring, delivery feedback, and STAR grading.</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-4">
                  <div className="point-icon gold"><CheckIcon /></div>
                  <div>
                    <h3>Pipeline Status &amp; Conversion Analytics</h3>
                    <p>Real-time telemetry dashboard tracking application submissions, progression stages, response velocities, and ATS keyword overlap scores.</p>
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
                  <span className="top-title">Visual Pipeline • ATS Match &amp; Practice</span>
                </div>

                <div className="card-body-visual">
                  <div className="talent-pipeline-visual">
                    {/* Portals Scanner */}
                    <div className="talent-portals-row">
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Target Portals:</span>
                      <span className="portal-chip">Greenhouse</span>
                      <span className="portal-chip">Lever</span>
                      <span className="portal-chip">Workday</span>
                    </div>

                    {/* Visual Resume Transformation Before vs After */}
                    <div className="talent-transform-grid">
                      <div className="transform-card before">
                        <span className="transform-score">❌ 62% Match</span>
                        <p className="transform-text">Standard Resume: Missing keywords, high risk of filter rejection.</p>
                      </div>

                      <div className="transform-arrow-col">➜</div>

                      <div className="transform-card after">
                        <span className="transform-score">✅ 99.4% Match</span>
                        <p className="transform-text">Tailored Highlights: Perfectly aligned to role requirements.</p>
                      </div>
                    </div>

                    {/* Dual Features: Dispatch & Practice */}
                    <div className="talent-dual-features">
                      <div className="talent-feature-pill">
                        <strong>🚀 1-Click Submit:</strong> Human-like typing pace passes anti-bot verification.
                      </div>
                      <div className="talent-feature-pill">
                        <strong>🎯 Mock Coach:</strong> Rehearse real interview drills with instant grading.
                      </div>
                    </div>
                  </div>

                  <div className="status-pill-grid">
                    <span className="status-item-pill">✓ 99%+ ATS Keyword Match</span>
                    <span className="status-item-pill">✓ Anti-Bot Human Cadence</span>
                    <span className="status-item-pill">✓ Greenhouse &amp; Lever Ready</span>
                    <span className="status-item-pill">✓ Rubric Mock Interview Drills</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}>
            <button 
              type="button" 
              className="eco-primary-btn gold"
              style={{ width: 'auto', minWidth: 260, padding: '0.9rem 2.25rem', fontSize: '1rem' }}
              onClick={() => {
                if (isSignedIn) navigate('/dashboard')
                else signInWithGoogle()
              }}
            >
              <FileTextIcon />
              <span>Start Auto-Applying</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </div>
        </div>
      </section>

      {/* NEW: 5 Professional Real-World Workflow Scenarios */}
      <section className="scenarios-section reveal" id="scenarios">
        <div className="section-header-center">
          <p className="eyebrow">FIELD TESTED WORKFLOWS</p>
          <h2>Engineered for High-Stakes Production Scenarios</h2>
          <p className="muted">See how software engineers, sysadmins, and power users deploy Helvia under critical pressure.</p>
        </div>

        <div className="scenarios-container">
          <div className="scenarios-tabs-list">
            {WORKFLOW_SCENARIOS.map((scenario, index) => (
              <button 
                key={index}
                className={`scenario-nav-item ${activeScenario === index ? 'active' : ''}`}
                onClick={() => setActiveScenario(index)}
              >
                <span className="scenario-nav-num">0{index + 1}</span>
                <div className="scenario-nav-text">
                  <strong>{scenario.title}</strong>
                  <span>{scenario.badge}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="scenario-content-card reveal-scale">
            <div className="scenario-card-header">
              <span className="scenario-badge">{WORKFLOW_SCENARIOS[activeScenario].badge}</span>
              <h3>{WORKFLOW_SCENARIOS[activeScenario].title}</h3>
              <p className="scenario-subtitle">{WORKFLOW_SCENARIOS[activeScenario].subtitle}</p>
            </div>

            <div className="scenario-body-grid">
              <div className="scenario-narrative">
                <div className="narrative-block">
                  <strong>The Situation:</strong>
                  <p>{WORKFLOW_SCENARIOS[activeScenario].context}</p>
                </div>
                <div className="narrative-block">
                  <strong>The Helvia Action:</strong>
                  <p>{WORKFLOW_SCENARIOS[activeScenario].solution}</p>
                </div>

                <div className="scenario-code-box">
                  <div className="code-box-header">Live Shell / Execution Trace</div>
                  <pre><code>{WORKFLOW_SCENARIOS[activeScenario].codeSnippet}</code></pre>
                </div>
              </div>

              <div className="scenario-metrics-col">
                <span className="metrics-col-title">Measured Impact</span>
                {WORKFLOW_SCENARIOS[activeScenario].metrics.map((m, mIdx) => (
                  <div className="scenario-metric-item" key={mIdx}>
                    <span className="scenario-metric-label">{m.label}</span>
                    <span className="scenario-metric-val">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Interactive Productivity & ROI Calculator */}
      <section className="roi-calculator-section reveal" id="calculator">
        <div className="section-header-center">
          <p className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <SlidersIcon /> TIME &amp; COST EFFICIENCY
          </p>
          <h2>Interactive Team Productivity &amp; ROI Calculator</h2>
          <p className="muted">Calculate how many hours and subscription dollars your engineering team recovers every month.</p>
        </div>

        <div className="roi-calculator-card reveal-scale">
          <div className="roi-inputs-col">
            <div className="roi-slider-group">
              <div className="roi-slider-header">
                <label htmlFor="team-size-range">Team Size (Engineers / IT Pros)</label>
                <span className="slider-current-val">{roiTeamSize} members</span>
              </div>
              <input 
                id="team-size-range"
                type="range" 
                min="1" 
                max="50" 
                value={roiTeamSize}
                onChange={(e) => setRoiTeamSize(Number(e.target.value))}
                className="roi-slider"
              />
              <div className="slider-ticks">
                <span>1</span>
                <span>15</span>
                <span>30</span>
                <span>50</span>
              </div>
            </div>

            <div className="roi-slider-group">
              <div className="roi-slider-header">
                <label htmlFor="hours-range">Remote On-Call &amp; Access Hours / Week</label>
                <span className="slider-current-val">{roiHoursPerWeek} hrs / member</span>
              </div>
              <input 
                id="hours-range"
                type="range" 
                min="2" 
                max="30" 
                value={roiHoursPerWeek}
                onChange={(e) => setRoiHoursPerWeek(Number(e.target.value))}
                className="roi-slider"
              />
              <div className="slider-ticks">
                <span>2 hrs</span>
                <span>10 hrs</span>
                <span>20 hrs</span>
                <span>30 hrs</span>
              </div>
            </div>

            <div className="roi-notes-pill">
              <ZapIcon />
              <span>Assumes 35% time recovery from instant QR connection &amp; "Ans 💡" auto-routing.</span>
            </div>
          </div>

          <div className="roi-results-col">
            <div className="roi-stat-box highlight">
              <span className="roi-stat-title">Monthly Engineering Hours Saved</span>
              <span className="roi-stat-number">{hoursSavedPerMonth} hrs</span>
              <span className="roi-stat-desc">Eliminating cumbersome VPN handshakes and heavy client bootups</span>
            </div>

            <div className="roi-stat-box">
              <span className="roi-stat-title">Estimated Annual License Savings</span>
              <span className="roi-stat-number">${annualDollarSavings.toLocaleString()}</span>
              <span className="roi-stat-desc">Compared to legacy enterprise TeamViewer &amp; AnyDesk tiered pricing</span>
            </div>

            <div className="roi-stat-box">
              <span className="roi-stat-title">Incident MTTR Reduction</span>
              <span className="roi-stat-number">64% Faster</span>
              <span className="roi-stat-desc">Immediate phone-to-desktop triage from anywhere with full lock mode</span>
            </div>
          </div>
        </div>
      </section>

      {/* Target Market / Who is this App For */}
      <section className="target-market-section reveal" id="target-market">
        <div className="section-header-center">
          <p className="eyebrow">ENTERPRISE USE CASES</p>
          <h2>Engineered for Technology Leaders, Architects &amp; Remote Teams</h2>
          <p className="muted">From mission-critical remote workstation control to executive boardroom intelligence and talent mobility.</p>
        </div>

        <div className="grid three-col-grid">
          <div className="target-card reveal stagger-1">
            <div className="target-icon"><TerminalIcon /></div>
            <h3>Software Engineers &amp; Tech Leads</h3>
            <p className="muted">
              Zero-trust remote workstation control with low-level Windows hardware hooks, IDE pair-programming, and real-time meeting copilot for technical architectural panels.
            </p>
          </div>

          <div className="target-card reveal stagger-2">
            <div className="target-icon" style={{ color: '#c084fc' }}><AwardIcon /></div>
            <h3>Career Professionals &amp; Candidates</h3>
            <p className="muted">
              Autonomous talent mobility with dynamic ATS resume alignment, interactive mock interview preparation, and real-time display-protected guidance during client evaluations.
            </p>
          </div>

          <div className="target-card reveal stagger-3">
            <div className="target-icon" style={{ color: '#38bdf8' }}><ServerIcon /></div>
            <h3>Sysadmins &amp; DevOps Engineers</h3>
            <p className="muted">
              Emergency production cluster and host desktop triage directly from mobile devices with zero client footprints, physical touch trackpads, and 60 FPS WebRTC.
            </p>
          </div>
        </div>
      </section>

      {/* Step-by-Step: How It Works */}
      <section className="how reveal" id="how-it-works">
        <div className="how-copy reveal-left">
          <p className="eyebrow">INSTANT ONBOARDING</p>
          <h2>Up and Running in 30 Seconds</h2>
          <p className="muted">
            One single account unlocks the entire ecosystem. Zero complicated setup or multiple logins.
          </p>

          <div className="how-steps">
            <div className="how-step stagger-1">
              <span className="how-step-number">01</span>
              <div>
                <p className="how-step-title">One-Click Google Sign In</p>
                <p className="how-step-text">Sign in once to activate your unified dashboard with bundled remote minutes, AI answer credits, and auto-apply quotas.</p>
              </div>
            </div>

            <div className="how-step stagger-2">
              <span className="how-step-number">02</span>
              <div>
                <p className="how-step-title">Select Your Power Tool</p>
                <p className="how-step-text">Launch Helvia Remote on your PC, activate the invisible Meeting Copilot HUD during calls, or configure your Auto Apply career filters.</p>
              </div>
            </div>

            <div className="how-step stagger-3">
              <span className="how-step-number">03</span>
              <div>
                <p className="how-step-title">Execute with Complete Discretion</p>
                <p className="how-step-text">Enjoy sub-15ms 60 FPS remote desktop control, receive undetectable speech whispers on Zoom/Meet, and submit tailored applications on autopilot.</p>
              </div>
            </div>

            <div className="how-step stagger-4">
              <span className="how-step-number">04</span>
              <div>
                <p className="how-step-title">Share Quotas &amp; Top Up Anytime</p>
                <p className="how-step-text">Upgrade your plan or top up individual quotas seamlessly with local Indian UPI/cards via Razorpay or globally via Dodo Payments.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="how-visual reveal-right">
          <div className="unified-launchpad-card">
            <div className="launchpad-card-header">
              <div className="launchpad-status-indicator">
                <span className="live-dot" />
                <span>UNIFIED ECOSYSTEM ACTIVE</span>
              </div>
              <span className="launchpad-tier-pill">PRO+ INCLUDED</span>
            </div>

            <div className="launchpad-card-title-wrap">
              <h3>One Account. All 3 Workspaces Unlocked.</h3>
              <p>Everything is pre-configured and instantly accessible the moment you log in.</p>
            </div>

            <div className="launchpad-apps-stack">
              {/* App 1 */}
              <div className="launchpad-app-item">
                <div className="launchpad-app-icon remote">🖥️</div>
                <div className="launchpad-app-info">
                  <div className="launchpad-app-top">
                    <strong>1. Remote Desktop</strong>
                    <span className="app-status-badge green">🟢 60 FPS Online</span>
                  </div>
                  <p>Instant phone &amp; laptop control with sub-15ms direct P2P streaming.</p>
                </div>
              </div>

              {/* App 2 */}
              <div className="launchpad-app-item">
                <div className="launchpad-app-icon copilot">🎙️</div>
                <div className="launchpad-app-info">
                  <div className="launchpad-app-top">
                    <strong>2. Meeting Copilot</strong>
                    <span className="app-status-badge purple">🛡️ Shield Active</span>
                  </div>
                  <p>100% invisible on Zoom &amp; Teams with sub-18ms STAR talking points.</p>
                </div>
              </div>

              {/* App 3 */}
              <div className="launchpad-app-item">
                <div className="launchpad-app-icon autoapply">🚀</div>
                <div className="launchpad-app-info">
                  <div className="launchpad-app-top">
                    <strong>3. Talent Mobility &amp; ATS</strong>
                    <span className="app-status-badge gold">✅ 99.4% Match</span>
                  </div>
                  <p>1-click submissions to Greenhouse, Lever &amp; AI mock interview drills.</p>
                </div>
              </div>
            </div>

            <div className="launchpad-card-footer">
              <div className="launchpad-trust-note">
                <span>🔒 Single unified login</span>
                <span>•</span>
                <span>⚡ Shared quota pool</span>
                <span>•</span>
                <span>🛡️ Zero install needed</span>
              </div>
              <a href="#practical-remote" className="launchpad-cta-btn">
                <span>Explore Live Practicals Above</span>
                <span>➜</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Matrix */}
      <section className="comparison-section reveal" id="comparison">
        <div className="section-header-center">
          <p className="eyebrow">HOW WE COMPARE</p>
          <h2>Helvia 3-in-1 Suite vs Fragmented Competitors</h2>
          <p className="muted">Why professionals choose Helvia instead of paying for 3 separate disconnected tools.</p>
        </div>

        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature Capability</th>
                <th className="highlight-col">Helvia 3-in-1 Suite</th>
                <th>Legacy Remote (AnyDesk)</th>
                <th>Meeting Bots (Otter/Fireflies)</th>
                <th>Job Bots (LazyApply)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Zero-Install 60 FPS Remote Desktop</strong></td>
                <td className="highlight-col"><CheckIcon /> Built-in (WebRTC /m/ &amp; /d/)</td>
                <td>❌ Requires heavy app</td>
                <td>❌ None</td>
                <td>❌ None</td>
              </tr>
              <tr>
                <td><strong>100% Invisible on Screenshares (Zoom/Teams/Meet)</strong></td>
                <td className="highlight-col"><CheckIcon /> Yes (WDA_EXCLUDEFROMCAPTURE)</td>
                <td>❌ Visible taskbar/banners</td>
                <td>❌ Bot visibly joins call</td>
                <td>❌ None</td>
              </tr>
              <tr>
                <td><strong>Real-Time "What to Speak" Whisper HUD</strong></td>
                <td className="highlight-col"><CheckIcon /> Sub-200ms talking points</td>
                <td>❌ None</td>
                <td>⚠️ Post-call transcripts only</td>
                <td>❌ None</td>
              </tr>
              <tr>
                <td><strong>AI Screen Analysis ("Ans 💡" Engine)</strong></td>
                <td className="highlight-col"><CheckIcon /> Built-in 3-way routing</td>
                <td>❌ None</td>
                <td>❌ None</td>
                <td>❌ None</td>
              </tr>
              <tr>
                <td><strong>Dynamic ATS Resume Tailoring per JD</strong></td>
                <td className="highlight-col"><CheckIcon /> 98% ATS pass rate</td>
                <td>❌ None</td>
                <td>❌ None</td>
                <td>⚠️ Blasts static resume</td>
              </tr>
              <tr>
                <td><strong>Interactive AI Mock Interview Coach</strong></td>
                <td className="highlight-col"><CheckIcon /> Built-in with rubrics &amp; score</td>
                <td>❌ None</td>
                <td>❌ None</td>
                <td>❌ None</td>
              </tr>
              <tr>
                <td><strong>Combined Monthly Price</strong></td>
                <td className="highlight-col">💎 $8 – $15 (All 3 Included)</td>
                <td>💸 $30 – $50 / mo</td>
                <td>💸 $20 – $40 / mo</td>
                <td>💸 $25 – $50 / mo</td>
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
            <div className="stat-icon" style={{ color: '#c084fc' }}><SparklesIcon /></div>
            <p className="stat-number">85,000+</p>
            <p className="stat-label">AI Answers Whispered</p>
          </div>
          <div className="stat-item stagger-3">
            <div className="stat-icon" style={{ color: '#fbbf24' }}><FileTextIcon /></div>
            <p className="stat-number">140,000+</p>
            <p className="stat-label">Job Applications Submitted</p>
          </div>
          <div className="stat-item stagger-4">
            <div className="stat-icon" style={{ color: '#38bdf8' }}><ZapIcon /></div>
            <p className="stat-number">&lt; 16 ms</p>
            <p className="stat-label">Glass-to-Glass Latency</p>
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
      <section className="pricing-section reveal" id="pricing">
        <div className="pricing-panel reveal">
          <div className="pricing-section-header">
            <div className="pricing-eyebrow-pill">
              <span>💎</span> UNIFIED SUBSCRIPTION
            </div>
            <h2>Simple, Transparent Pricing</h2>
            <p className="pricing-subtitle">One unified subscription powers all 3 breakthrough apps: Helvia Remote, Meeting Copilot, and Auto Apply &amp; Coach.</p>
          </div>
          
          <div className="plans-grid">
            {(plans && plans.length > 0 ? plans : SEED_PLANS).map((p, idx) => {
              const isPopular = p.name.toLowerCase().includes('most popular') || p.name.toLowerCase().includes('pro+ pro')
              const isLifetime = p.tier === 'pro plus+'
              const isFree = Number(p.price) === 0
              const isCurrentActive = userPlan && (
                userPlan === p.tier || 
                (isFree && (userPlan === 'basic' || !userPlan)) ||
                (userPlan.toLowerCase() === p.name.toLowerCase())
              )

              return (
                <div 
                  className={`plan-card stagger-${(idx % 4) + 1} ${isPopular ? 'popular' : ''} ${isLifetime ? 'lifetime' : ''}`} 
                  key={p.id || idx}
                >
                  <div className={`plan-badge ${isPopular ? 'popular-badge' : isLifetime ? 'lifetime-badge' : isFree ? 'free-badge' : 'standard-badge'}`}>
                    <span>{isPopular ? '✨ Most Popular' : isLifetime ? '💎 Lifetime BYOK' : isFree ? '⚡ Free Trial' : '🚀 3-in-1 Suite'}</span>
                  </div>

                  <h3 className="plan-name">{p.name}</h3>
                  
                  <div className="plan-price-wrap">
                    <div className="plan-price">
                      {isFree ? (
                        <span className="price-val">Free</span>
                      ) : (
                        <>
                          <span className="price-currency">$</span>
                          <span className="price-val">{p.price}</span>
                          <span className="price-inr-chip">₹{getPlanInrPrice(p.price)}</span>
                          <span className="price-period">{isLifetime ? '/ life' : '/ pack'}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="plan-meta">
                    {isFree 
                      ? 'Basic account with 0 quotas. Upgrade to activate your unified suite.' 
                      : isLifetime
                        ? 'Unlimited lifetime remote access with Bring Your Own Keys.'
                        : `${p.included_minutes} mins remote, ${p.included_responses} copilot answers, ${p.included_applications} job auto-applies.`}
                  </p>

                  <ul className="plan-feature-list">
                    <li><CheckIcon /> <span><strong>{isFree ? '0' : p.included_applications}</strong> Job Auto-Applies (LinkedIn & ATS)</span></li>
                    <li><CheckIcon /> <span>{isLifetime ? 'Unlimited Remote' : isFree ? '0 Remote Mins (Upgrade required)' : `${p.included_minutes} Remote Mins`}</span></li>
                    <li><CheckIcon /> <span>{isFree ? '0 Copilot Answers (Upgrade required)' : `${p.included_responses} Copilot Answers`}</span></li>
                    <li><CheckIcon /> <span>Anti-Detect Hardware (WDA)</span></li>
                    {isFree ? (
                      <li className="disabled-feat"><span>🔒 Executive Copilot & Auto-Apply</span></li>
                    ) : (
                      <li><CheckIcon /> <span>AI Interview Coach</span></li>
                    )}
                  </ul>

                  <div className="plan-cta">
                    {isFree ? (
                      <button className="plan-cta-main secondary" type="button" disabled>
                        Active by Default
                      </button>
                    ) : isCurrentActive ? (
                      <button className="plan-cta-main secondary" type="button" disabled>
                        ✓ Current Plan
                      </button>
                    ) : (
                      <button
                        className={`plan-cta-main ${isPopular ? 'primary' : 'secondary'}`}
                        type="button"
                        onClick={() => {
                          setSelectedPlanForPayment(p)
                          setIsPaymentModalOpen(true)
                        }}
                      >
                        Select (${p.price} / ₹{getPlanInrPrice(p.price)})
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Dynamic On-Demand Top-Up Station */}
          <InteractiveTopupStation onTopup={handleTopup} />

          <div className="pricing-accepted-footer">
            <p>
              🔒 Accepted methods: <strong>Razorpay</strong> (UPI, PhonePe, GPay, Paytm) &amp; <strong>Dodo</strong> (Cards, Apple Pay). Instant activation.
            </p>
          </div>
        </div>
      </section>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        plan={selectedPlanForPayment}
        onSelectRazorpay={handleRazorpayUpgrade}
        onSelectDodo={handleDodoUpgrade}
      />

      {/* NEW: Comprehensive Technical FAQ Accordion */}
      <section className="faq-section reveal" id="faq">
        <div className="section-header-center">
          <p className="eyebrow">ARCHITECTURE &amp; COMPLIANCE</p>
          <h2>Frequently Asked Questions</h2>
          <p className="muted">Frequently asked questions regarding zero-trust architecture, display privacy, cryptographic protocols, and SLA commitments.</p>
        </div>

        <div className="faq-accordion-container reveal-scale">
          {FAQS.map((faq, idx) => (
            <div className={`faq-accordion-item ${openFaq[idx] ? 'open' : ''}`} key={idx}>
              <button 
                type="button" 
                className="faq-question-btn" 
                onClick={() => toggleFaq(idx)}
                aria-expanded={Boolean(openFaq[idx])}
              >
                <span className="faq-q-text">{faq.q}</span>
                <span className="faq-chevron-wrap">
                  <ChevronDownIcon open={Boolean(openFaq[idx])} />
                </span>
              </button>
              {openFaq[idx] && (
                <div className="faq-answer-pane">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Marquee */}
      {(() => {
        const ROW1_TESTIMONIALS = [
          {
            quote: "The zero-trust WebRTC mobile controller is phenomenal. I safely triage and manage critical production clusters right from my phone with sub-15ms latency and full SOC-2 compliance.",
            author: "David Chen",
            role: "VP of Infrastructure & Security",
            companyTag: "Hyperscale Cloud Ops",
            initials: "DC",
            avatarGradient: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
            badgeLabel: "Helvia Remote",
            badgeBg: "#eff6ff",
            badgeColor: "#1d4ed8",
            badgeBorder: "#bfdbfe",
            icon: <BriefcaseIcon />
          },
          {
            quote: "Helvia Executive Copilot delivers structured, context-aware briefing notes in sub-18ms. Its hardware screenshare exclusion ensures our confidential engineering trade-offs stay completely private.",
            author: "Dr. Elena Rostova",
            role: "Principal Distributed Systems Architect",
            companyTag: "FinTech Systems Lab",
            initials: "ER",
            avatarGradient: "linear-gradient(135deg, #9333ea 0%, #ec4899 100%)",
            badgeLabel: "Executive Copilot",
            badgeBg: "#faf5ff",
            badgeColor: "#7e22ce",
            badgeBorder: "#e9d5ff",
            icon: <GhostIcon />
          },
          {
            quote: "The Talent Mobility engine aligned our candidate profile across 250+ technical job descriptions with 99% ATS compliance. The structured competency drills completely eliminated interview friction.",
            author: "Marcus Vance",
            role: "Senior Staff Software Engineer",
            companyTag: "Enterprise Mobility",
            initials: "MV",
            avatarGradient: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
            badgeLabel: "Talent Mobility",
            badgeBg: "#ecfdf5",
            badgeColor: "#047857",
            badgeBorder: "#a7f3d0",
            icon: <FileTextIcon />
          },
          {
            quote: "Managing production Kubernetes clusters from my iPad during critical outages without exposing SSH ports or installing client software has transformed our on-call incident response time.",
            author: "Liam Gallagher",
            role: "Head of Site Reliability",
            companyTag: "Global SRE Platform",
            initials: "LG",
            avatarGradient: "linear-gradient(135deg, #0891b2 0%, #0284c7 100%)",
            badgeLabel: "Zero-Install Web Access",
            badgeBg: "#f0fdfa",
            badgeColor: "#0f766e",
            badgeBorder: "#99f6e4",
            icon: <TerminalIcon />
          }
        ];

        const ROW2_TESTIMONIALS = [
          {
            quote: "Hardware Lock Mode on mobile devices prevents accidental gesture disconnections during critical infrastructure deployments. The 60 FPS frame accuracy and crisp input handling is unmatched.",
            author: "Karthik Menon",
            role: "Lead Cloud Infrastructure Engineer",
            companyTag: "Edge Mesh Networks",
            initials: "KM",
            avatarGradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            badgeLabel: "Hardware Lock Mode",
            badgeBg: "#fff1f2",
            badgeColor: "#be123c",
            badgeBorder: "#fecdd3",
            icon: <LockIcon />
          },
          {
            quote: "The competency-based mock interview practicer drilled me on system design with realistic rubric scoring and architectural trade-offs. It is an indispensable executive preparation tool.",
            author: "Sarah Jenkins",
            role: "Director of Engineering",
            companyTag: "NextGen AI Architectures",
            initials: "SJ",
            avatarGradient: "linear-gradient(135deg, #d97706 0%, #ea580c 100%)",
            badgeLabel: "Interview Practicer",
            badgeBg: "#fffbeb",
            badgeColor: "#b45309",
            badgeBorder: "#fde68a",
            icon: <AwardIcon />
          },
          {
            quote: "Consolidating zero-trust remote access, live meeting intelligence, and career mobility into one enterprise subscription cut our software licensing overhead significantly.",
            author: "Robert Zhang",
            role: "Chief Technology Officer",
            companyTag: "Enterprise Platform CTO",
            initials: "RZ",
            avatarGradient: "linear-gradient(135deg, #e11d48 0%, #c026d3 100%)",
            badgeLabel: "Unified Enterprise Suite",
            badgeBg: "#eef2ff",
            badgeColor: "#4338ca",
            badgeBorder: "#c7d2fe",
            icon: <HeartIcon />
          },
          {
            quote: "Our engineering candidates save 15+ hours weekly on customized technical applications while maintaining a 92% interview conversion rate through intelligent ATS tailoring.",
            author: "Priya Sharma",
            role: "VP of Technical Talent",
            companyTag: "Scale Talent Partners",
            initials: "PS",
            avatarGradient: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
            badgeLabel: "Autonomous AutoApply",
            badgeBg: "#faf5ff",
            badgeColor: "#6b21a8",
            badgeBorder: "#d8b4fe",
            icon: <SparklesIcon />
          }
        ];

        return (
          <section className="marquee-section reveal">
            <div className="marquee-header">
              <div className="marquee-eyebrow-pill">
                <span className="eyebrow-stars">★★★★★</span>
                <span>TRUSTED BY 1,200+ ENTERPRISE TEAMS</span>
              </div>
              <h2>Trusted by Technology Leaders &amp; Enterprise Engineers</h2>
              <p className="marquee-subtitle">
                See how infrastructure directors, architects, and technical professionals rely on Helvia platforms daily
              </p>
            </div>
            
            {/* Row 1 */}
            <div className="marquee-row">
              <div className="marquee-track">
                {[...ROW1_TESTIMONIALS, ...ROW1_TESTIMONIALS, ...ROW1_TESTIMONIALS, ...ROW1_TESTIMONIALS].map((item, idx) => (
                  <div key={`row1-${idx}`} className="marquee-card">
                    <div className="marquee-card-header">
                      <div 
                        className="marquee-badge" 
                        style={{ 
                          background: item.badgeBg, 
                          color: item.badgeColor, 
                          border: `1px solid ${item.badgeBorder}` 
                        }}
                      >
                        {item.icon}
                        <span>{item.badgeLabel}</span>
                      </div>
                      <div className="marquee-rating-verified">
                        <div className="card-stars">
                          {[...Array(5)].map((_, sIdx) => (
                            <svg key={sIdx} width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          ))}
                        </div>
                        <span className="verified-pill">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Verified
                        </span>
                      </div>
                    </div>

                    <p className="marquee-text">"{item.quote}"</p>

                    <div className="marquee-card-footer">
                      <div className="marquee-avatar" style={{ background: item.avatarGradient }}>
                        {item.initials}
                      </div>
                      <div className="marquee-author-details">
                        <div className="marquee-author-name-row">
                          <span className="marquee-author">{item.author}</span>
                          <span className="marquee-company-tag">{item.companyTag}</span>
                        </div>
                        <p className="marquee-role">{item.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2 */}
            <div className="marquee-row reverse">
              <div className="marquee-track">
                {[...ROW2_TESTIMONIALS, ...ROW2_TESTIMONIALS, ...ROW2_TESTIMONIALS, ...ROW2_TESTIMONIALS].map((item, idx) => (
                  <div key={`row2-${idx}`} className="marquee-card">
                    <div className="marquee-card-header">
                      <div 
                        className="marquee-badge" 
                        style={{ 
                          background: item.badgeBg, 
                          color: item.badgeColor, 
                          border: `1px solid ${item.badgeBorder}` 
                        }}
                      >
                        {item.icon}
                        <span>{item.badgeLabel}</span>
                      </div>
                      <div className="marquee-rating-verified">
                        <div className="card-stars">
                          {[...Array(5)].map((_, sIdx) => (
                            <svg key={sIdx} width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          ))}
                        </div>
                        <span className="verified-pill">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Verified
                        </span>
                      </div>
                    </div>

                    <p className="marquee-text">"{item.quote}"</p>

                    <div className="marquee-card-footer">
                      <div className="marquee-avatar" style={{ background: item.avatarGradient }}>
                        {item.initials}
                      </div>
                      <div className="marquee-author-details">
                        <div className="marquee-author-name-row">
                          <span className="marquee-author">{item.author}</span>
                          <span className="marquee-company-tag">{item.companyTag}</span>
                        </div>
                        <p className="marquee-role">{item.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      })()}

      {/* Enterprise Multi-Column Footer */}
      <footer className="site-footer formal-enterprise-footer">
        <div className="footer-top-container">
          <div className="footer-brand-column">
            <div className="footer-brand-header">
              <div className="brand-mark-mini">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="footer-brand-title">Helvia Enterprise</span>
              <span className="footer-brand-badge">SOC-2 VERIFIED</span>
            </div>
            <p className="footer-brand-desc">
              Unified professional infrastructure engineered for zero-trust remote workstation control, sub-18ms executive meeting intelligence, and autonomous ATS career mobility.
            </p>
            <div className="footer-trust-seals">
              <span className="footer-seal-item">🛡️ SOC 2 Type II</span>
              <span className="footer-seal-item">🔒 AES-256 E2EE</span>
              <span className="footer-seal-item">⚡ 99.99% SLA</span>
            </div>
          </div>

          <div className="footer-nav-columns">
            <div className="footer-nav-col">
              <h4>Platforms</h4>
              <ul>
                <li><a href="#practical-remote">Helvia Remote Desktop</a></li>
                <li><a href="#meeting-copilot">Executive Meeting Copilot</a></li>
                <li><a href="#auto-apply">Talent Mobility &amp; ATS</a></li>
                <li><a href="#controllers">Zero-Install Web Access</a></li>
                <li><a href="https://pub-4ec430c8cdbd49ffb57191dca016c43b.r2.dev/Helvia%20Remote%20Setup%200.1.0.exe">Windows Host Client (.exe)</a></li>
              </ul>
            </div>

            <div className="footer-nav-col">
              <h4>Architecture</h4>
              <ul>
                <li><a href="#features">Zero-Trust Kernel IOCTL</a></li>
                <li><a href="#features">Display Capture Privacy (WDA)</a></li>
                <li><a href="#calculator">ROI &amp; Efficiency Model</a></li>
                <li><a href="#scenarios">Field-Tested Workflows</a></li>
                <li><a href="#benchmarks">Hardware Benchmarks</a></li>
              </ul>
            </div>

            <div className="footer-nav-col">
              <h4>Governance &amp; Trust</h4>
              <ul>
                <li><Link to="/privacypolicy">Privacy &amp; Data Architecture</Link></li>
                <li><Link to="/termsofservice">Enterprise Terms of Service</Link></li>
                <li><Link to="/refundcancellation">Refund &amp; SLA Guarantee</Link></li>
                <li><a href="#faq">Frequently Asked Questions</a></li>
                <li>
                  <a 
                    href="https://wa.me/919032025916?text=Hi%2C%20I%20need%20support%20with%20Helvia%20Remote" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#25D366', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <span>💬</span> WhatsApp Support (+91 9032025916)
                  </a>
                </li>
                <li><a href="mailto:support@helvia.online">Executive Email Support</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-divider-line"></div>

        <div className="footer-bottom-container">
          <div className="footer-bottom-left">
            <span className="footer-founder-tag">Founder: N Yashwanth</span>
            <span className="footer-pipe">|</span>
            <span className="footer-status-pill">
              <span className="status-indicator-green"></span>
              All Global Edge Clusters Operational (99.99%)
            </span>
          </div>
          <div className="footer-bottom-right">
            <span>© 2026 Helvia Technologies Inc. All enterprise platforms, protocols, and trademarks reserved.</span>
          </div>
        </div>
      </footer>
    </>
  )
}

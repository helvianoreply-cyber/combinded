import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SkyCanvas3D } from './SkyCanvas3D'
import { UnifiedSimultaneousPracticalsArena } from './UnifiedSimultaneousPracticalsArena'
import { type DbPlan, SEED_PLANS, getPlanInrPrice } from '../lib/database.types'
import { HELVIA_DOWNLOAD_LINKS } from '../lib/downloadLinks'
import { PaymentModal } from './PaymentModal'
import { InteractiveTopupStation } from './InteractiveTopupStation'
import { VideoTutorialsSection } from './VideoTutorialsSection'
import { validateCoupon, calculateDiscount, calculateUsdDiscount, type CouponInfo } from '../lib/coupons'

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

const EyeOffIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
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

const BENCHMARK_DATA = {
  latency: [
    { name: 'Helvia Remote', value: 'Instant (<16ms)', score: 100, highlight: true, note: 'Feels like sitting right in front of your computer screen' },
    { name: 'Parsec', value: 'Fast (28ms)', score: 78, highlight: false, note: 'Good speed, but requires complicated gaming software' },
    { name: 'AnyDesk', value: 'Laggy (42ms)', score: 55, highlight: false, note: 'Noticeable delays and stuttering during busy hours' },
    { name: 'RustDesk', value: 'Slow (54ms)', score: 45, highlight: false, note: 'Inconsistent connection speed when typing' },
    { name: 'TeamViewer', value: 'Very Slow (68ms)', score: 35, highlight: false, note: 'Heavy lag when moving mouse or opening apps' },
    { name: 'Chrome Remote', value: 'High Lag (88ms)', score: 25, highlight: false, note: 'Delayed video and sluggish keystroke response' },
  ],
  stealth: [
    { name: 'Helvia Suite (Remote & Copilot)', value: '100% Invisible', score: 100, highlight: true, note: 'Completely hidden on screen share — zero bots join the call' },
    { name: 'Otter.ai / Fireflies', value: '0% Invisible', score: 0, highlight: false, note: 'An obvious bot joins the call and alerts other attendees' },
    { name: 'Parsec', value: 'Visible (15%)', score: 15, highlight: false, note: 'Displays icons, overlays, and taskbar indicators' },
    { name: 'AnyDesk', value: 'Visible (0%)', score: 0, highlight: false, note: 'Shows taskbar watermarks and remote session warning popups' },
    { name: 'TeamViewer', value: 'Visible (0%)', score: 0, highlight: false, note: 'Displays warning banners and post-call splash popups' },
    { name: 'Chrome Remote', value: 'Visible (0%)', score: 0, highlight: false, note: 'Shows persistent "Your screen is shared" notification bar' },
  ],
  resumeMatch: [
    { name: 'Helvia Auto Apply', value: '98% ATS Pass', score: 98, highlight: true, note: 'Automatically tailors your resume for each individual job posting' },
    { name: 'JobRight / Simplify', value: '62% ATS Pass', score: 62, highlight: false, note: 'Fills form fields but sends the same unchanged static resume' },
    { name: 'LazyApply', value: '44% ATS Pass', score: 44, highlight: false, note: 'Blasts generic resumes that get filtered out by recruiters' },
    { name: 'Manual Applying', value: '52% ATS Pass', score: 52, highlight: false, note: 'Takes 20 minutes per application and quickly causes burnout' },
  ],
  cpu: [
    { name: 'Helvia Remote', value: 'Only ~1.8%', score: 98, highlight: true, note: 'Ultra-lightweight — does not slow down your PC or drain battery' },
    { name: 'Parsec', value: '4.2%', score: 85, highlight: false, note: 'Noticeable background processing usage' },
    { name: 'AnyDesk', value: '9.4%', score: 62, highlight: false, note: 'Spikes processor usage and causes laptop fans to spin up' },
    { name: 'RustDesk', value: '11.8%', score: 52, highlight: false, note: 'Uses high background CPU during remote sessions' },
    { name: 'TeamViewer', value: '14.2%', score: 40, highlight: false, note: 'Heavy software that visibly slows down other open programs' },
    { name: 'Chrome Remote', value: '18.6%', score: 30, highlight: false, note: 'Eats up huge amounts of browser memory and processor power' },
  ],
}

const WORKFLOW_SCENARIOS = [
  {
    title: 'Control Your PC from Your Phone',
    badge: 'Helvia Remote',
    subtitle: 'Access your home or office computer from any phone browser on the go',
    context: 'You are away from your desk or commuting, and you urgently need to access a file, check an app, or send a document from your computer.',
    solution: 'Open your phone browser and go to your private Helvia link. Tap to connect and use your phone screen like a smooth trackpad with full keyboard and mouse control.',
    flowSteps: [
      { step: '01', icon: '📱', title: 'Open Phone Browser', detail: 'Visit your private link on Safari or Chrome. No apps to download.' },
      { step: '02', icon: '📷', title: 'Scan PC QR Code', detail: 'Scan the on-screen code or enter your 6-digit PIN for instant pairing.' },
      { step: '03', icon: '⚡', title: 'Full 60 FPS Control', detail: 'Your desktop streams with smooth mouse, tap gestures, and full keyboard.' },
    ],
    caption: 'Connects instantly from your phone browser via QR code with smooth 60 FPS remote desktop streaming.',
    metrics: [
      { label: 'Time to Connect', value: '< 5 secs' },
      { label: 'App Install Needed', value: '0 MB' },
      { label: 'Input Delay', value: 'None (<20ms)' }
    ],
    codeSnippet: '1. Opened Safari / Chrome on mobile phone ➜ visited helvia.app/m\n2. Scanned QR code on PC screen to pair\n3. Accessed desktop, grabbed file & finished task in under 60 seconds',
  },
  {
    title: 'Ace Tough Questions in Video Interviews',
    badge: 'Helvia Meet (Interview Copilot)',
    subtitle: 'Discreet on-screen talking points when the interviewer asks a tricky question',
    context: 'During an interview on Zoom, Teams, or Google Meet, you are asked an unexpected question about an unfamiliar topic or complex scenario.',
    solution: 'Helvia listens in real time through your computer audio and immediately displays structured, natural talking points on your screen. The recruiter cannot see it, even while sharing screen.',
    flowSteps: [
      { step: '01', icon: '🎙️', title: 'Interviewer Speaks', detail: 'Recruiter asks a complex question during your Zoom, Teams, or Meet call.' },
      { step: '02', icon: '🧠', title: 'Real-Time Synthesis', detail: 'Helvia analyzes speech locally and structures STAR points in under 1 second.' },
      { step: '03', icon: '🛡️', title: 'Private Whisper HUD', detail: 'Clear talking points appear on your screen—100% invisible on screenshares.' },
    ],
    caption: '100% invisible on Zoom & Teams screenshares with real-time talking points and zero meeting bots.',
    metrics: [
      { label: 'Screen Invisibility', value: '100% Invisible' },
      { label: 'Response Speed', value: 'Under 1 sec' },
      { label: 'Meeting Bots', value: 'Zero (No bots)' }
    ],
    codeSnippet: 'Interviewer asks: "Tell me about a challenging conflict on your team."\nHelvia Whisper:\n• 1. Situation: Disagreement on project priorities\n• 2. Action: Set up a 1-on-1, listened first, and agreed on shared goals\n• 3. Result: Delivered project 2 days early with full team buy-in',
  },
  {
    title: 'Apply to Hundreds of Jobs on Autopilot',
    badge: 'Helvia Apply',
    subtitle: 'Automatically find matching jobs and submit tailored resumes while you sleep',
    context: 'Searching job boards and filling out the same repetitive application forms takes 15+ exhausting hours every single week.',
    solution: 'Select your target job title, location, and salary. Helvia searches top job boards, tailors your resume with the right keywords for each listing, and submits applications automatically.',
    flowSteps: [
      { step: '01', icon: '📄', title: 'Set Target Criteria', detail: 'Upload your master resume, choose preferred job titles, and set salary filters.' },
      { step: '02', icon: '🎯', title: 'Auto Keyword Tailoring', detail: 'Automatically re-aligns skills to reach 98% ATS match for each job posting.' },
      { step: '03', icon: '🚀', title: 'Autonomous Dispatch', detail: 'Submits 30+ applications daily with real-time tracking and zero manual forms.' },
    ],
    caption: 'Tailors your resume for each job description and submits applications automatically with 98% ATS match.',
    metrics: [
      { label: 'Time Saved', value: '15+ hrs / wk' },
      { label: 'Resume Match Rate', value: '98% ATS Pass' },
      { label: 'Interview Invites', value: '3-5x Increase' }
    ],
    codeSnippet: 'Job Search: "Senior Developer / Remote"\n✓ 42 matching openings discovered today\n✓ Customized skills & resume bullet points per company\n✓ Status: 38 applications submitted automatically [4 callbacks scheduled]',
  },
  {
    title: 'Stay Confident in Client & Work Meetings',
    badge: 'Meeting Copilot',
    subtitle: 'Instant stats, pricing details, and quick answers whispered right on your screen',
    context: 'In an important client pitch or management review, someone asks for specific pricing numbers, dates, or technical facts you don\'t recall offhand.',
    solution: 'Helvia catches the question and quietly displays the exact numbers and points on your screen, so you answer calmly and look thoroughly prepared.',
    flowSteps: [
      { step: '01', icon: '👥', title: 'Client Inquires', detail: 'Someone asks for an exact SLA, pricing detail, or historical milestone.' },
      { step: '02', icon: '⚡', title: 'Instant Fact Retrieval', detail: 'Helvia surfaces the exact figure or bullet point onto your screen instantly.' },
      { step: '03', icon: '🤝', title: 'Answer Confidently', detail: 'Deliver the exact answer smoothly without having to say "I\'ll check and get back".' },
    ],
    caption: 'Whispers instant facts, numbers, and answers right on your screen without attendees ever noticing.',
    metrics: [
      { label: 'Answer Latency', value: 'Instant' },
      { label: 'Screen Share', value: '100% Hidden' },
      { label: 'Client Trust', value: 'Maximum' }
    ],
    codeSnippet: 'Client asks: "What is your turnaround guarantee and refund policy?"\nHelvia Prompt:\n• Standard turnaround: 48 hours for full delivery\n• Satisfaction guarantee: 100% money-back within 14 days',
  },
  {
    title: 'Practice with AI Mock Interview Coach',
    badge: 'AI Interview Prep',
    subtitle: 'Interactive practice interviews with realistic questions and instant feedback',
    context: 'You have an important job interview tomorrow and want to practice answering out loud to build confidence and remove nervousness.',
    solution: 'Practice with Helvia\'s AI Coach. It asks real questions for your target job, listens to your spoken answers, and gives you scores and suggestions to improve.',
    flowSteps: [
      { step: '01', icon: '🤖', title: 'AI Questions', detail: 'Simulates tough questions tailored specifically to your target job profile.' },
      { step: '02', icon: '🗣️', title: 'Spoken Rehearsal', detail: 'Speak your answers out loud just like a real interview call.' },
      { step: '03', icon: '📊', title: 'Instant Score & Tips', detail: 'Get immediate STAR grading, delivery clarity feedback, and tips.' },
    ],
    caption: 'Simulates real interview questions with spoken practice, instant rubric scores, and targeted feedback.',
    metrics: [
      { label: 'Practice Rounds', value: 'Unlimited' },
      { label: 'Instant Feedback', value: 'Score & Tips' },
      { label: 'Confidence Boost', value: '100% Ready' }
    ],
    codeSnippet: 'Question: "Why should we hire you over other qualified candidates?"\nYour Spoken Answer: [Recorded and analyzed]\nAI Coach Score: 94 / 100\nFeedback: "Strong examples of past success. Tip: Mention your leadership experience earlier for an even bigger impact."',
  },
]

const FAQS = [
  {
    q: 'Are all 3 apps (Remote Desktop, Meeting Copilot, Auto Apply) included in one unified subscription?',
    a: 'Yes! Every paid plan (Standard $8, Pro+ Pro $15, and 1-Month Unlimited VIP $21) gives you unified access to all 3 platforms in one single account. You receive bundled pools of Remote Desktop minutes, live AI Copilot answer credits ("Ans 💡" & meeting whisperer), and Auto Apply job application quotas.',
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
  const [appliedCoupon, setAppliedCoupon] = useState<CouponInfo | null>(null)
  const [couponInputText, setCouponInputText] = useState('')
  const [couponFeedback, setCouponFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Detect ?coupon=CODE or ?ref=CODE from URL or localStorage
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const rawCode = urlParams.get('coupon') || urlParams.get('ref') || urlParams.get('code') || urlParams.get('promo')
      
      if (rawCode) {
        const valid = validateCoupon(rawCode)
        if (valid) {
          setAppliedCoupon(valid)
          setCouponInputText(valid.code)
          localStorage.setItem('helvia_creator_coupon', valid.code)
          return
        }
      }

      const stored = localStorage.getItem('helvia_creator_coupon')
      if (stored) {
        const valid = validateCoupon(stored)
        if (valid) {
          setAppliedCoupon(valid)
          setCouponInputText(valid.code)
        }
      }
    } catch {}
  }, [])

  const handleApplyCoupon = () => {
    setCouponFeedback(null)
    const raw = couponInputText.trim()
    if (!raw) {
      setCouponFeedback({ text: 'Please enter official coupon code: FIRST_50', type: 'error' })
      return
    }
    const found = validateCoupon(raw)
    if (found) {
      setAppliedCoupon(found)
      try {
        localStorage.setItem('helvia_creator_coupon', found.code)
      } catch {}
      setCouponFeedback({ text: `🎉 Official code FIRST_50 applied! 50% discount activated on all plans!`, type: 'success' })
    } else {
      setCouponFeedback({ text: `Code "${raw}" is invalid. Please enter official code: FIRST_50`, type: 'error' })
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponInputText('')
    setCouponFeedback(null)
    try {
      localStorage.removeItem('helvia_creator_coupon')
    } catch {}
  }

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

  const [selectedAppFilter, setSelectedAppFilter] = useState<'all' | 'remote' | 'copilot' | 'autoapply'>('all')


  // Interactive sections state
  const [activeBenchmarkTab, setActiveBenchmarkTab] = useState<'stealth' | 'resumeMatch' | 'latency' | 'cpu'>('stealth')
  const [activeScenario, setActiveScenario] = useState<number>(0)
  const [openFaq, setOpenFaq] = useState<Record<number, boolean>>({ 0: true })

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.01, rootMargin: '0px 0px 300px 0px' }
    )
    observerRef.current = observer

    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
    revealElements.forEach((el) => {
      if (!el.classList.contains('visible')) {
        observer.observe(el)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  const toggleFaq = (index: number) => {
    setOpenFaq(prev => ({ ...prev, [index]: !prev[index] }))
  }

  return (
    <>
      {/* 3D Dynamic Sky Canvas (Self-updating RAF loop without re-rendering page) */}
      <SkyCanvas3D />

      {/* Dynamic Influencer/Creator 50% OFF Announcement Banner */}
      {appliedCoupon && (
        <div className="creator-coupon-banner">
          <div className="creator-coupon-banner-inner">
            <span className="creator-sparkle">🎉</span>
            <span className="creator-banner-text">
              Creator Code <strong>"{appliedCoupon.code}"</strong> Active: <strong>50% OFF</strong> all plans unlocked!
            </span>
            <a href="#pricing" className="creator-banner-jump-btn">View 50% Off Pricing ↓</a>
            <button 
              className="creator-banner-close-btn" 
              onClick={handleRemoveCoupon}
              title="Remove coupon"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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
            Land your dream remote job in 30 days: Automated Applications + Stealth Live Interview Copilot + 60 FPS Remote Workstation in one unified suite.
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
                    href={HELVIA_DOWNLOAD_LINKS.remote}
                    className="launchpad-btn blue"
                    title="Download Helvia Remote Host (.exe v0.2.5)"
                  >
                    <span>Download Host v0.2.5</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  </a>
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
                  <a 
                    href={HELVIA_DOWNLOAD_LINKS.meet}
                    className="launchpad-btn purple"
                    title="Download Helvia Meet (.exe)"
                  >
                    <span>Download Meet (.exe)</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
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
                  <a 
                    href={HELVIA_DOWNLOAD_LINKS.apply}
                    className="launchpad-btn gold"
                    title="Download Helvia Apply (.exe)"
                  >
                    <span>Download Apply (.exe)</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
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
                  href={HELVIA_DOWNLOAD_LINKS.remote}
                  className="eco-primary-btn blue"
                  title="Download Helvia Remote Host (.exe v0.2.5)"
                >
                  <span>Download Remote Host v0.2.5 (.exe)</span>
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
              <div className="eco-card-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <a 
                  href={HELVIA_DOWNLOAD_LINKS.meet}
                  className="eco-primary-btn purple"
                  title="Download Helvia Meet (.exe)"
                  style={{ textDecoration: 'none' }}
                >
                  <span>Download Helvia Meet (.exe)</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </a>
                <button 
                  type="button" 
                  className="eco-secondary-btn"
                  onClick={() => {
                    if (isSignedIn) navigate('/dashboard')
                    else signInWithGoogle()
                  }}
                >
                  <span>Launch Web Copilot Dashboard</span>
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
              <div className="eco-card-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <a 
                  href={HELVIA_DOWNLOAD_LINKS.apply}
                  className="eco-primary-btn gold"
                  title="Download Helvia Apply (.exe)"
                  style={{ textDecoration: 'none' }}
                >
                  <span>Download Helvia Apply (.exe)</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </a>
                <button 
                  type="button" 
                  className="eco-secondary-btn"
                  onClick={() => {
                    if (isSignedIn) navigate('/dashboard')
                    else signInWithGoogle()
                  }}
                >
                  <span>Launch Talent Mobility Dashboard</span>
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

      {/* NEW: Official Video Tutorials & Interactive App Demos */}
      <VideoTutorialsSection />

      {/* Benchmark Comparison & Performance Matrix: Simple & Understandable */}
      <section className="benchmark-section reveal" id="benchmarks">
        <div className="section-header-center">
          <p className="eyebrow">HEAD-TO-HEAD COMPARISON</p>
          <h2>How Helvia Compares to Traditional Tools</h2>
          <p className="muted">See why job seekers and remote professionals choose Helvia over old-school, complicated software.</p>
          
          <div className="benchmark-tabs-nav">
            <button 
              className={`benchmark-tab-btn ${activeBenchmarkTab === 'stealth' ? 'active' : ''}`}
              onClick={() => setActiveBenchmarkTab('stealth')}
            >
              🛡️ Screen Privacy &amp; Invisibility
            </button>
            <button 
              className={`benchmark-tab-btn ${activeBenchmarkTab === 'resumeMatch' ? 'active' : ''}`}
              onClick={() => setActiveBenchmarkTab('resumeMatch')}
            >
              📄 Job Application Success
            </button>
            <button 
              className={`benchmark-tab-btn ${activeBenchmarkTab === 'latency' ? 'active' : ''}`}
              onClick={() => setActiveBenchmarkTab('latency')}
            >
              ⏱️ Remote Connection Speed
            </button>
            <button 
              className={`benchmark-tab-btn ${activeBenchmarkTab === 'cpu' ? 'active' : ''}`}
              onClick={() => setActiveBenchmarkTab('cpu')}
            >
              ⚡ Computer Speed &amp; Battery
            </button>
          </div>
        </div>

        <div className="benchmark-chart-card reveal-scale">
          <div className="benchmark-card-header">
            <h4>
              {activeBenchmarkTab === 'stealth' && 'Screen Privacy (Is the app hidden while sharing your screen?)'}
              {activeBenchmarkTab === 'resumeMatch' && 'Job Application Quality (Does your resume pass automated company filters?)'}
              {activeBenchmarkTab === 'latency' && 'Remote Desktop Speed (How fast and responsive do clicks and typing feel?)'}
              {activeBenchmarkTab === 'cpu' && 'Computer Performance (How light is it on your computer and battery?)'}
            </h4>
            <span className="benchmark-source-tag">Real-World Everyday Testing</span>
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
              <strong>Why Helvia is Different: </strong>
              {activeBenchmarkTab === 'stealth' && 'Helvia is designed to stay 100% invisible during screen shares on Zoom, Teams, and Google Meet with zero awkward bots joining your call.'}
              {activeBenchmarkTab === 'resumeMatch' && 'Helvia does not just spam the same unchanged resume—it automatically tailors your skills to match each job description, getting you real interviews.'}
              {activeBenchmarkTab === 'latency' && 'Helvia connects directly from your phone browser to your PC with virtually zero delay, so you can work smoothly without installing bulky software.'}
              {activeBenchmarkTab === 'cpu' && 'Helvia runs quietly in the background without hogging your computer memory, slowing down other apps, or draining your laptop battery.'}
            </p>
          </div>
        </div>
      </section>

      {/* Understandable Benefits Section: Everything You Need, Explained Simply */}
      <section className="simple-benefits-section reveal" id="why-helvia">
        <div className="section-header-center">
          <div className="eyebrow-pill-badge" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
            <span className="badge-glow-dot" />
            <span>BUILT FOR REAL-WORLD PRODUCTIVITY</span>
          </div>
          <h2>Everything You Need, Explained Simply</h2>
          <p className="muted">
            No complicated technical jargon or hidden setups. Here is exactly how Helvia helps you work faster, interview with confidence, and automate your career.
          </p>
        </div>

        <div className="benefits-cards-grid">
          {/* Card 1: Helvia Remote */}
          <div className="benefit-card reveal stagger-1">
            <div className="benefit-card-top">
              <div className="benefit-icon-box blue">
                <MonitorIcon />
              </div>
              <span className="benefit-pill blue">1. Remote Desktop</span>
            </div>
            <h3>Work From Anywhere, On Any Device</h3>
            <p className="benefit-lead">
              Access your Windows desktop from your mobile phone, tablet, or secondary laptop in seconds—with zero complicated network setup.
            </p>
            <ul className="benefit-points">
              <li>
                <div className="benefit-check blue"><CheckIcon /></div>
                <div>
                  <strong>Instant Mobile Control:</strong> Turn your phone screen into a smooth trackpad with full keyboard, tap-to-click, and gesture support.
                </div>
              </li>
              <li>
                <div className="benefit-check blue"><CheckIcon /></div>
                <div>
                  <strong>Sub-15ms 60 FPS Streaming:</strong> Silky smooth video that feels exactly like sitting right in front of your workstation.
                </div>
              </li>
              <li>
                <div className="benefit-check blue"><CheckIcon /></div>
                <div>
                  <strong>Scan QR to Connect:</strong> Open your mobile camera, scan your PC screen's QR code, and you are immediately connected. No port forwarding.
                </div>
              </li>
            </ul>
            <div className="benefit-card-footer">
              <span className="benefit-footer-tag">✓ Windows 10/11 &bull; iOS &bull; Android &bull; Any Browser</span>
            </div>
          </div>

          {/* Card 2: Helvia Meet */}
          <div className="benefit-card reveal stagger-2">
            <div className="benefit-card-top">
              <div className="benefit-icon-box purple">
                <GhostIcon />
              </div>
              <span className="benefit-pill purple">2. Executive Copilot</span>
            </div>
            <h3>Ace Every Video Interview with Confidence</h3>
            <p className="benefit-lead">
              Never freeze on a tough interview question again. Helvia discreetly listens to live meeting audio and shows you structured answers on your screen.
            </p>
            <ul className="benefit-points">
              <li>
                <div className="benefit-check purple"><CheckIcon /></div>
                <div>
                  <strong>100% Invisible Screenshare HUD:</strong> Hardware-level privacy ensures your assistant is completely hidden if you share your screen.
                </div>
              </li>
              <li>
                <div className="benefit-check purple"><CheckIcon /></div>
                <div>
                  <strong>Structured STAR Talking Points:</strong> Delivers instant Situation, Task, Action, and Result points tailored to your real background.
                </div>
              </li>
              <li>
                <div className="benefit-check purple"><CheckIcon /></div>
                <div>
                  <strong>Works on Zoom, Teams &amp; Meet:</strong> No meeting bots join the call and no recording notices appear. 100% private to you.
                </div>
              </li>
            </ul>
            <div className="benefit-card-footer">
              <span className="benefit-footer-tag">✓ Undetectable &bull; Real-time AI Whisper &bull; Zero Bots</span>
            </div>
          </div>

          {/* Card 3: Helvia Apply */}
          <div className="benefit-card reveal stagger-3">
            <div className="benefit-card-top">
              <div className="benefit-icon-box amber">
                <FileTextIcon />
              </div>
              <span className="benefit-pill amber">3. Talent Mobility</span>
            </div>
            <h3>Put Your Job Applications on Autopilot</h3>
            <p className="benefit-lead">
              Stop spending hours rewriting resumes and filling out repetitive job forms. Helvia tailors your resume for every job and submits applications automatically.
            </p>
            <ul className="benefit-points">
              <li>
                <div className="benefit-check amber"><CheckIcon /></div>
                <div>
                  <strong>99% ATS Resume Pass Rate:</strong> Automatically aligns your skill keywords with what recruiters search for on Greenhouse &amp; Lever.
                </div>
              </li>
              <li>
                <div className="benefit-check amber"><CheckIcon /></div>
                <div>
                  <strong>Autonomous Job Queue:</strong> Dispatches tailored applications to matching open roles daily so you never miss an opportunity.
                </div>
              </li>
              <li>
                <div className="benefit-check amber"><CheckIcon /></div>
                <div>
                  <strong>AI Mock Interview Drills:</strong> Practice with instant AI feedback before your actual interview calls to maximize offers.
                </div>
              </li>
            </ul>
            <div className="benefit-card-footer">
              <span className="benefit-footer-tag">✓ Greenhouse &bull; Lever &bull; Workday &bull; LinkedIn</span>
            </div>
          </div>
        </div>

        {/* Quick Reassurance Banner */}
        <div className="benefits-guarantee-strip">
          <div className="guarantee-icon-wrap">
            <ShieldIcon />
          </div>
          <div className="guarantee-text">
            <strong>One Account. All Three Apps Unlocked. Zero Telemetry.</strong>
            <span>One single Google login gives you unified access to Remote Control, Interview Copilot, and Auto-Apply with zero third-party tracking.</span>
          </div>
          <a href="#how-to-use" className="guarantee-action-btn">
            <span>Watch How It Works</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
        </div>
      </section>

      {/* APP 2 DEEP DIVE: HELVIA MEETING COPILOT & INVISIBLE WHISPER HUD */}
      <section className="meeting-copilot-section feature-deep-section reveal" id="meeting-copilot-details" style={{ padding: '80px 0 60px' }}>
        <div className="container" style={{ maxWidth: 1240, margin: '0 auto', padding: '0 20px' }}>
          <div className="section-header-center" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="badge-tag" style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff', display: 'inline-flex', marginBottom: '1rem', fontWeight: 800 }}>
              <GhostIcon />
              <span>APP 02 • LIVE INTERVIEW &amp; MEETING ASSISTANT</span>
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 3.4vw, 2.6rem)', fontWeight: 850, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '0.85rem', textShadow: '0 4px 20px rgba(0, 0, 0, 0.35)' }}>
              Never Freeze in an Interview Again
            </h2>
            <p className="muted" style={{ maxWidth: 840, margin: '0 auto', fontSize: '1.02rem', color: 'rgba(255, 255, 255, 0.88)', lineHeight: 1.6, textShadow: '0 2px 8px rgba(0, 0, 0, 0.25)' }}>
              Helvia listens to questions as your interviewer speaks and quietly displays the best talking points on your screen—completely hidden from everyone else.
            </p>
          </div>

          {/* 4 Core Features in Split-Screen Style */}
          <div className="feature-deep-container" style={{ marginTop: '1.5rem' }}>
            <div className="feature-deep-text reveal-left">
              <div className="feature-points-list">
                <div className="feature-point-item stagger-1">
                  <div className="point-icon purple"><EyeOffIcon /></div>
                  <div>
                    <h3>100% Invisible to Everyone Else</h3>
                    <p>Even if you share your entire screen during an interview on Zoom, Teams, or Google Meet, Helvia stays completely invisible. Only you can see it.</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-2">
                  <div className="point-icon purple"><MicIcon /></div>
                  <div>
                    <h3>Instant Smart Answers in Real Time</h3>
                    <p>As soon as the interviewer finishes asking a question, smart talking points appear on your screen in less than a second so you never stumble.</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-3">
                  <div className="point-icon purple"><SparklesIcon /></div>
                  <div>
                    <h3>No Embarrassing Meeting Bots</h3>
                    <p>Other AI tools send an obvious "AI bot" into your meeting that recruiters immediately notice. Helvia works silently on your computer with zero bots.</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-4">
                  <div className="point-icon purple"><ShieldIcon /></div>
                  <div>
                    <h3>Structured &amp; Natural Talking Points</h3>
                    <p>Gives you clear bullet points (Problem, Action, Result) so you can speak naturally with confidence rather than sounding like you are reading a script.</p>
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
                  <span className="top-title">Helvia Meet • Live Call Screen View</span>
                </div>

                <div className="card-body-visual">
                  <div className="live-meeting-sim-box">
                    <div className="meeting-sim-topbar">
                      <div className="meeting-sim-status">
                        <span className="sim-rec-pulse"></span>
                        <span className="meeting-sim-title">Zoom / Teams Call (Screen Sharing Active)</span>
                      </div>
                      <span className="meeting-sim-badge">🛡️ HUD 100% INVISIBLE TO OTHERS</span>
                    </div>

                    <div className="meeting-sim-conversation">
                      {/* Interviewer Audio */}
                      <div className="interviewer-bubble">
                        <div className="speaker-label">
                          <span className="speaker-avatar">👤</span>
                          <strong>Interviewer (Spoken Audio):</strong>
                        </div>
                        <p className="speaker-quote">
                          "Can you walk me through a situation where a project fell behind schedule, and how you handled the team communication?"
                        </p>
                      </div>

                      {/* Helvia Secret Whisper HUD */}
                      <div className="helvia-whisper-card">
                        <div className="whisper-header">
                          <span className="whisper-badge">⚡ HELVIA SECRET WHISPER</span>
                          <span className="whisper-time">Analyzed &amp; generated in 0.8s</span>
                        </div>
                        <div className="whisper-body">
                          <div className="star-point">
                            <span className="star-letter s">S</span>
                            <div><strong>Situation:</strong> Q3 data pipeline migration delayed by 10 days due to third-party API outage.</div>
                          </div>
                          <div className="star-point">
                            <span className="star-letter a">A</span>
                            <div><strong>Action:</strong> Reassigned non-critical tasks, set up transparent daily 15-min sync, and unblocked core developers.</div>
                          </div>
                          <div className="star-point">
                            <span className="star-letter r">R</span>
                            <div><strong>Result:</strong> Shipped 3 days ahead of revised schedule with 99.98% pipeline uptime; praised by VP.</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="meeting-sim-footer">
                      <div className="sim-footer-note">
                        <span className="sim-check-icon">✓</span>
                        <span><strong>Recruiter sees only your shared slides.</strong> Helvia is excluded from screen capture hardware-wide.</span>
                      </div>
                      <a href="#how-to-use" className="sim-tutorial-link">
                        <span>Watch Video Tutorial in Guides ↓</span>
                      </a>
                    </div>
                  </div>

                  <div className="status-pill-grid">
                    <span className="status-item-pill">✓ 100% Invisible Screenshare HUD</span>
                    <span className="status-item-pill">✓ Sub-18ms Direct Audio</span>
                    <span className="status-item-pill">✓ Zero Meeting Bots</span>
                    <span className="status-item-pill">✓ Real-Time STAR Answers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <a 
              href={HELVIA_DOWNLOAD_LINKS.meet}
              className="eco-primary-btn purple"
              style={{ width: 'auto', minWidth: 260, padding: '0.9rem 2.25rem', fontSize: '1rem', textDecoration: 'none' }}
              title="Download Helvia Meet Desktop (.exe)"
            >
              <GhostIcon />
              <span>Download Helvia Meet (.exe)</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </a>
            <button 
              type="button" 
              className="eco-secondary-btn"
              style={{ width: 'auto', minWidth: 220, padding: '0.9rem 1.75rem', fontSize: '1rem' }}
              onClick={() => {
                if (isSignedIn) navigate('/dashboard')
                else signInWithGoogle()
              }}
            >
              <span>Open Meeting Dashboard</span>
            </button>
          </div>
        </div>
      </section>

      {/* PRACTICAL 3: HELVIA AUTO APPLY & AI MOCK INTERVIEW COACH SIMULATOR */}
      {/* APP 3 DEEP DIVE: HELVIA AUTO APPLY & AI MOCK INTERVIEW COACH */}
      <section className="autoapply-section feature-deep-section reveal" id="auto-apply-details" style={{ padding: '80px 0 60px' }}>
        <div className="container" style={{ maxWidth: 1240, margin: '0 auto', padding: '0 20px' }}>
          <div className="section-header-center" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="badge-tag" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', display: 'inline-flex', marginBottom: '1rem', fontWeight: 800 }}>
              <FileTextIcon />
              <span>APP 03 • AUTOPILOT JOB APPLICATIONS</span>
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 3.4vw, 2.6rem)', fontWeight: 850, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '0.85rem', textShadow: '0 4px 20px rgba(0, 0, 0, 0.35)' }}>
              Apply to Hundreds of Matching Jobs on Autopilot
            </h2>
            <p className="muted" style={{ maxWidth: 840, margin: '0 auto', fontSize: '1.02rem', color: 'rgba(255, 255, 255, 0.88)', lineHeight: 1.6, textShadow: '0 2px 8px rgba(0, 0, 0, 0.25)' }}>
              Helvia automatically matches your experience to active job openings, customizes your resume with the right keywords to pass company filters, and submits applications while you focus on interview prep.
            </p>
          </div>

          {/* 4 Core Features in Split-Screen Style */}
          <div className="feature-deep-container" style={{ marginTop: '1.5rem' }}>
            <div className="feature-deep-text reveal-left">
              <div className="feature-points-list">
                <div className="feature-point-item stagger-1">
                  <div className="point-icon gold"><FileTextIcon /></div>
                  <div>
                    <h3>98% ATS Keyword Optimization</h3>
                    <p>Matches your resume bullet points with the exact skills and keywords recruiters and automated company filters search for.</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-2">
                  <div className="point-icon gold"><ZapIcon /></div>
                  <div>
                    <h3>Autopilot Application Submissions</h3>
                    <p>Submits tailored applications across LinkedIn, Greenhouse, and Lever daily at human-like pace with zero manual form-filling.</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-3">
                  <div className="point-icon gold"><AwardIcon /></div>
                  <div>
                    <h3>Interactive AI Mock Interview Practice</h3>
                    <p>Practice answering realistic job questions out loud with instant scores, STAR feedback, and practical improvement tips.</p>
                  </div>
                </div>

                <div className="feature-point-item stagger-4">
                  <div className="point-icon gold"><CheckIcon /></div>
                  <div>
                    <h3>Live Application Status Tracker</h3>
                    <p>Track every submitted job, company responses, and interview invitations in real time from one simple, organized dashboard.</p>
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
                  <span className="top-title">Helvia Apply • Live Application Dispatch</span>
                </div>

                <div className="card-body-visual">
                  <div className="live-apply-sim-box">
                    <div className="apply-sim-topbar">
                      <div className="apply-sim-target">
                        <span className="sim-dot-gold"></span>
                        <span>Target: <strong>Full-Stack Engineer (Remote)</strong></span>
                      </div>
                      <span className="apply-ats-badge">🎯 98% ATS MATCH SCORE</span>
                    </div>

                    <div className="apply-activity-list">
                      <div className="apply-item applied">
                        <div className="apply-item-top">
                          <span className="company-name">Stripe</span>
                          <span className="job-role">Senior Full-Stack Engineer</span>
                          <span className="apply-status-pill green">✓ Applied</span>
                        </div>
                        <div className="apply-item-sub">Matched: React, Node.js, Distributed Systems • Tailored resume sent</div>
                      </div>

                      <div className="apply-item applied">
                        <div className="apply-item-top">
                          <span className="company-name">Cloudflare</span>
                          <span className="job-role">Systems Engineer</span>
                          <span className="apply-status-pill green">✓ Applied</span>
                        </div>
                        <div className="apply-item-sub">Matched: Systems Architecture, Edge APIs • Greenhouse portal</div>
                      </div>

                      <div className="apply-item callback">
                        <div className="apply-item-top">
                          <span className="company-name">Datadog</span>
                          <span className="job-role">Staff Platform Engineer</span>
                          <span className="apply-status-pill purple">🎉 Interview Invite</span>
                        </div>
                        <div className="apply-item-sub">Screening call scheduled • AI Interview Practicer ready</div>
                      </div>
                    </div>

                    <div className="apply-sim-footer">
                      <div className="sim-footer-note">
                        <span className="sim-check-icon">✓</span>
                        <span><strong>42 applications sent this week.</strong> Zero repetitive form-filling or keyword guessing.</span>
                      </div>
                      <a href="#how-to-use" className="sim-tutorial-link gold">
                        <span>Watch Video Tutorial in Guides ↓</span>
                      </a>
                    </div>
                  </div>

                  <div className="status-pill-grid">
                    <span className="status-item-pill">✓ 98%+ ATS Keyword Match</span>
                    <span className="status-item-pill">✓ Automated Job Submissions</span>
                    <span className="status-item-pill">✓ Live Application Tracker</span>
                    <span className="status-item-pill">✓ Interactive Mock Interview Drills</span>
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

      {/* 5 Real-World Everyday Workflow Scenarios */}
      <section className="scenarios-section reveal" id="scenarios">
        <div className="section-header-center">
          <p className="eyebrow">REAL-WORLD EXAMPLES</p>
          <h2>See How Real People Use Helvia Every Day</h2>
          <p className="muted">Whether controlling your PC on the go, acing tough job interviews, or automating your applications—see how easy it is.</p>
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
                  <strong>How Helvia Helps:</strong>
                  <p>{WORKFLOW_SCENARIOS[activeScenario].solution}</p>
                </div>

                <div className="scenario-flow-showcase">
                  <div className="scenario-flow-header">
                    <span className="scenario-flow-title">⚡ How It Works in 3 Simple Steps</span>
                    <span className="scenario-flow-badge">{WORKFLOW_SCENARIOS[activeScenario].badge}</span>
                  </div>
                  <div className="scenario-flow-steps">
                    {WORKFLOW_SCENARIOS[activeScenario].flowSteps.map((st, sIdx) => (
                      <div className="scenario-step-card" key={sIdx}>
                        <div className="scenario-step-top">
                          <span className="step-icon-bubble">{st.icon}</span>
                          <span className="step-index-tag">{st.step}</span>
                        </div>
                        <h4 className="step-card-title">{st.title}</h4>
                        <p className="step-card-desc">{st.detail}</p>
                      </div>
                    ))}
                  </div>
                  <div className="scenario-flow-footer">
                    <span className="flow-footer-icon">💡</span>
                    <span className="flow-footer-text">
                      <strong>Everyday takeaway: </strong>
                      {WORKFLOW_SCENARIOS[activeScenario].caption}
                    </span>
                  </div>
                </div>
              </div>

              <div className="scenario-metrics-col">
                <span className="metrics-col-title">The Results</span>
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
                <th style={{ width: '32%' }}>Core Feature &amp; Capability</th>
                <th className="highlight-col" style={{ width: '36%' }}>Helvia 3-in-1 Unified Suite ($8 – $15)</th>
                <th style={{ width: '32%' }}>Legacy Disconnected Tools ($75 – $140/mo)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Zero-Install 60 FPS Remote Desktop</strong></td>
                <td className="highlight-col"><CheckIcon /> Built-in browser WebRTC (Sub-15ms, zero install)</td>
                <td>❌ Requires heavy 300MB app install &amp; slow relays</td>
              </tr>
              <tr>
                <td><strong>100% Invisible on Screenshares (Zoom/Teams/Meet)</strong></td>
                <td className="highlight-col"><CheckIcon /> Yes (Native OS WDA_EXCLUDEFROMCAPTURE)</td>
                <td>❌ Visible app window or external bot joins &amp; alerts call</td>
              </tr>
              <tr>
                <td><strong>Real-Time "What to Speak" Whisper HUD</strong></td>
                <td className="highlight-col"><CheckIcon /> Sub-18ms talking points &amp; STAR framework</td>
                <td>⚠️ Post-call transcripts only (useless during the live call)</td>
              </tr>
              <tr>
                <td><strong>AI Screen Analysis ("Ans 💡" Engine)</strong></td>
                <td className="highlight-col"><CheckIcon /> Built-in 3-way instant screen question solver</td>
                <td>❌ None (manual copy-pasting or screenshots to ChatGPT)</td>
              </tr>
              <tr>
                <td><strong>Dynamic ATS Resume Tailoring per JD</strong></td>
                <td className="highlight-col"><CheckIcon /> Dynamic keyword realignment (98% ATS pass rate)</td>
                <td>⚠️ Blasts generic static PDFs that get auto-rejected</td>
              </tr>
              <tr>
                <td><strong>Interactive AI Mock Interview Coach</strong></td>
                <td className="highlight-col"><CheckIcon /> Built-in with instant rubrics &amp; scoring</td>
                <td>❌ Expensive 1-on-1 human coaching ($150+/hr)</td>
              </tr>
              <tr>
                <td><strong>Combined Monthly Investment</strong></td>
                <td className="highlight-col">💎 $8 – $15 / pack (All 3 Platforms Included)</td>
                <td>💸 $75 – $140 / mo across 3 separate subscriptions</td>
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

      {/* Pricing Section */}
      <section className="pricing-section reveal" id="pricing">
        <div className="pricing-panel reveal">
          <div className="pricing-section-header">
            <div className="pricing-eyebrow-pill">
              <span>💎</span> UNIFIED SUBSCRIPTION
            </div>
            <h2>Simple, Transparent Pricing</h2>
            <p className="pricing-subtitle">One unified subscription powers all 3 breakthrough apps: Helvia Remote, Meeting Copilot, and Auto Apply &amp; Coach.</p>

            {/* Interactive Creator / Influencer Code Box */}
            <div className="pricing-coupon-box">
              <div className="pricing-coupon-input-wrap">
                <span className="pricing-coupon-tag-icon">🏷️</span>
                <input 
                  type="text" 
                  className="pricing-coupon-input"
                  placeholder="Enter influencer coupon code (e.g. FIRST_50)"
                  value={couponInputText}
                  onChange={(e) => setCouponInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon() }}
                />
                {appliedCoupon ? (
                  <button className="pricing-coupon-apply-btn applied" onClick={handleRemoveCoupon} type="button">
                    ✓ FIRST_50 Active (50% OFF) • Remove
                  </button>
                ) : (
                  <button className="pricing-coupon-apply-btn" onClick={handleApplyCoupon} type="button">
                    Apply FIRST_50
                  </button>
                )}
              </div>
              {couponFeedback && (
                <div className={`pricing-coupon-message ${couponFeedback.type}`}>
                  {couponFeedback.text}
                </div>
              )}
            </div>
          </div>
          
          {(() => {
            const allAvailablePlans = (plans && plans.length > 0 ? plans : SEED_PLANS)

            // The 3 Core Plans: Basic Free Tier ($0), Standard Plan ($8), Pro+ Pro ($15)
            const corePlans = allAvailablePlans
              .filter((p) => {
                const n = String(p.name || '').toLowerCase()
                const isUnlimited = n.includes('unlimited') || p.id === 'b1e06fa2-5819-48ce-8d07-28d8cf9c4901'
                return !isUnlimited && (
                  p.tier === 'basic' ||
                  n.includes('basic') ||
                  n.includes('standard') ||
                  n.includes('pro+') ||
                  p.id === 'ee803f63-7ffc-4c93-bd79-2cb349c318b1' ||
                  p.id === '4d569314-3b27-45c8-93ad-3d5c2eebffc0' ||
                  p.id === 'fdbc4259-cdb8-42b8-a0d5-02b8a7392812'
                )
              })
              .sort((a, b) => Number(a.price) - Number(b.price))

            // The 1 Month Unlimited VIP Plan
            const unlimitedPlan = allAvailablePlans.find((p) => {
              const n = String(p.name || '').toLowerCase()
              return n.includes('unlimited') || p.id === 'b1e06fa2-5819-48ce-8d07-28d8cf9c4901'
            })

            return (
              <>
                <div className="plans-grid">
                  {corePlans.map((p, idx) => {
                    const isPopular = p.name.toLowerCase().includes('most popular') || p.name.toLowerCase().includes('pro+ pro')
                    const isLifetime = p.tier === 'pro plus+'
                    const isFree = Number(p.price) === 0
                    const isCurrentActive = userPlan && (
                      userPlan === p.tier || 
                      (isFree && (userPlan === 'basic' || !userPlan)) ||
                      (userPlan.toLowerCase() === p.name.toLowerCase())
                    )

                    const baseInr = getPlanInrPrice(p.price)
                    const inrDiscount = appliedCoupon && !isFree ? calculateDiscount(baseInr, appliedCoupon) : null
                    const effectiveInr = inrDiscount ? inrDiscount.discountedInr : baseInr

                    const usdDiscount = appliedCoupon && !isFree ? calculateUsdDiscount(p.price, appliedCoupon) : null
                    const effectiveUsd = usdDiscount ? usdDiscount.discountedUsd : p.price

                    return (
                      <div 
                        className={`plan-card stagger-${(idx % 4) + 1} ${isPopular ? 'popular' : ''} ${isLifetime ? 'lifetime' : ''} ${appliedCoupon && !isFree ? 'has-coupon' : ''}`} 
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
                            ) : appliedCoupon ? (
                              <>
                                <span className="price-currency">$</span>
                                <span className="price-orig-strikethrough">${p.price}</span>
                                <span className="price-val discounted">{effectiveUsd}</span>
                                <span className="price-inr-chip discounted">
                                  <span className="inr-orig">₹{baseInr}</span> ₹{effectiveInr}
                                </span>
                                <span className="price-period">{isLifetime ? '/ life' : '/ pack'}</span>
                              </>
                            ) : (
                              <>
                                <span className="price-currency">$</span>
                                <span className="price-val">{p.price}</span>
                                <span className="price-inr-chip">₹{baseInr}</span>
                                <span className="price-period">{isLifetime ? '/ life' : '/ pack'}</span>
                              </>
                            )}
                          </div>
                          {appliedCoupon && !isFree && (
                            <div className="coupon-active-subbadge">
                              <span>🔥 50% Creator Code Active</span>
                            </div>
                          )}
                        </div>

                        <p className="plan-meta">
                          {isFree 
                            ? 'Free starter trial: 5 mins remote, 5 copilot answers, and 3 job auto-applies included.' 
                            : isLifetime
                              ? 'Unlimited lifetime remote access with Bring Your Own Keys.'
                              : `${p.included_minutes} mins remote, ${p.included_responses} copilot answers, ${p.included_applications} job auto-applies.`}
                        </p>

                        <ul className="plan-feature-list">
                          <li><CheckIcon /> <span><strong>{isFree ? 3 : p.included_applications}</strong> Job Auto-Applies (LinkedIn & ATS)</span></li>
                          <li><CheckIcon /> <span>{isLifetime ? 'Unlimited Remote' : isFree ? '5 Remote Mins' : `${p.included_minutes} Remote Mins`}</span></li>
                          <li><CheckIcon /> <span>{isFree ? '5 Copilot Answers' : `${p.included_responses} Copilot Answers`}</span></li>
                          <li><CheckIcon /> <span>Anti-Detect Hardware (WDA)</span></li>
                          <li><CheckIcon /> <span>{isFree ? 'Free Trial Unified Access' : 'AI Interview Coach'}</span></li>
                        </ul>

                        <div className="plan-cta">
                          {isFree ? (
                            <button 
                              className="plan-cta-main secondary" 
                              type="button" 
                              onClick={() => {
                                if (isSignedIn) navigate('/dashboard')
                                else signInWithGoogle()
                              }}
                            >
                              {isSignedIn ? 'Active Default Tier' : 'Get Started Free'}
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
                              Select (${effectiveUsd} / ₹{effectiveInr})
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Dedicated Separate 1-Month Unlimited VIP Pass Card */}
                {unlimitedPlan && (() => {
                  const unlBaseInr = getPlanInrPrice(unlimitedPlan.price)
                  const unlInrDiscount = appliedCoupon ? calculateDiscount(unlBaseInr, appliedCoupon) : null
                  const unlEffectiveInr = unlInrDiscount ? unlInrDiscount.discountedInr : unlBaseInr

                  const unlUsdDiscount = appliedCoupon ? calculateUsdDiscount(unlimitedPlan.price, appliedCoupon) : null
                  const unlEffectiveUsd = unlUsdDiscount ? unlUsdDiscount.discountedUsd : unlimitedPlan.price

                  const isCurrentUnlimited = userPlan && (
                    userPlan.toLowerCase() === 'usage' || 
                    userPlan.toLowerCase() === unlimitedPlan.tier.toLowerCase() ||
                    userPlan.toLowerCase() === unlimitedPlan.name.toLowerCase()
                  )

                  return (
                    <div className="landing-unlimited-spotlight-wrap" style={{ marginTop: '2.5rem' }}>
                      <div className="unlimited-spotlight-card">
                        <div className="unlimited-spotlight-glow" />

                        <div className="unlimited-spotlight-header">
                          <div className="unlimited-badge-cluster">
                            <span className="unlimited-crown-badge">
                              👑 1-Month Unlimited VIP Pass
                            </span>
                            <span className="unlimited-duration-tag">30 Days Full Access</span>
                          </div>
                          <div className="unlimited-offer-pill">
                            <span>{appliedCoupon ? '🔥 50% CREATOR DISCOUNT ACTIVATED' : '⚡ Zero Minute Limits • Everything Uncapped'}</span>
                          </div>
                        </div>

                        <div className="unlimited-spotlight-body">
                          <div className="unlimited-spotlight-main">
                            <h3 className="unlimited-spotlight-title">{unlimitedPlan.name}</h3>
                            <p className="unlimited-spotlight-subtitle">
                              Complete unrestricted access for 30 full days. Run long meetings, continuous AI screen analysis, and bulk auto-apply to hundreds of jobs with zero per-minute deductions.
                            </p>

                            <div className="unlimited-pricing-block">
                              <div className="unlimited-price-tag">
                                <span className="unlimited-currency">$</span>
                                {appliedCoupon ? (
                                  <>
                                    <span className="unlimited-orig-strikethrough">${unlimitedPlan.price}</span>
                                    <span className="unlimited-amount discounted">{unlEffectiveUsd}</span>
                                  </>
                                ) : (
                                  <span className="unlimited-amount">{unlimitedPlan.price}</span>
                                )}
                                <span className="unlimited-period">USD / 30 Days</span>
                              </div>
                              <div className="unlimited-inr-row">
                                {appliedCoupon ? (
                                  <span className="unlimited-inr-base discounted">
                                    <span className="inr-orig">₹{unlBaseInr.toLocaleString('en-IN')}</span> ≈ ₹{unlEffectiveInr.toLocaleString('en-IN')} INR
                                  </span>
                                ) : (
                                  <span className="unlimited-inr-base">≈ ₹{unlBaseInr.toLocaleString('en-IN')} INR</span>
                                )}
                                {appliedCoupon && (
                                  <span className="unlimited-coupon-deal">
                                    🔥 50% CREATOR DISCOUNT APPLIED
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="unlimited-stats-row">
                              <div className="unlimited-stat-card">
                                <div className="unlimited-stat-icon">⏱️</div>
                                <div>
                                  <div className="unlimited-stat-number">∞ Unlimited</div>
                                  <div className="unlimited-stat-label">Remote PC Minutes</div>
                                </div>
                              </div>

                              <div className="unlimited-stat-card">
                                <div className="unlimited-stat-icon">💡</div>
                                <div>
                                  <div className="unlimited-stat-number">∞ Unlimited</div>
                                  <div className="unlimited-stat-label">Copilot Screen Answers</div>
                                </div>
                              </div>

                              <div className="unlimited-stat-card">
                                <div className="unlimited-stat-icon">💼</div>
                                <div>
                                  <div className="unlimited-stat-number">∞ Unlimited</div>
                                  <div className="unlimited-stat-label">Job Auto-Applies</div>
                                </div>
                              </div>
                            </div>

                            <div className="unlimited-cta-container">
                              {isCurrentUnlimited ? (
                                <button className="unlimited-current-badge-btn" type="button" disabled>
                                  <CheckIcon /> Current Active Plan
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="unlimited-landing-select-btn"
                                  onClick={() => {
                                    setSelectedPlanForPayment(unlimitedPlan)
                                    setIsPaymentModalOpen(true)
                                  }}
                                >
                                  Select Unlimited VIP (${unlEffectiveUsd} / ₹{unlEffectiveInr.toLocaleString('en-IN')})
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="unlimited-spotlight-sidebar">
                            <h4 className="unlimited-features-heading">⚡ Everything Unlocked in VIP:</h4>
                            <ul className="unlimited-features-list">
                              <li>
                                <CheckIcon />
                                <span><strong>Zero Minute Limits:</strong> Stream desktop sessions continuously with no balance countdown.</span>
                              </li>
                              <li>
                                <CheckIcon />
                                <span><strong>Infinite AI Vision Answers:</strong> Real-time meeting transcription, answers &amp; interview coaching.</span>
                              </li>
                              <li>
                                <CheckIcon />
                                <span><strong>Bulk ATS Job Auto-Applies:</strong> Rapid automated submission across LinkedIn &amp; company portals.</span>
                              </li>
                              <li>
                                <CheckIcon />
                                <span><strong>60 FPS Ultra-Low Latency:</strong> Full hardware acceleration with ghost cursor and audio loopback.</span>
                              </li>
                              <li>
                                <CheckIcon />
                                <span><strong>Anti-Detect Kernel Guard:</strong> 100% undetected by meeting detection &amp; proctor software.</span>
                              </li>
                              <li>
                                <CheckIcon />
                                <span><strong>VIP Priority Support:</strong> Dedicated 24/7 WhatsApp executive support and fast server allocation.</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </>
            )
          })()}

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
        initialCoupon={appliedCoupon}
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
              <h4>Platforms &amp; Downloads</h4>
              <ul>
                <li><a href="#practical-remote">Helvia Remote Desktop</a></li>
                <li><a href="#meeting-copilot">Executive Meeting Copilot</a></li>
                <li><a href="#auto-apply">Talent Mobility &amp; ATS</a></li>
                <li><a href={HELVIA_DOWNLOAD_LINKS.remote}>📥 Remote Host v0.2.5 (.exe)</a></li>
                <li><a href={HELVIA_DOWNLOAD_LINKS.meet}>🎙️ Helvia Meet Setup (.exe)</a></li>
                <li><a href={HELVIA_DOWNLOAD_LINKS.apply}>📄 Helvia Apply Setup (.exe)</a></li>
              </ul>
            </div>

            <div className="footer-nav-col">
              <h4>Architecture</h4>
              <ul>
                <li><a href="#features">Zero-Trust Kernel IOCTL</a></li>
                <li><a href="#features">Display Capture Privacy (WDA)</a></li>
                <li><a href="#how-to-use">Video Walkthroughs</a></li>
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

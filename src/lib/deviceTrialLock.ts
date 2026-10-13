/**
 * Device Fingerprinting & Free Trial Abuse Guard
 * Prevents users from repeatedly creating burner Gmail accounts to abuse free quotas on the same machine.
 */

const DEVICE_ID_KEY = 'helvia_device_fingerprint_v1'
const TRIAL_CLAIMED_KEY = 'helvia_trial_claimed_v1'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name: string, value: string, days = 365): void {
  if (typeof document === 'undefined') return
  const d = new Date()
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`
}

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server_ssr'

  try {
    let id = localStorage.getItem(DEVICE_ID_KEY) || getCookie(DEVICE_ID_KEY)
    if (!id || id.length < 16) {
      // Deterministic browser hardware characteristics + random entropy
      const nav = window.navigator
      const screen = window.screen
      const raw = [
        nav.userAgent || '',
        screen.width || '',
        screen.height || '',
        screen.colorDepth || '',
        nav.language || '',
        new Date().getTimezoneOffset(),
        Math.random().toString(36).slice(2),
        Date.now(),
      ].join('###')

      // Simple fast hash
      let hash = 0
      for (let i = 0; i < raw.length; i++) {
        hash = (hash << 5) - hash + raw.charCodeAt(i)
        hash |= 0
      }
      id = `dev_${Math.abs(hash).toString(36)}_${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem(DEVICE_ID_KEY, id)
      setCookie(DEVICE_ID_KEY, id)
    }
    return id
  } catch {
    return 'fallback_device'
  }
}

export interface TrialClaimRecord {
  claimed: boolean
  claimedByEmail?: string
  claimedAt?: string
}

export function getDeviceTrialClaim(): TrialClaimRecord {
  if (typeof window === 'undefined') return { claimed: false }

  try {
    const raw = localStorage.getItem(TRIAL_CLAIMED_KEY) || getCookie(TRIAL_CLAIMED_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as TrialClaimRecord
      if (parsed && parsed.claimed) {
        return parsed
      }
    }
  } catch {
    // Ignore JSON parse errors
  }
  return { claimed: false }
}

export function recordDeviceTrialClaim(email: string): void {
  if (typeof window === 'undefined') return

  const norm = (email || '').trim().toLowerCase()
  const payload: TrialClaimRecord = {
    claimed: true,
    claimedByEmail: norm,
    claimedAt: new Date().toISOString(),
  }

  try {
    const str = JSON.stringify(payload)
    localStorage.setItem(TRIAL_CLAIMED_KEY, str)
    setCookie(TRIAL_CLAIMED_KEY, str, 365)
  } catch {
    // Ignore storage errors
  }
}

/**
 * Returns true if this device is eligible for a NEW free trial.
 * If another email already used the trial on this machine, returns false.
 */
export function isDeviceEligibleForNewTrial(email: string): boolean {
  const norm = (email || '').trim().toLowerCase()
  const claim = getDeviceTrialClaim()

  if (!claim.claimed) {
    return true
  }

  // Same user logging back in is fine
  if (claim.claimedByEmail && claim.claimedByEmail === norm) {
    return true
  }

  // A DIFFERENT user attempting to claim a second free trial on the same hardware
  return false
}

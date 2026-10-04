import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export let supabaseConfigError: string | null = null

try {
  if (supabaseUrl && supabaseAnonKey) {
    const urlRef = new URL(supabaseUrl).hostname.split('.')[0]
    const keyParts = supabaseAnonKey.split('.')
    if (keyParts.length >= 2) {
      const payload = JSON.parse(atob(keyParts[1]))
      if (payload?.ref && payload.ref !== urlRef) {
        supabaseConfigError = `API Key Mismatch: VITE_SUPABASE_URL is for project "${urlRef}", but your anon key belongs to "${payload.ref}". Please update VITE_SUPABASE_ANON_KEY in .env with the anon key from project "${urlRef}".`
        console.error(supabaseConfigError)
      }
    }
  }
} catch {
  // Ignore parsing error
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

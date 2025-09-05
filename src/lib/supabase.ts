import { createClient, SupabaseClient } from '@supabase/supabase-js'

type SupabaseRole = 'service' | 'anon'

interface SupabaseClientConfig {
  role: SupabaseRole
}

/**
 * Creates a Supabase client with proper role-based configuration
 * Logs environment and client usage for debugging
 */
export function getSupabaseClient({ role }: SupabaseClientConfig): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Environment validation
  if (!supabaseUrl) {
    console.error('[ENV_MISSING] SUPABASE_URL not found')
    throw new Error('SUPABASE_URL environment variable is required')
  }

  if (!supabaseAnonKey) {
    console.error('[ENV_MISSING] SUPABASE_ANON_KEY not found')
    throw new Error('SUPABASE_ANON_KEY environment variable is required')
  }

  if (role === 'service' && !supabaseServiceKey) {
    console.error('[ENV_MISSING] SUPABASE_SERVICE_ROLE_KEY not found')
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for service role')
  }

  // Create client with appropriate key
  const key = role === 'service' ? supabaseServiceKey! : supabaseAnonKey
  const client = createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  // Log client creation
  console.log(`[SERVICE_ROLE_USED]=${role === 'service'}`)
  console.log(`[SUPABASE_CLIENT] Created with role: ${role}, url: ${supabaseUrl}`)

  return client
}

/**
 * Get service role client for cache operations
 */
export function getServiceRoleClient(): SupabaseClient {
  return getSupabaseClient({ role: 'service' })
}

/**
 * Get anonymous client for public operations
 */
export function getAnonClient(): SupabaseClient {
  return getSupabaseClient({ role: 'anon' })
}

/**
 * Default supabase client for backward compatibility
 */
export const supabase = getAnonClient()
/**
 * Add these to your .env.local:
 * NEXT_PUBLIC_SUPABASE_URL=your-project-url
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey) 
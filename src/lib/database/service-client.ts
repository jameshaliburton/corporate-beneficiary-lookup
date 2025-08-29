/**
 * Service Role Client for Cache Writes
 * 
 * Provides a Supabase client with service role permissions for cache operations
 * that require elevated privileges to bypass RLS policies.
 */

import { createClient } from '@supabase/supabase-js';
import { printMinimalRuntimeConfig } from '../utils/runtime-config';

// Service role client for cache writes
let serviceClient: any = null;

/**
 * Get or create service role client
 * 
 * @returns Supabase client with service role permissions
 */
export function getServiceClient() {
  if (serviceClient) {
    return serviceClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('[SERVICE_CLIENT] Missing required environment variables for service role client');
    printMinimalRuntimeConfig('SERVICE_CLIENT_INIT');
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE environment variables');
  }

  serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('[SERVICE_CLIENT] Service role client initialized successfully');
  return serviceClient;
}

/**
 * Safely perform cache write operation with service role client
 * 
 * @param operation - Function that performs the database operation
 * @param context - Context for logging (e.g., 'CacheWrite', 'ProductUpsert')
 * @returns Result of the operation
 */
export async function safeCacheWrite<T>(
  operation: (client: any) => Promise<T>,
  context: string
): Promise<{ success: boolean; data?: T; error?: any; rlsDenied?: boolean }> {
  try {
    console.log(`[CACHE_WRITE] ${context} - Attempting cache write with service role client`);
    
    const client = getServiceClient();
    const result = await operation(client);
    
    console.log(`[CACHE_WRITE] ${context} - Cache write successful ✅`);
    return { success: true, data: result };
    
  } catch (error: any) {
    console.error(`[CACHE_WRITE] ${context} - Cache write failed:`, error);
    
    // Check if this is an RLS policy violation
    const isRlsDenied = error.code === '42501' || 
                       error.message?.includes('row-level security policy') ||
                       error.message?.includes('RLS');
    
    if (isRlsDenied) {
      console.log(`[RLS_DENY_EXPECTED] ${context} - RLS policy violation detected (expected in test environment)`);
      return { success: false, error, rlsDenied: true };
    }
    
    return { success: false, error, rlsDenied: false };
  }
}

/**
 * Log RLS policy violations for debugging
 * 
 * @param error - The error object
 * @param context - Context for logging
 */
export function logRlsViolation(error: any, context: string) {
  if (error.code === '42501' || error.message?.includes('row-level security policy')) {
    console.log(`[RLS_DENY_EXPECTED] ${context} - RLS policy violation:`, {
      code: error.code,
      message: error.message,
      hint: error.hint,
      details: error.details
    });
  }
}

/**
 * Check if error is RLS-related
 * 
 * @param error - The error object
 * @returns true if error is RLS-related
 */
export function isRlsError(error: any): boolean {
  return error.code === '42501' || 
         error.message?.includes('row-level security policy') ||
         error.message?.includes('RLS');
}

import { createClient } from '@supabase/supabase-js';

let supabase: any = null;

// Only initialize Supabase if environment variables are available
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
}

export async function safeCacheWrite<T>(
  operation: (client: typeof supabase) => Promise<T>,
  operationName: string = 'Unknown'
): Promise<{ success: boolean; data?: T; error?: any }> {
  try {
    console.log(`[CACHE_WRITE] Starting ${operationName}...`);
    const data = await operation(supabase);
    console.log(`[CACHE_WRITE] Success: ${operationName}`);
    return { success: true, data };
  } catch (error) {
    console.error(`[CACHE_WRITE] Error in ${operationName}:`, error);
    return { success: false, error };
  }
}

export async function safeCacheRead<T>(
  operation: (client: typeof supabase) => Promise<T>,
  operationName: string = 'Unknown'
): Promise<{ success: boolean; data?: T; error?: any }> {
  try {
    console.log(`[CACHE_READ] Starting ${operationName}...`);
    const data = await operation(supabase);
    console.log(`[CACHE_READ] Success: ${operationName}`);
    return { success: true, data };
  } catch (error) {
    console.error(`[CACHE_READ] Error in ${operationName}:`, error);
    return { success: false, error };
  }
}

export function getServiceClient() {
  return supabase;
}

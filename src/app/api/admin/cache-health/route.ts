import { NextRequest, NextResponse } from 'next/server'
import { cacheHealthCheck } from '@/lib/cache'

/**
 * Cache health probe endpoint
 * Tests cache read/write functionality and returns structured results
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[CACHE_HEALTH_API] Health check requested')
    
    const healthResult = await cacheHealthCheck()
    
    const response = {
      timestamp: new Date().toISOString(),
      status: healthResult.status,
      details: healthResult.details,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
        enforceWrites: process.env.CACHE_ENFORCE_WRITES === 'true',
      }
    }
    
    console.log('[CACHE_HEALTH_API] Health check completed:', response)
    
    return NextResponse.json(response, {
      status: healthResult.status === 'healthy' ? 200 : 500
    })
    
  } catch (error) {
    console.error('[CACHE_HEALTH_API] Health check failed:', error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: String(error),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
        enforceWrites: process.env.CACHE_ENFORCE_WRITES === 'true',
      }
    }, { status: 500 })
  }
}


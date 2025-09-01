import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/database/service-client';

/**
 * Dev-only endpoint to flush cache and test results
 * Only available in development environment
 */
export async function POST(request: NextRequest) {
  // Production safety check
  if (process.env.NODE_ENV === 'production') {
    console.log('[DEV_FLUSH] Production environment detected - blocking cache flush');
    return NextResponse.json(
      { error: 'Cache flush not available in production' },
      { status: 403 }
    );
  }

  try {
    console.log('[DEV_FLUSH] Starting cache flush operation');
    
    const serviceClient = getServiceClient();
    let body: { brands?: string[] } = {};
    
    try {
      body = await request.json();
    } catch (parseError) {
      console.log('[DEV_FLUSH] No JSON body provided - flushing all cache');
    }

    const brandsToFlush = body.brands || [];
    const flushAll = brandsToFlush.length === 0;

    console.log(`[DEV_FLUSH] Flush mode: ${flushAll ? 'ALL' : 'SELECTIVE'}`);
    if (!flushAll) {
      console.log(`[DEV_FLUSH] Brands to flush: ${brandsToFlush.join(', ')}`);
    }

    // Build delete conditions
    let deleteCondition = '';
    let deleteParams: any[] = [];
    
    if (!flushAll) {
      // Flush specific brands (case-insensitive)
      const brandConditions = brandsToFlush.map((_, index) => 
        `LOWER(brand) = LOWER($${index + 1})`
      ).join(' OR ');
      deleteCondition = `WHERE ${brandConditions}`;
      deleteParams = brandsToFlush;
    }

    // Flush products table
    console.log('[DEV_FLUSH] Flushing products table...');
    const productsDeleteQuery = `
      DELETE FROM products 
      ${deleteCondition}
    `;
    
    const productsResult = await serviceClient.rpc('exec_sql', {
      query: productsDeleteQuery,
      params: deleteParams
    });

    // Flush pipeline_results table (if exists)
    console.log('[DEV_FLUSH] Flushing pipeline_results table...');
    const pipelineResultsDeleteQuery = `
      DELETE FROM pipeline_results 
      ${deleteCondition}
    `;
    
    const pipelineResultsResult = await serviceClient.rpc('exec_sql', {
      query: pipelineResultsDeleteQuery,
      params: deleteParams
    });

    // Flush agent_results table (if exists)
    console.log('[DEV_FLUSH] Flushing agent_results table...');
    const agentResultsDeleteQuery = `
      DELETE FROM agent_results 
      ${deleteCondition}
    `;
    
    const agentResultsResult = await serviceClient.rpc('exec_sql', {
      query: agentResultsDeleteQuery,
      params: deleteParams
    });

    // Get table counts for summary
    const productsCountQuery = 'SELECT COUNT(*) as count FROM products';
    const productsCountResult = await serviceClient.rpc('exec_sql', {
      query: productsCountQuery,
      params: []
    });

    const pipelineResultsCountQuery = 'SELECT COUNT(*) as count FROM pipeline_results';
    const pipelineResultsCountResult = await serviceClient.rpc('exec_sql', {
      query: pipelineResultsCountQuery,
      params: []
    });

    const agentResultsCountQuery = 'SELECT COUNT(*) as count FROM agent_results';
    const agentResultsCountResult = await serviceClient.rpc('exec_sql', {
      query: agentResultsCountQuery,
      params: []
    });

    const summary = {
      operation: flushAll ? 'flush_all' : 'flush_selective',
      brands_flushed: brandsToFlush.length,
      brands_list: brandsToFlush,
      tables_flushed: {
        products: {
          deleted: productsResult.data?.rowCount || 0,
          remaining: productsCountResult.data?.rows?.[0]?.count || 0
        },
        pipeline_results: {
          deleted: pipelineResultsResult.data?.rowCount || 0,
          remaining: pipelineResultsCountResult.data?.rows?.[0]?.count || 0
        },
        agent_results: {
          deleted: agentResultsResult.data?.rowCount || 0,
          remaining: agentResultsCountResult.data?.rows?.[0]?.count || 0
        }
      },
      timestamp: new Date().toISOString()
    };

    console.log('[DEV_FLUSH] Cache flush completed successfully:', summary);

    return NextResponse.json({
      success: true,
      message: 'Cache flushed successfully',
      ...summary
    });

  } catch (error) {
    console.error('[DEV_FLUSH] Cache flush failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Cache flush operation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to flush cache.' },
    { status: 405 }
  );
}

import { NextRequest, NextResponse } from 'next/server'
import { getProductStats } from '../../../../lib/database/products'
import { getOwnershipMappingStats } from '../../../../lib/database/ownership-mappings.js'
import { getFilteredProductStats } from '../../../../lib/database/products'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const country = searchParams.get('country') || ''
    const result_type = searchParams.get('result_type') || ''
    const minConfidence = searchParams.get('min_confidence') || ''
    const maxConfidence = searchParams.get('max_confidence') || ''

    // Get base stats
    const [productStats, mappingStats] = await Promise.all([
      getProductStats(),
      getOwnershipMappingStats()
    ])

    // Get filtered stats if filters are applied
    let filteredStats = null
    if (search || country || result_type || minConfidence || maxConfidence) {
      filteredStats = await getFilteredProductStats({
        search,
        country,
        result_type,
        minConfidence: minConfidence ? parseInt(minConfidence) : undefined,
        maxConfidence: maxConfidence ? parseInt(maxConfidence) : undefined
      })
    }
    
    if (!productStats.success) {
      return NextResponse.json(
        { error: 'Failed to fetch product stats', details: productStats.error },
        { status: 500 }
      )
    }
    
    const combinedStats = {
      products: productStats.stats,
      mappings: mappingStats.success ? mappingStats.stats : null,
      filtered: filteredStats?.success ? filteredStats.stats : null
    }
    
    return NextResponse.json(combinedStats)
    
  } catch (error) {
    console.error('[Dashboard API] Stats fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
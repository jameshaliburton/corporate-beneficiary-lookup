import { NextRequest, NextResponse } from 'next/server'
import { getFilteredProducts } from '../../../../lib/database/products'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''
    const country = searchParams.get('country') || ''
    const result_type = searchParams.get('result_type') || ''
    const sort_by = searchParams.get('sort_by') || 'created_at'
    const sort_order = searchParams.get('sort_order') || 'desc'
    const minConfidence = searchParams.get('min_confidence')
    const maxConfidence = searchParams.get('max_confidence')

    const result = await getFilteredProducts({
      limit,
      offset,
      search,
      country,
      result_type,
      sort_by,
      sort_order,
      minConfidence: minConfidence ? parseInt(minConfidence) : undefined,
      maxConfidence: maxConfidence ? parseInt(maxConfidence) : undefined
    })

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to fetch products', details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      products: result.data,
      total: result.data.length
    })

  } catch (error) {
    console.error('[Dashboard API] Products fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
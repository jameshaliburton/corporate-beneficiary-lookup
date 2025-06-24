import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Mock data for testing
    const mockData = {
      products: [
        {
          id: 1,
          barcode: '123456789',
          product_name: 'Kit Kat Chocolate Bar',
          brand: 'Kit Kat',
          financial_beneficiary: 'Nestlé S.A.',
          beneficiary_country: 'Switzerland',
          beneficiary_flag: '🇨🇭',
          confidence_score: 95,
          ownership_structure_type: 'Subsidiary',
          result_type: 'static_mapping',
          static_mapping_used: true,
          web_research_used: false,
          user_contributed: false,
          inferred: true,
          created_at: '2025-06-23T14:17:51.541+00:00',
          updated_at: '2025-06-23T14:17:51.542+00:00'
        }
      ],
      stats: {
        total: 26,
        byCountry: {
          'Switzerland': 8,
          'United States': 12,
          'Unknown': 6
        },
        byResultType: {
          'static_mapping': 15,
          'ai_research': 10,
          'user_contribution': 1
        },
        userContributed: 1,
        inferred: 25,
        byConfidence: {
          high: 15,
          medium: 5,
          low: 6
        }
      }
    }
    
    return NextResponse.json(mockData)
    
  } catch (error) {
    console.error('[Dashboard API] Test endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { lookupProduct } from '../../../src/lib/apis/barcode-lookup.js'
import { getOwnershipKnowledge } from '../../../src/lib/agents/knowledge-agent.js'
import { verifyOwnership } from '../../../src/lib/agents/verification-agent.js'

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const debugInfo = {
    pipeline_steps: [],
    confidence_breakdown: {},
    raw_responses: {}
  }

  try {
    const { barcode } = await req.json()
    if (!barcode) {
      return NextResponse.json({ success: false, error: 'No barcode provided' }, { status: 400 })
    }

    // Step 1: Barcode lookup with timing
    const lookupStart = Date.now()
    const productRes = await lookupProduct(barcode)
    const lookupDuration = Date.now() - lookupStart
    
    debugInfo.pipeline_steps.push({
      step: 'barcode_lookup',
      duration_ms: lookupDuration,
      success: productRes.success,
      source: productRes.source,
      details: `Found via ${productRes.source}`
    })

    // Step 2: Knowledge agent with timing
    const knowledgeStart = Date.now()
    const knowledge = await getOwnershipKnowledge(
      productRes.product_name, 
      productRes.brand,
      productRes.source,
      productRes.region_hint
    )
    const knowledgeDuration = Date.now() - knowledgeStart
    
    debugInfo.pipeline_steps.push({
      step: 'knowledge_agent',
      duration_ms: knowledgeDuration,
      success: !!knowledge.financial_beneficiary,
      details: `AI confidence: ${knowledge.confidence_score}%`
    })
    debugInfo.raw_responses.knowledge = knowledge.reasoning || 'No reasoning provided'

    // Step 3: Verification with timing
    let verification = { verification_status: 'skipped', confidence_adjustment: 0, sources: [], reasoning: 'Skipped for unknown products' }
    
    if (productRes.source !== 'ai_inference') {
      const verificationStart = Date.now()
      verification = await verifyOwnership(knowledge, productRes.product_name, productRes.brand)
      const verificationDuration = Date.now() - verificationStart
      
      debugInfo.pipeline_steps.push({
        step: 'verification_agent',
        duration_ms: verificationDuration,
        success: verification.verification_status !== 'error',
        details: `Status: ${verification.verification_status}`
      })
      debugInfo.raw_responses.verification = verification.reasoning || 'No reasoning provided'
    }

    // Step 4: Calculate final confidence
    let confidence = (knowledge.confidence_score || 0) + (verification.confidence_adjustment || 0)
    if (confidence > 110) confidence = 110
    if (confidence < 0) confidence = 0

    debugInfo.confidence_breakdown = {
      original: knowledge.confidence_score || 0,
      adjustment: verification.confidence_adjustment || 0,
      final: confidence,
      reasoning: `Knowledge: ${knowledge.confidence_score}%, Verification: ${verification.confidence_adjustment >= 0 ? '+' : ''}${verification.confidence_adjustment}%`
    }

    const countryFlag = countryToFlagEmoji(knowledge.beneficiary_country)
    const totalDuration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      product_name: productRes.product_name,
      brand: productRes.brand,
      barcode: productRes.barcode,
      source: productRes.source,
      financial_beneficiary: knowledge.financial_beneficiary,
      beneficiary_country: knowledge.beneficiary_country,
      beneficiary_flag: countryFlag,
      confidence,
      verification_status: verification.verification_status,
      sources: verification.sources,
      reasoning: verification.reasoning,
      debug: {
        ...debugInfo,
        total_duration_ms: totalDuration
      }
    })
  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ 
      success: false, 
      error: 'Research failed, please try again',
      debug: debugInfo 
    }, { status: 500 })
  }
}

// Helper to get country flag emoji
function countryToFlagEmoji(country: string = ""): string {
  if (!country) return ""
  
  // Common country mappings
  const countryMappings: { [key: string]: string } = {
    'United States': 'US',
    'USA': 'US', 
    'America': 'US',
    'Sweden': 'SE',
    'Switzerland': 'CH',
    'Germany': 'DE',
    'United Kingdom': 'GB',
    'UK': 'GB',
    'France': 'FR',
    'Netherlands': 'NL',
    'Denmark': 'DK',
    'Norway': 'NO',
    'Finland': 'FI'
  }
  
  const code = countryMappings[country] || country.trim().slice(0,2).toUpperCase()
  if (code.length !== 2) return ""
  
  const A = 0x1F1E6
  return String.fromCodePoint(
    A + code.charCodeAt(0) - 65,
    A + code.charCodeAt(1) - 65
  )
}
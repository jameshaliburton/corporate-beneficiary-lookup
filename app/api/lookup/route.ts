import { NextRequest, NextResponse } from 'next/server'
import { lookupProduct } from '../../../src/lib/apis/barcode-lookup.js'
import { getOwnershipKnowledge } from '../../../src/lib/agents/knowledge-agent.js'
import { verifyOwnership } from '../../../src/lib/agents/verification-agent.js'

export async function POST(req: NextRequest) {
  try {
    const { barcode } = await req.json()
    if (!barcode) {
      return NextResponse.json({ success: false, error: 'No barcode provided' }, { status: 400 })
    }

    // Step 1: Lookup product by barcode
    const productRes = await lookupProduct(barcode)
    if (!productRes.success) {
      return NextResponse.json({ success: false, error: 'Product not found in database' }, { status: 404 })
    }

    // Step 2: Get LLM knowledge
    const knowledge = await getOwnershipKnowledge(productRes.product_name, productRes.brand)

    // Step 3: Verify with research
    const verification = await verifyOwnership(knowledge, productRes.product_name, productRes.brand)

    // Step 4: Calculate final confidence
    let confidence = (knowledge.confidence_score || 0) + (verification.confidence_adjustment || 0)
    if (confidence > 110) confidence = 110
    if (confidence < 0) confidence = 0

    // Country flag emoji
    const countryFlag = countryToFlagEmoji(knowledge.beneficiary_country)

    return NextResponse.json({
      success: true,
      product_name: productRes.product_name,
      brand: productRes.brand,
      barcode: productRes.barcode,
      financial_beneficiary: knowledge.financial_beneficiary,
      beneficiary_country: knowledge.beneficiary_country,
      beneficiary_flag: countryFlag,
      confidence,
      verification_status: verification.verification_status,
      sources: verification.sources,
      reasoning: verification.reasoning,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Research failed, please try again' }, { status: 500 })
  }
}

// Helper to get country flag emoji
function countryToFlagEmoji(country: string = ""): string {
  if (!country) return ""
  // Use the first two letters of the country name (ISO country code is best, but fallback)
  const code = country.trim().slice(0,2).toUpperCase()
  if (code.length !== 2) return ""
  const A = 0x1F1E6
  return String.fromCodePoint(
    A + code.charCodeAt(0) - 65,
    A + code.charCodeAt(1) - 65
  )
} 
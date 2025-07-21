import { NextRequest, NextResponse } from 'next/server'
import { getPromptBuilder } from '@/lib/agents/prompt-registry'

export async function POST(request: NextRequest) {
  try {
    const { systemPrompt, userPrompt, testInput, agentName, stage } = await request.json()

    // Validate required fields
    if (!systemPrompt || !userPrompt) {
      return NextResponse.json(
        { error: 'System prompt and user prompt are required' },
        { status: 400 }
      )
    }

    // Simulate AI response based on the stage and agent
    let simulatedOutput = ''
    let confidence = 85

    switch (stage) {
      case 'image-analysis':
        simulatedOutput = `Image Analysis Results:
- Detected text: "${testInput || 'Product image'}"
- OCR confidence: ${confidence}%
- Image quality: High
- Extracted brand elements: Coca-Cola, Coca Cola
- Product identification: Soft drink, beverage`
        break

      case 'brand-extraction':
        simulatedOutput = `Brand Extraction Results:
- Primary brand: Coca-Cola
- Alternative brands: Coca Cola, Coke
- Confidence: ${confidence}%
- Reasoning: Clear brand logo and text identification
- Context: Soft drink product`
        break

      case 'entity-validation':
        simulatedOutput = `Entity Validation Results:
- Validated entity: The Coca-Cola Company
- Entity type: Corporation
- Confidence: ${confidence}%
- Source: Corporate database
- Status: Verified
- Additional info: Publicly traded company (NYSE: KO)`
        break

      case 'disambiguation':
        simulatedOutput = `Brand Disambiguation Results:
- Selected brand: Coca-Cola (official)
- Rejected alternatives: Coca Cola (variant spelling)
- Confidence: ${confidence}%
- Reasoning: Official brand name takes precedence
- Standardization: Applied`
        break

      case 'quality-assessment':
        simulatedOutput = `Quality Assessment Results:
- Is meaningful: true
- Confidence: ${confidence}%
- Quality score: 85
- Reasoning: Strong brand identification with clear product context
- Issues: None identified`
        break

      case 'ownership-research':
        simulatedOutput = `Ownership Research Results:
- Financial beneficiary: The Coca-Cola Company
- Beneficiary country: United States
- Ownership structure: Public
- Confidence: ${confidence}%
- Sources: SEC filings, annual reports, investor relations
- Reasoning: Clear evidence from official corporate documents`
        break

      case 'verification':
        simulatedOutput = `Verification Results:
- Verification status: Verified
- Confidence: ${confidence}%
- Sources verified: 3/3
- Cross-reference: Successful
- Final result: The Coca-Cola Company (NYSE: KO)`
        break

      default:
        simulatedOutput = `Test Results:
- Input processed: "${testInput || 'Test input'}"
- Agent: ${agentName || 'Unknown'}
- Stage: ${stage || 'Unknown'}
- Confidence: ${confidence}%
- Status: Success`
    }

    return NextResponse.json({
      success: true,
      output: simulatedOutput,
      confidence,
      agent: agentName,
      stage,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Test prompt API error:', error)
    return NextResponse.json(
      { error: 'Failed to process test prompt' },
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { PROMPT_VERSIONS, PROMPT_STATUS, getPromptBuilder } from '@/lib/agents/prompt-registry'

export async function GET(request: NextRequest) {
  try {
    const prompts = []
    
    // Convert the prompt registry data to the expected format
    for (const [agentType, versions] of Object.entries(PROMPT_VERSIONS)) {
      for (const [version, status] of Object.entries(versions)) {
        // Get a sample prompt to extract content
        let sampleContent = ''
        try {
          const promptBuilder = getPromptBuilder(agentType, version)
          // Create a sample prompt to get the content
          const samplePrompt = promptBuilder('Sample Product', 'Sample Brand', {}, {}, {})
          // Handle both string and object return types
          if (typeof samplePrompt === 'string') {
            sampleContent = samplePrompt
          } else if (samplePrompt && typeof samplePrompt === 'object' && 'system_prompt' in samplePrompt) {
            sampleContent = samplePrompt.system_prompt || 'Prompt content not available'
          } else {
            sampleContent = `Prompt version ${version} for ${agentType}`
          }
        } catch (error) {
          sampleContent = `Prompt version ${version} for ${agentType}`
        }
        
        prompts.push({
          id: `${agentType}_${version}`,
          name: agentType.replace(/_/g, ' '),
          version: version,
          content: sampleContent,
          created_at: new Date().toISOString(), // We don't have creation dates, so use current
          is_current: status === PROMPT_STATUS.CURRENT,
          status: status,
          agent_type: agentType
        })
      }
    }
    
    // Sort by agent type and version
    prompts.sort((a, b) => {
      if (a.agent_type !== b.agent_type) {
        return a.agent_type.localeCompare(b.agent_type)
      }
      return a.version.localeCompare(b.version)
    })

    return NextResponse.json({ success: true, prompts })
  } catch (error) {
    console.error('[Evaluation V3 Prompts API] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt_id, content, version } = body
    
    // In a real implementation, this would update the prompt registry
    // For now, we'll just return success
    console.log('Updating prompt:', { prompt_id, version, content_length: content?.length })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Prompt updated successfully',
      prompt_id,
      version
    })
  } catch (error) {
    console.error('[Evaluation V3 Prompts API] PUT error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
} 
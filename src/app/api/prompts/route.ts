import { NextRequest, NextResponse } from 'next/server';
import { PROMPT_VERSIONS, PROMPT_STATUS, getPromptBuilder, getCurrentPromptVersion } from '../../../lib/agents/prompt-registry.js';
import fs from 'fs/promises';
import path from 'path';

// GET /api/prompts - Retrieve all prompt versions and their content
export async function GET() {
  try {
    const agents = Object.keys(PROMPT_VERSIONS);
    const promptData = [];

    for (const agentKey of agents) {
      const versions = PROMPT_VERSIONS[agentKey];
      const agentVersions = [];

      for (const [version, status] of Object.entries(versions)) {
        try {
          // Get the prompt builder function for this version
          const promptBuilder = getPromptBuilder(agentKey, version);
          
          // Create sample data to generate the prompt (for display purposes)
          const sampleData = {
            product_name: 'Sample Product',
            brand: 'Sample Brand',
            hints: {},
            webResearchData: { success: true, total_sources: 5 },
            queryAnalysis: { company_type: 'Unknown', country_guess: 'Unknown', flags: [] }
          };

          // Generate the prompt content
          const promptContent = promptBuilder(
            sampleData.product_name,
            sampleData.brand,
            sampleData.hints,
            sampleData.webResearchData,
            sampleData.queryAnalysis
          );

          agentVersions.push({
            version,
            status,
            prompt: promptContent,
            isCurrent: status === PROMPT_STATUS.CURRENT
          });
        } catch (error) {
          console.error(`Error getting prompt for ${agentKey} ${version}:`, error);
          agentVersions.push({
            version,
            status,
            prompt: `Error loading prompt: ${error.message}`,
            isCurrent: status === PROMPT_STATUS.CURRENT
          });
        }
      }

      promptData.push({
        key: agentKey,
        name: agentKey.replace(/_/g, ' '),
        versions: agentVersions
      });
    }

    return NextResponse.json({ success: true, data: promptData });
  } catch (error) {
    console.error('Error retrieving prompts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve prompts' },
      { status: 500 }
    );
  }
}

// POST /api/prompts - Update prompt content for a specific version
export async function POST(request: NextRequest) {
  try {
    const { agentKey, version, prompt } = await request.json();

    if (!agentKey || !version || !prompt) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: agentKey, version, prompt' },
        { status: 400 }
      );
    }

    // For now, we'll just return success since we're not implementing file writing yet
    // In a real implementation, you would:
    // 1. Validate the prompt content
    // 2. Write the updated prompt to the appropriate file
    // 3. Update the prompt registry if needed

    console.log(`Updating prompt for ${agentKey} ${version}:`, prompt.substring(0, 100) + '...');

    return NextResponse.json({ 
      success: true, 
      message: 'Prompt updated successfully (not yet implemented)' 
    });
  } catch (error) {
    console.error('Error updating prompt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update prompt' },
      { status: 500 }
    );
  }
}

// PUT /api/prompts - Set the active version for an agent
export async function PUT(request: NextRequest) {
  try {
    const { agentKey, version } = await request.json();

    if (!agentKey || !version) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: agentKey, version' },
        { status: 400 }
      );
    }

    // For now, we'll just return success since we're not implementing version switching yet
    // In a real implementation, you would:
    // 1. Validate that the version exists for the agent
    // 2. Update the prompt registry to set the new current version
    // 3. Update any configuration files if needed

    console.log(`Setting active version for ${agentKey} to ${version}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Active version updated successfully (not yet implemented)' 
    });
  } catch (error) {
    console.error('Error setting active version:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set active version' },
      { status: 500 }
    );
  }
} 
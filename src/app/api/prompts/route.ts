import { NextRequest, NextResponse } from 'next/server';
import { PROMPT_VERSIONS, PROMPT_STATUS, getPromptBuilder, getCurrentPromptVersion } from '../../../lib/agents/prompt-registry.js';
import fs from 'fs/promises';
import path from 'path';

// In-memory storage for prompt edits (in production, this would be a database)
let promptEdits: Record<string, Record<string, string>> = {};
let activeVersions: Record<string, string> = {};

// Load saved prompt edits from file if it exists
async function loadPromptEdits() {
  try {
    const editsPath = path.join(process.cwd(), 'data', 'prompt-edits.json');
    const data = await fs.readFile(editsPath, 'utf-8');
    promptEdits = JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is invalid, start with empty object
    promptEdits = {};
  }
}

// Save prompt edits to file
async function savePromptEdits() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    const editsPath = path.join(dataDir, 'prompt-edits.json');
    await fs.writeFile(editsPath, JSON.stringify(promptEdits, null, 2));
  } catch (error) {
    console.error('Error saving prompt edits:', error);
  }
}

// Load active versions from file if it exists
async function loadActiveVersions() {
  try {
    const versionsPath = path.join(process.cwd(), 'data', 'active-versions.json');
    const data = await fs.readFile(versionsPath, 'utf-8');
    activeVersions = JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is invalid, start with defaults from registry
    activeVersions = {};
    for (const [agentKey, versions] of Object.entries(PROMPT_VERSIONS)) {
      for (const [version, status] of Object.entries(versions)) {
        if (status === PROMPT_STATUS.CURRENT) {
          activeVersions[agentKey] = version;
          break;
        }
      }
    }
  }
}

// Save active versions to file
async function saveActiveVersions() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    const versionsPath = path.join(dataDir, 'active-versions.json');
    await fs.writeFile(versionsPath, JSON.stringify(activeVersions, null, 2));
  } catch (error) {
    console.error('Error saving active versions:', error);
  }
}

// Initialize data on first load
let initialized = false;
async function initialize() {
  if (!initialized) {
    await loadPromptEdits();
    await loadActiveVersions();
    initialized = true;
  }
}

// GET /api/prompts - Retrieve all prompt versions and their content
export async function GET() {
  try {
    await initialize();
    
    const agents = Object.keys(PROMPT_VERSIONS);
    const promptData = [];

    for (const agentKey of agents) {
      const versions = PROMPT_VERSIONS[agentKey];
      const agentVersions = [];
      const currentActiveVersion = activeVersions[agentKey] || Object.keys(versions).find(v => versions[v] === PROMPT_STATUS.CURRENT);

      for (const [version, status] of Object.entries(versions)) {
        try {
          // Check if there's a saved edit for this version
          const savedPrompt = promptEdits[agentKey]?.[version];
          
          let promptContent;
          
          if (savedPrompt) {
            // Use the saved prompt content
            promptContent = savedPrompt;
          } else {
            // Get the prompt builder function for this version
            const promptBuilder = getPromptBuilder(agentKey, version);
            
            // Create sample data to generate the prompt (for display purposes)
            if (agentKey === 'OWNERSHIP_RESEARCH') {
              const sampleData = {
                product_name: 'Sample Product',
                brand: 'Sample Brand',
                hints: {},
                webResearchData: { 
                  success: true, 
                  findings: [
                    {
                      url: 'https://example.com/sample',
                      title: 'Sample Source',
                      snippet: 'Sample content snippet',
                      content: 'Sample content for testing',
                      priorityScore: 15
                    }
                  ]
                },
                queryAnalysis: { 
                  company_type: 'Unknown', 
                  country_guess: 'Unknown', 
                  flags: [],
                  reasoning: 'Sample analysis'
                }
              };

              promptContent = promptBuilder(
                sampleData.product_name,
                sampleData.brand,
                sampleData.hints,
                sampleData.webResearchData,
                sampleData.queryAnalysis
              );
            } else if (agentKey === 'QUERY_BUILDER') {
              const sampleData = {
                product_name: 'Sample Product',
                brand: 'Sample Brand',
                hints: {}
              };
              promptContent = promptBuilder(
                sampleData.product_name,
                sampleData.brand,
                sampleData.hints
              );
            } else if (agentKey === 'VERIFICATION') {
              const sampleData = {
                ownership_result: {
                  financial_beneficiary: 'Sample Owner',
                  beneficiary_country: 'Sample Country',
                  ownership_structure_type: 'Private',
                  confidence_score: 75,
                  sources: ['Sample Source'],
                  reasoning: 'Sample reasoning'
                },
                sources_used: ['https://example.com/sample']
              };
              promptContent = promptBuilder(
                sampleData.ownership_result,
                sampleData.sources_used
              );
            } else {
              promptContent = promptBuilder();
            }
          }

          agentVersions.push({
            version,
            status,
            prompt: promptContent,
            isCurrent: version === currentActiveVersion,
            isEdited: !!savedPrompt
          });
        } catch (error) {
          console.error(`Error getting prompt for ${agentKey} ${version}:`, error);
          agentVersions.push({
            version,
            status,
            prompt: `Error loading prompt: ${error.message}`,
            isCurrent: version === currentActiveVersion,
            isEdited: false
          });
        }
      }

      promptData.push({
        key: agentKey,
        name: agentKey.replace(/_/g, ' '),
        versions: agentVersions,
        currentVersion: currentActiveVersion
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
    await initialize();
    
    const { agentKey, version, prompt } = await request.json();

    if (!agentKey || !version || !prompt) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: agentKey, version, prompt' },
        { status: 400 }
      );
    }

    // Validate that the agent and version exist
    if (!PROMPT_VERSIONS[agentKey] || !PROMPT_VERSIONS[agentKey][version]) {
      return NextResponse.json(
        { success: false, error: 'Invalid agent or version' },
        { status: 400 }
      );
    }

    // Save the prompt edit
    if (!promptEdits[agentKey]) {
      promptEdits[agentKey] = {};
    }
    promptEdits[agentKey][version] = prompt;

    // Persist to file
    await savePromptEdits();

    console.log(`Updated prompt for ${agentKey} ${version}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Prompt updated successfully',
      data: {
        agentKey,
        version,
        isEdited: true
      }
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
    await initialize();
    
    const { agentKey, version } = await request.json();

    if (!agentKey || !version) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: agentKey, version' },
        { status: 400 }
      );
    }

    // Validate that the agent and version exist
    if (!PROMPT_VERSIONS[agentKey] || !PROMPT_VERSIONS[agentKey][version]) {
      return NextResponse.json(
        { success: false, error: 'Invalid agent or version' },
        { status: 400 }
      );
    }

    // Set the active version
    activeVersions[agentKey] = version;

    // Persist to file
    await saveActiveVersions();

    console.log(`Set active version for ${agentKey} to ${version}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Active version updated successfully',
      data: {
        agentKey,
        currentVersion: version
      }
    });
  } catch (error) {
    console.error('Error setting active version:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set active version' },
      { status: 500 }
    );
  }
} 
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Emit progress update for real-time tracking
 */
export async function emitProgress(queryId: string, stage: string, status: 'started' | 'success' | 'error' | 'completed', data?: any, error?: string) {
  try {
    // Use absolute URL for Node.js environment
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
    const url = `${baseUrl}/api/progress`
    
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queryId,
        stage,
        status,
        data,
        error
      })
    })
  } catch (err) {
    // Silently fail - progress tracking is not critical
    console.debug('[Progress] Failed to emit progress update:', err)
  }
}

/**
 * Get stage display name and description
 */
export function getStageInfo(stage: string): { name: string; description: string; icon: string } {
  const stageInfo = {
    cache_check: {
      name: 'Checking Cache',
      description: 'Looking for previously researched results',
      icon: '💾'
    },
    static_mapping: {
      name: 'Static Mapping',
      description: 'Checking pre-defined ownership mappings',
      icon: '🗂️'
    },
    query_builder: {
      name: 'Query Analysis',
      description: 'Analyzing brand for optimal search queries',
      icon: '🔍'
    },
    web_research: {
      name: 'Web Research',
      description: 'Searching the web for ownership information',
      icon: '🌐'
    },
    ownership_analysis: {
      name: 'AI Analysis',
      description: 'Analyzing findings with AI',
      icon: '🤖'
    },
    validation: {
      name: 'Validation',
      description: 'Validating and refining results',
      icon: '✅'
    },
    database_save: {
      name: 'Saving Results',
      description: 'Storing results in database',
      icon: '💾'
    },
    evaluation: {
      name: 'Evaluation',
      description: 'Running quality assessment',
      icon: '📊'
    },
    error_recovery: {
      name: 'Error Recovery',
      description: 'Handling errors and fallbacks',
      icon: '⚠️'
    }
  }
  
  return stageInfo[stage as keyof typeof stageInfo] || {
    name: stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: 'Processing...',
    icon: '⚙️'
  }
}

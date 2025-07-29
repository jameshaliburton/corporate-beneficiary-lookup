/**
 * JSON Repair Utility
 * Handles malformed JSON responses from LLM calls with intelligent repair
 */

/**
 * Repair malformed JSON string
 * @param {string} jsonString - Potentially malformed JSON string
 * @returns {Object|null} Repaired JSON object or null if unrecoverable
 */
export function repairJSON(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    return null
  }

  try {
    // First try to parse as-is
    return JSON.parse(jsonString)
  } catch (error) {
    console.log('[JSONRepair] Attempting to repair malformed JSON:', error.message)
    
    // Try various repair strategies
    const repaired = tryRepairStrategies(jsonString)
    
    if (repaired) {
      try {
        return JSON.parse(repaired)
      } catch (secondError) {
        console.error('[JSONRepair] Failed to parse repaired JSON:', secondError.message)
        return null
      }
    }
    
    return null
  }
}

/**
 * Try multiple repair strategies
 * @param {string} jsonString - Malformed JSON string
 * @returns {string|null} Repaired JSON string or null
 */
function tryRepairStrategies(jsonString) {
  // Strategy 1: Remove trailing commas
  let repaired = jsonString.replace(/,(\s*[}\]])/g, '$1')
  
  // Strategy 2: Fix unquoted property names
  repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
  
  // Strategy 3: Fix single quotes to double quotes
  repaired = repaired.replace(/'/g, '"')
  
  // Strategy 4: Remove extra commas at the end of objects/arrays
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1')
  
  // Strategy 5: Fix missing quotes around string values
  repaired = repaired.replace(/:\s*([a-zA-Z][a-zA-Z0-9\s]*)([,}\]])/g, ':"$1"$2')
  
  // Strategy 6: Remove any trailing commas
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1')
  
  // Strategy 7: Fix common LLM formatting issues
  repaired = repaired
    .replace(/```json\s*/g, '')
    .replace(/```\s*$/g, '')
    .replace(/^\s*```\s*/g, '')
  
  return repaired
}

/**
 * Extract JSON from markdown code blocks
 * @param {string} text - Text that might contain JSON in code blocks
 * @returns {string|null} Extracted JSON string or null
 */
export function extractJSONFromMarkdown(text) {
  if (!text) return null
  
  // Look for JSON code blocks
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim()
  }
  
  // Look for JSON-like content between curly braces
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return jsonMatch[0]
  }
  
  return null
}

/**
 * Validate and repair JSON with retry logic
 * @param {string} jsonString - JSON string to validate/repair
 * @param {number} maxRetries - Maximum repair attempts
 * @returns {Object|null} Valid JSON object or null
 */
export function validateAndRepairJSON(jsonString, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const parsed = JSON.parse(jsonString)
      console.log(`[JSONRepair] Successfully parsed JSON on attempt ${attempt}`)
      return parsed
    } catch (error) {
      console.log(`[JSONRepair] Attempt ${attempt} failed:`, error.message)
      
      if (attempt === maxRetries) {
        console.error('[JSONRepair] All repair attempts failed')
        return null
      }
      
      // Try to extract from markdown first
      const extracted = extractJSONFromMarkdown(jsonString)
      if (extracted) {
        jsonString = extracted
      }
      
      // Apply repair strategies
      jsonString = tryRepairStrategies(jsonString)
    }
  }
  
  return null
}

/**
 * Safe JSON parsing with detailed error reporting
 * @param {string} jsonString - JSON string to parse
 * @param {string} context - Context for error reporting
 * @returns {Object|null} Parsed JSON or null
 */
export function safeJSONParse(jsonString, context = 'unknown') {
  if (!jsonString) {
    console.error(`[JSONRepair] Empty JSON string in context: ${context}`)
    return null
  }
  
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.error(`[JSONRepair] JSON parse error in ${context}:`, error.message)
    console.log(`[JSONRepair] Problematic JSON:`, jsonString.substring(0, 200) + '...')
    
    const repaired = validateAndRepairJSON(jsonString)
    if (repaired) {
      console.log(`[JSONRepair] Successfully repaired JSON in ${context}`)
      return repaired
    }
    
    console.error(`[JSONRepair] Failed to repair JSON in ${context}`)
    return null
  }
}

export default {
  repairJSON,
  extractJSONFromMarkdown,
  validateAndRepairJSON,
  safeJSONParse
} 
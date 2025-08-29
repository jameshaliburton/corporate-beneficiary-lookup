/**
 * Ownership Schema Guards
 * 
 * Provides Zod schemas with safe defaults to prevent undefined property access
 * and ensure consistent data structures across the pipeline.
 */

import { z } from 'zod';

/**
 * Base ownership entity schema
 */
export const OwnershipEntitySchema = z.object({
  name: z.string().default('Unknown'),
  role: z.string().default('Unknown'),
  country: z.string().default('Unknown'),
  flag: z.string().default('🏳️'),
  ultimate: z.boolean().default(false),
  sources: z.array(z.any()).default([])
});

/**
 * Ownership chain schema with safe defaults
 */
export const OwnershipChainSchema = z.array(OwnershipEntitySchema).default([]);

/**
 * Sources schema with safe defaults
 */
export const SourcesSchema = z.array(z.any()).default([]);

/**
 * Confidence schema with safe bounds
 */
export const ConfidenceSchema = z.number().min(0).max(1).default(0);

/**
 * Main ownership result schema with all safe defaults
 */
export const OwnershipSchema = z.object({
  // Core ownership data
  ownership_chain: OwnershipChainSchema,
  sources: SourcesSchema,
  confidence: ConfidenceSchema,
  
  // Brand information
  brand_name: z.string().default('Unknown Brand'),
  brand_country: z.string().default('Unknown'),
  brand_flag: z.string().default('🏳️'),
  
  // Owner information
  ultimate_owner: z.string().default('Unknown Owner'),
  ultimate_owner_country: z.string().default('Unknown'),
  ultimate_owner_flag: z.string().default('🏳️'),
  
  // Research metadata
  research_method: z.string().default('unknown'),
  final_confidence: ConfidenceSchema,
  success: z.boolean().default(false),
  
  // Disambiguation data
  disambiguation_options: z.array(z.any()).default([]),
  disambiguation_triggered: z.boolean().default(false),
  
  // Additional metadata
  ownership_type: z.string().default('Unknown'),
  acquisition_history: z.array(z.any()).default([]),
  ethical_concerns: z.array(z.any()).default([]),
  
  // Timestamps
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

/**
 * Web search agent result schema
 */
export const WebSearchResultSchema = z.object({
  success: z.boolean().default(false),
  ownership_chain: OwnershipChainSchema,
  sources: SourcesSchema,
  final_confidence: ConfidenceSchema,
  research_method: z.string().default('web_search'),
  error: z.string().optional()
});

/**
 * Enhanced agent result schema
 */
export const EnhancedAgentResultSchema = z.object({
  success: z.boolean().default(false),
  financial_beneficiary: z.string().default('Unknown'),
  confidence_score: z.number().min(0).max(100).default(0),
  ownership_flow: OwnershipChainSchema,
  research_method: z.string().default('enhanced_agent'),
  error: z.string().optional()
});

/**
 * Safely parse and validate ownership data with defaults
 * 
 * @param data - Raw data to validate
 * @param context - Context for logging (e.g., 'WebSearchAgent', 'EnhancedAgent')
 * @returns Validated ownership data with safe defaults
 */
export function safeParseOwnershipData<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  context: string
): z.infer<T> {
  try {
    const result = schema.parse(data);
    console.log(`[SCHEMA_GUARD] ${context} - Data validated successfully ✅`);
    return result;
  } catch (error) {
    console.error(`[SCHEMA_GUARD] ${context} - Validation failed, using defaults:`, error);
    console.log(`[SCHEMA_GUARD] ${context} - Raw data:`, data);
    
    // Return default values from schema
    const defaultResult = schema.parse({});
    console.log(`[SCHEMA_GUARD] ${context} - Using default values:`, defaultResult);
    return defaultResult;
  }
}

/**
 * Safely access nested properties with fallbacks
 * 
 * @param obj - Object to access
 * @param path - Dot-separated path (e.g., 'ownership_chain.0.name')
 * @param fallback - Fallback value if path doesn't exist
 * @returns Value at path or fallback
 */
export function safeGet<T>(obj: any, path: string, fallback: T): T {
  try {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return fallback;
      }
      current = current[key];
    }
    
    return current !== undefined ? current : fallback;
  } catch (error) {
    console.error(`[SCHEMA_GUARD] Safe access failed for path '${path}':`, error);
    return fallback;
  }
}

/**
 * Validate and log ownership chain structure
 * 
 * @param ownershipChain - Ownership chain to validate
 * @param context - Context for logging
 * @returns Validated ownership chain
 */
export function validateOwnershipChain(
  ownershipChain: unknown,
  context: string
): z.infer<typeof OwnershipChainSchema> {
  console.log(`[SCHEMA_GUARD] ${context} - Validating ownership chain:`, {
    type: typeof ownershipChain,
    isArray: Array.isArray(ownershipChain),
    length: Array.isArray(ownershipChain) ? ownershipChain.length : 'N/A'
  });

  return safeParseOwnershipData(OwnershipChainSchema, ownershipChain, context);
}

/**
 * Validate and log sources structure
 * 
 * @param sources - Sources to validate
 * @param context - Context for logging
 * @returns Validated sources array
 */
export function validateSources(
  sources: unknown,
  context: string
): z.infer<typeof SourcesSchema> {
  console.log(`[SCHEMA_GUARD] ${context} - Validating sources:`, {
    type: typeof sources,
    isArray: Array.isArray(sources),
    length: Array.isArray(sources) ? sources.length : 'N/A'
  });

  return safeParseOwnershipData(SourcesSchema, sources, context);
}

/**
 * Validate and log confidence value
 * 
 * @param confidence - Confidence value to validate
 * @param context - Context for logging
 * @returns Validated confidence value
 */
export function validateConfidence(
  confidence: unknown,
  context: string
): z.infer<typeof ConfidenceSchema> {
  console.log(`[SCHEMA_GUARD] ${context} - Validating confidence:`, {
    type: typeof confidence,
    value: confidence,
    isNumber: typeof confidence === 'number'
  });

  return safeParseOwnershipData(ConfidenceSchema, confidence, context);
}

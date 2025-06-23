import { supabase } from '../supabase.ts'

/**
 * Ownership Mappings Database Operations
 * Handles static brand → owner mappings for fast lookups
 */

/**
 * Lookup ownership mapping by brand name
 */
export async function lookupOwnershipMapping(brandName) {
  try {
    if (!brandName) return null
    
    // Clean the brand name
    const cleanBrand = brandName.trim().toLowerCase()
    
    // Try exact match first
    let { data, error } = await supabase
      .from('ownership_mappings')
      .select('*')
      .ilike('brand_name', cleanBrand)
      .limit(1)
    
    if (error) {
      console.error('[OwnershipMappings] Database error:', error)
      return null
    }
    
    if (data && data.length > 0) {
      console.log(`[OwnershipMappings] Found exact match for ${brandName}:`, data[0])
      return data[0]
    }
    
    // Try partial match if no exact match
    const { data: partialData, error: partialError } = await supabase
      .from('ownership_mappings')
      .select('*')
      .or(`brand_name.ilike.%${cleanBrand}%,brand_name.ilike.${cleanBrand}%`)
      .limit(1)
    
    if (partialError) {
      console.error('[OwnershipMappings] Partial match error:', partialError)
      return null
    }
    
    if (partialData && partialData.length > 0) {
      console.log(`[OwnershipMappings] Found partial match for ${brandName}:`, partialData[0])
      return partialData[0]
    }
    
    console.log(`[OwnershipMappings] No mapping found for ${brandName}`)
    return null
    
  } catch (error) {
    console.error('[OwnershipMappings] Lookup error:', error)
    return null
  }
}

/**
 * Add new ownership mapping
 */
export async function addOwnershipMapping(mapping) {
  try {
    const { data, error } = await supabase
      .from('ownership_mappings')
      .insert([mapping])
      .select()
    
    if (error) {
      console.error('[OwnershipMappings] Insert error:', error)
      return { success: false, error }
    }
    
    console.log('[OwnershipMappings] Added new mapping:', data[0])
    return { success: true, data: data[0] }
    
  } catch (error) {
    console.error('[OwnershipMappings] Add mapping error:', error)
    return { success: false, error }
  }
}

/**
 * Update existing ownership mapping
 */
export async function updateOwnershipMapping(brandName, updates) {
  try {
    const { data, error } = await supabase
      .from('ownership_mappings')
      .update(updates)
      .eq('brand_name', brandName)
      .select()
    
    if (error) {
      console.error('[OwnershipMappings] Update error:', error)
      return { success: false, error }
    }
    
    if (data && data.length > 0) {
      console.log('[OwnershipMappings] Updated mapping:', data[0])
      return { success: true, data: data[0] }
    } else {
      console.log('[OwnershipMappings] No mapping found to update for:', brandName)
      return { success: false, error: 'Mapping not found' }
    }
    
  } catch (error) {
    console.error('[OwnershipMappings] Update mapping error:', error)
    return { success: false, error }
  }
}

/**
 * Delete ownership mapping
 */
export async function deleteOwnershipMapping(brandName) {
  try {
    const { error } = await supabase
      .from('ownership_mappings')
      .delete()
      .eq('brand_name', brandName)
    
    if (error) {
      console.error('[OwnershipMappings] Delete error:', error)
      return { success: false, error }
    }
    
    console.log('[OwnershipMappings] Deleted mapping for:', brandName)
    return { success: true }
    
  } catch (error) {
    console.error('[OwnershipMappings] Delete mapping error:', error)
    return { success: false, error }
  }
}

/**
 * Get all ownership mappings
 */
export async function getAllOwnershipMappings() {
  try {
    const { data, error } = await supabase
      .from('ownership_mappings')
      .select('*')
      .order('brand_name')
    
    if (error) {
      console.error('[OwnershipMappings] Get all error:', error)
      return { success: false, error, data: [] }
    }
    
    return { success: true, data: data || [] }
    
  } catch (error) {
    console.error('[OwnershipMappings] Get all mappings error:', error)
    return { success: false, error, data: [] }
  }
}

/**
 * Search ownership mappings
 */
export async function searchOwnershipMappings(query) {
  try {
    if (!query) return { success: true, data: [] }
    
    const { data, error } = await supabase
      .from('ownership_mappings')
      .select('*')
      .or(`brand_name.ilike.%${query}%,ultimate_owner_name.ilike.%${query}%`)
      .order('brand_name')
    
    if (error) {
      console.error('[OwnershipMappings] Search error:', error)
      return { success: false, error, data: [] }
    }
    
    return { success: true, data: data || [] }
    
  } catch (error) {
    console.error('[OwnershipMappings] Search mappings error:', error)
    return { success: false, error, data: [] }
  }
}

/**
 * Get ownership mapping statistics
 */
export async function getOwnershipMappingStats() {
  try {
    const { data, error } = await supabase
      .from('ownership_mappings')
      .select('ultimate_owner_country')
    
    if (error) {
      console.error('[OwnershipMappings] Stats error:', error)
      return { success: false, error }
    }
    
    const stats = {
      total: data.length,
      byCountry: {},
      byOwner: {}
    }
    
    data.forEach(mapping => {
      // Count by country
      const country = mapping.ultimate_owner_country
      stats.byCountry[country] = (stats.byCountry[country] || 0) + 1
    })
    
    return { success: true, stats }
    
  } catch (error) {
    console.error('[OwnershipMappings] Get stats error:', error)
    return { success: false, error }
  }
}

/**
 * Bulk import ownership mappings
 */
export async function bulkImportOwnershipMappings(mappings) {
  try {
    const { data, error } = await supabase
      .from('ownership_mappings')
      .upsert(mappings, { onConflict: 'brand_name' })
      .select()
    
    if (error) {
      console.error('[OwnershipMappings] Bulk import error:', error)
      return { success: false, error }
    }
    
    console.log(`[OwnershipMappings] Bulk imported ${data.length} mappings`)
    return { success: true, data }
    
  } catch (error) {
    console.error('[OwnershipMappings] Bulk import error:', error)
    return { success: false, error }
  }
}

/**
 * Validate ownership mapping data
 */
export function validateOwnershipMapping(mapping) {
  const errors = []
  
  if (!mapping.brand_name || mapping.brand_name.trim().length === 0) {
    errors.push('Brand name is required')
  }
  
  if (!mapping.ultimate_owner_name || mapping.ultimate_owner_name.trim().length === 0) {
    errors.push('Ultimate owner name is required')
  }
  
  if (!mapping.ultimate_owner_country || mapping.ultimate_owner_country.trim().length === 0) {
    errors.push('Ultimate owner country is required')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Convert ownership mapping to result format
 */
export function mappingToResult(mapping) {
  if (!mapping) return null
  
  return {
    financial_beneficiary: mapping.ultimate_owner_name,
    beneficiary_country: mapping.ultimate_owner_country,
    beneficiary_flag: mapping.ultimate_owner_flag || '🏳️',
    ownership_structure_type: 'Subsidiary', // Default for mapped brands
    confidence_score: 95, // High confidence for static mappings
    ownership_flow: [
      mapping.brand_name,
      ...(mapping.regional_entity ? [mapping.regional_entity] : []),
      ...(mapping.intermediate_entity ? [mapping.intermediate_entity] : []),
      mapping.ultimate_owner_name
    ].filter(Boolean),
    sources: ['Static ownership mapping'],
    reasoning: `Brand "${mapping.brand_name}" is mapped to "${mapping.ultimate_owner_name}" (${mapping.ultimate_owner_country}). ${mapping.notes || ''}`,
    web_research_used: false,
    web_sources_count: 0,
    query_analysis_used: false,
    result_type: 'static_mapping',
    mapping_id: mapping.id
  }
} 
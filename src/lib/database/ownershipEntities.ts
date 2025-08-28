import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Map entity type to normalized relationship_type
 * Converts UI-friendly entity types to database relationship types
 */
/**
 * Known relationship types that are verified and have UI mappings
 */
const KNOWN_RELATIONSHIP_TYPES = new Set([
  'brand',
  'ultimate_owner',
  'parent_company',
  'subsidiary',
  'licensed_manufacturer',
  'distributor',
  'regional_entity',
  'joint_venture_partner',
  'franchise_holder',
  'brand_licensee'
]);

/**
 * Map entity type to normalized relationship_type
 * Converts UI-friendly entity types to database relationship types
 * Returns the raw type for storage, with verification status
 */
function mapEntityTypeToRelationshipType(entityType: string): { 
  relationship_type: string; 
  raw_relationship_type: string;
  is_verified: boolean;
  normalized_type: string;
} {
  const rawType = entityType?.toLowerCase().trim() || '';
  
  // Map common entity types to relationship types
  let normalizedType = 'unknown';
  
  if (rawType.includes('brand')) {
    normalizedType = 'brand';
  } else if (rawType.includes('ultimate owner') || rawType.includes('ultimate_owner')) {
    normalizedType = 'ultimate_owner';
  } else if (rawType.includes('licensed manufacturer') || rawType.includes('licensed_manufacturer')) {
    normalizedType = 'licensed_manufacturer';
  } else if (rawType.includes('parent company') || rawType.includes('parent_company')) {
    normalizedType = 'parent_company';
  } else if (rawType.includes('subsidiary')) {
    normalizedType = 'subsidiary';
  } else if (rawType.includes('distributor')) {
    normalizedType = 'distributor';
  } else if (rawType.includes('regional entity') || rawType.includes('regional_entity')) {
    normalizedType = 'regional_entity';
  } else if (rawType.includes('joint venture') || rawType.includes('joint_venture')) {
    normalizedType = 'joint_venture_partner';
  } else if (rawType.includes('franchise')) {
    normalizedType = 'franchise_holder';
  } else if (rawType.includes('licensee')) {
    normalizedType = 'brand_licensee';
  }
  
  // Check if the normalized type is in our known list
  const isVerified = KNOWN_RELATIONSHIP_TYPES.has(normalizedType);
  
  return {
    relationship_type: normalizedType, // Store the normalized value
    raw_relationship_type: rawType, // Store the raw value
    is_verified: isVerified,
    normalized_type: normalizedType
  };
}

export interface OwnershipEntityData {
  brand: string;
  product_name?: string;
  company_name: string;
  confidence_score?: number;
  sources?: any[];
  user_id?: string | null;
  relationship_type?: string;
  raw_relationship_type?: string;
  parent_entity_id?: string | null;
  is_verified?: boolean;
}

/**
 * Insert an ownership entity into the ownership_entities table
 * Handles duplicates gracefully and includes proper error handling
 */
export async function insertOwnershipEntity(
  supabase: SupabaseClient,
  entityData: OwnershipEntityData
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    console.log('🔍 [OwnershipEntities] Attempting to insert entity:', {
      brand: entityData.brand,
      product_name: entityData.product_name,
      company_name: entityData.company_name,
      confidence_score: entityData.confidence_score,
      relationship_type: entityData.relationship_type,
      parent_entity_id: entityData.parent_entity_id
    });

    // Normalize the data
    const normalizedData = {
      brand: entityData.brand?.toLowerCase().trim() || '',
      product_name: entityData.product_name?.toLowerCase().trim() || null,
      company_name: entityData.company_name?.toLowerCase().trim() || '',
      confidence_score: entityData.confidence_score || null,
      sources: entityData.sources || [],
      user_id: entityData.user_id || null,
      relationship_type: entityData.relationship_type || 'unknown',
      raw_relationship_type: entityData.raw_relationship_type || entityData.relationship_type || 'unknown',
      parent_entity_id: entityData.parent_entity_id || null,
      is_verified: entityData.is_verified ?? false,
      updated_at: new Date().toISOString()
    };

    console.log('📝 [OwnershipEntities] Normalized data:', normalizedData);

    // Validate required fields
    if (!normalizedData.brand || !normalizedData.company_name) {
      console.warn('⚠️ [OwnershipEntities] Skipping insert - missing required fields:', {
        brand: normalizedData.brand,
        company_name: normalizedData.company_name
      });
      return { success: false, error: 'Missing required fields' };
    }

    // Skip if company_name is 'Unknown' or empty
    if (normalizedData.company_name === 'unknown' || normalizedData.company_name === '') {
      console.log('ℹ️ [OwnershipEntities] Skipping "Unknown" company:', normalizedData.company_name);
      return { success: true }; // Not an error, just skip
    }

    console.log('💾 [OwnershipEntities] Executing insert with data:', normalizedData);

    // Use simple insert - handle duplicates at application level
    const { data, error } = await supabase
      .from('ownership_entities')
      .insert(normalizedData)
      .select();

    if (error) {
      console.error('❌ [OwnershipEntities] Insert error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return { success: false, error: error.message };
    }

    console.log('✅ [OwnershipEntities] Successfully inserted entity:', {
      brand: normalizedData.brand,
      product_name: normalizedData.product_name,
      company_name: normalizedData.company_name,
      relationship_type: normalizedData.relationship_type,
      parent_entity_id: normalizedData.parent_entity_id,
      returnedData: data
    });

    if (!data || data.length === 0) {
      console.warn('⚠️ [OwnershipEntities] No data returned from insert - this might indicate an issue');
    }

    return { success: true, data: data?.[0] };

  } catch (error) {
    console.error('❌ [OwnershipEntities] Unexpected error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Insert multiple ownership entities from an ownership_flow array
 * Processes each entity and logs results
 */
export async function insertOwnershipChain(
  supabase: SupabaseClient,
  brand: string,
  productName: string,
  ownershipFlow: any[],
  ownershipResult: any
): Promise<{ success: boolean; inserted: number; errors: number }> {
  console.log('🚀 [OwnershipEntities] insertOwnershipChain called with:', {
    brand,
    productName,
    ownershipFlowLength: ownershipFlow?.length || 0,
    ownershipFlowType: typeof ownershipFlow,
    isArray: Array.isArray(ownershipFlow)
  });
  
  console.log('🔍 [OwnershipEntities] Ownership flow content:', JSON.stringify(ownershipFlow, null, 2));

  if (!ownershipFlow || !Array.isArray(ownershipFlow) || ownershipFlow.length === 0) {
    console.log('ℹ️ [OwnershipEntities] No ownership_flow to process');
    return { success: true, inserted: 0, errors: 0 };
  }

  console.log('💾 [OwnershipEntities] Processing ownership chain:', {
    brand,
    productName,
    flowLength: ownershipFlow.length,
    flowContent: ownershipFlow
  });

  let inserted = 0;
  let errors = 0;

  // Get user_id for RLS compliance
  let user_id: string | null = null;
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.warn('⚠️ [OwnershipEntities] Could not get user_id:', authError.message);
    } else {
      user_id = user?.id || null;
      console.log('👤 [OwnershipEntities] User ID for RLS:', user_id);
    }
  } catch (error) {
    console.warn('⚠️ [OwnershipEntities] Auth error, proceeding without user_id:', error);
  }

  // Process each entity in the ownership flow with relationship types and parent linking
  // Track inserted entities to avoid duplicates and maintain proper parent-child relationships
  const insertedEntities = new Map<string, string>(); // company_name -> entity_id
  let previousEntityId: string | null = null;
  
  for (let i = 0; i < ownershipFlow.length; i++) {
    const entity = ownershipFlow[i];
    console.log(`🔍 [OwnershipEntities] Processing entity ${i + 1}/${ownershipFlow.length}:`, entity);
    
    const companyName = typeof entity === 'string' ? entity : entity.name;
    const entityType = typeof entity === 'string' ? 'unknown' : entity.type || 'unknown';
    
    if (!companyName || companyName === 'Unknown') {
      console.log('ℹ️ [OwnershipEntities] Skipping invalid entity:', entity);
      continue;
    }

    // Check if we've already inserted this company in this chain
    const normalizedCompanyName = companyName.toLowerCase().trim();
    if (insertedEntities.has(normalizedCompanyName)) {
      console.log(`ℹ️ [OwnershipEntities] Skipping duplicate company: ${normalizedCompanyName}`);
      // Use the existing entity's ID as the parent for the next entity
      previousEntityId = insertedEntities.get(normalizedCompanyName)!;
      continue;
    }

    // Determine relationship type from entity type with flexible mapping
    const relationshipMapping = mapEntityTypeToRelationshipType(entityType);
    
    console.log(`🔄 [OwnershipEntities] Entity ${i + 1} relationship mapping:`, {
      entityType,
      rawRelationshipType: relationshipMapping.relationship_type,
      isVerified: relationshipMapping.is_verified,
      normalizedType: relationshipMapping.normalized_type,
      previousEntityId
    });

    const entityData: OwnershipEntityData = {
      brand,
      product_name: productName,
      company_name: companyName,
      confidence_score: ownershipResult.confidence_score,
      sources: ownershipResult.sources || [],
      user_id,
      relationship_type: relationshipMapping.relationship_type,
      raw_relationship_type: relationshipMapping.raw_relationship_type,
      is_verified: relationshipMapping.is_verified,
      parent_entity_id: previousEntityId
    };

    console.log('📝 [OwnershipEntities] Calling insertOwnershipEntity with:', {
      ...entityData,
      relationship_type: relationshipMapping.relationship_type,
      raw_relationship_type: relationshipMapping.raw_relationship_type,
      is_verified: relationshipMapping.is_verified,
      parent_entity_id: previousEntityId
    });
    
    console.log('🔍 [OwnershipEntities] Final payload details:', {
      brand: entityData.brand,
      company_name: entityData.company_name,
      relationship_type: entityData.relationship_type,
      raw_relationship_type: entityData.raw_relationship_type,
      is_verified: entityData.is_verified,
      parent_entity_id: entityData.parent_entity_id
    });
    
    const result = await insertOwnershipEntity(supabase, entityData);
    
    if (result.success) {
      inserted++;
      // Store the inserted entity's ID for the next entity's parent reference
      if (result.data?.id) {
        const entityId = result.data.id;
        previousEntityId = entityId;
        insertedEntities.set(normalizedCompanyName, entityId);
        console.log(`✅ [OwnershipEntities] Entity ${i + 1} inserted successfully with ID: ${entityId}`);
        console.log(`📊 [OwnershipEntities] Updated entity tracking:`, {
          totalInserted: insertedEntities.size,
          currentChain: Array.from(insertedEntities.entries()).map(([name, id]) => ({ name, id }))
        });
      } else {
        console.log(`✅ [OwnershipEntities] Entity ${i + 1} inserted successfully (no ID returned)`);
      }
    } else {
      errors++;
      console.warn(`❌ [OwnershipEntities] Entity ${i + 1} failed to insert:`, {
        company_name: companyName,
        relationship_type: relationshipMapping.relationship_type,
        error: result.error
      });
    }
  }

      console.log('📊 [OwnershipEntities] Chain processing complete:', {
      total: ownershipFlow.length,
      inserted,
      errors
    });

    if (inserted === 0) {
      console.warn('⚠️ [OwnershipEntities] No entities were inserted - this might indicate an issue');
    }

    return { 
      success: errors === 0, 
      inserted, 
      errors 
    };
}

/**
 * Look up cached ownership data by company name in ownership_entities
 * Returns the full ownership chain if found, or grouped results if multiple matches
 */
export async function lookupByCompanyName(
  supabase: SupabaseClient,
  searchTerm: string,
  productName?: string
): Promise<{ success: boolean; data?: any; ambiguousResults?: any[]; error?: string; validation?: any }> {
  try {
    const normalizedSearchTerm = searchTerm?.toLowerCase().trim();
    const normalizedProductName = productName?.toLowerCase().trim();
    
    console.log('🔍 [OwnershipEntities] Enhanced lookup by company name:', {
      searchTerm: normalizedSearchTerm,
      productName: normalizedProductName,
      timestamp: new Date().toISOString()
    });

    if (!normalizedSearchTerm) {
      console.log('ℹ️ [OwnershipEntities] No search term provided');
      return { success: false, error: 'No search term provided' };
    }

    // STAGE 1: Query ownership_entities for company name match with enhanced safeguards
    console.log('🛡️ [OwnershipEntities] Stage 1: Querying with brand boundary enforcement...');
    
    let query = supabase
      .from('ownership_entities')
      .select(`
        brand,
        product_name,
        company_name,
        confidence_score,
        sources,
        relationship_type,
        parent_entity_id,
        is_verified,
        created_at
      `)
      .eq('company_name', normalizedSearchTerm);

    // If product name is provided, filter by it for strict boundary enforcement
    if (normalizedProductName) {
      query = query.eq('product_name', normalizedProductName);
      console.log('🛡️ [OwnershipEntities] Applied product name filter for boundary enforcement:', normalizedProductName);
    }

    const { data: ownershipEntities, error } = await query;

    if (error) {
      console.error('❌ [OwnershipEntities] Lookup error:', error);
      return { success: false, error: error.message };
    }

    if (!ownershipEntities || ownershipEntities.length === 0) {
      console.log('ℹ️ [OwnershipEntities] No matches found for company name:', normalizedSearchTerm);
      return { success: false, error: 'No matches found' };
    }

    console.log('✅ [OwnershipEntities] Found matches:', ownershipEntities.length);

    // STAGE 2: Group by brand/product to identify unique combinations with enhanced validation
    console.log('🛡️ [OwnershipEntities] Stage 2: Grouping with chain integrity validation...');
    
    const brandProductGroups = new Map();
    ownershipEntities.forEach(entity => {
      const key = `${entity.brand}:${entity.product_name}`;
      if (!brandProductGroups.has(key)) {
        brandProductGroups.set(key, {
          brand: entity.brand,
          product_name: entity.product_name,
          company_name: entity.company_name,
          matchCount: 1
        });
      } else {
        brandProductGroups.get(key).matchCount++;
      }
    });

    const uniqueBrandProducts = Array.from(brandProductGroups.values());
    console.log('📊 [OwnershipEntities] Unique brand/product combinations:', uniqueBrandProducts.length);

    // STAGE 3: Cross-brand contamination prevention
    console.log('🛡️ [OwnershipEntities] Stage 3: Cross-brand contamination prevention...');
    
    // If we have a specific product context, filter out unrelated brands
    if (normalizedProductName) {
      const filteredBrandProducts = uniqueBrandProducts.filter(item => 
        item.product_name === normalizedProductName
      );
      
      if (filteredBrandProducts.length === 0) {
        console.log('🛡️ [OwnershipEntities] Cross-brand contamination prevented: No matches for specific product context');
        return { success: false, error: 'No matches found for specific product context' };
      }
      
      console.log('🛡️ [OwnershipEntities] Cross-brand contamination prevented: Filtered to', filteredBrandProducts.length, 'valid matches');
      uniqueBrandProducts.splice(0, uniqueBrandProducts.length, ...filteredBrandProducts);
    }

    // If multiple unique brand/product combinations, return grouped results with enhanced context
    if (uniqueBrandProducts.length > 1) {
      console.log('🔄 [OwnershipEntities] Multiple brand/product matches found, returning grouped results with safeguards');
      
      // Get product data for all unique combinations with enhanced validation
      const productPromises = uniqueBrandProducts.map(async (item) => {
        console.log('🔍 [OwnershipEntities] Retrieving product data for:', item);
        
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('financial_beneficiary, beneficiary_country, confidence_score, ownership_flow')
          .eq('brand', item.brand)
          .eq('product_name', item.product_name)
          .limit(1);

        if (productError || !productData || productData.length === 0) {
          console.log('ℹ️ [OwnershipEntities] No product data found, reconstructing from ownership_entities...');
          
          // Reconstruct ownership flow from ownership_entities
          let chainResult = await fetchOwnershipChainRecursive(supabase, item.brand, item.product_name);
          
          if (!chainResult.success) {
            console.log('🔄 [OwnershipEntities] Recursive CTE failed, using fallback chain retrieval...');
            chainResult = await fetchOwnershipChainFallback(supabase, item.brand, item.product_name);
          }

          if (!chainResult.success || !chainResult.chain) {
            console.warn('⚠️ [OwnershipEntities] Could not reconstruct chain for:', item);
            return null;
          }

          // Reconstruct the ownership_flow with flexible relationship types
          const ownershipFlow = chainResult.chain.map((entity, index) => {
            const isLast = index === chainResult.chain.length - 1;
            const isFirst = index === 0;
            
            // Determine normalized type for UI display
            let normalizedType = entity.relationship_type || 'unknown';
            if (!entity.is_verified && entity.relationship_type && entity.relationship_type !== 'unknown') {
              normalizedType = 'other'; // Mark unverified types as "other"
            }
            
            return {
              name: entity.company_name,
              type: isFirst ? 'brand' : isLast ? 'ultimate_owner' : 'subsidiary',
              relationship_type: normalizedType, // Normalized for UI
              raw_relationship_type: entity.relationship_type || 'unknown', // Raw value from DB
              is_verified: entity.is_verified ?? false,
              parent_entity_id: entity.parent_entity_id,
              confidence_score: entity.confidence_score || 0,
              sources: entity.sources || [],
              country: 'Unknown', // We don't store country in ownership_entities yet
              flag: null, // Will be populated by UI
              ultimate: isLast,
              source: 'cached_chain',
              confidence: entity.confidence_score || 0,
              original_brand: item.brand,
              original_product: item.product_name
            };
          });

          // Validate chain integrity for this brand/product combination
          const chainIntegrity = await validateChainIntegrity(supabase, item.brand, item.product_name);
          
          // Determine ultimate owner from the reconstructed chain
          const ultimateOwner = ownershipFlow.length > 0 ? ownershipFlow[ownershipFlow.length - 1].name : 'Unknown';
          
          return {
            brand: item.brand,
            product_name: item.product_name,
            financial_beneficiary: ultimateOwner,
            beneficiary_country: 'Unknown',
            confidence_score: 90, // Default confidence for reconstructed chains
            ownership_flow: ownershipFlow,
            chain_integrity: chainIntegrity,
            match_count: item.matchCount
          };
        }

        // Validate chain integrity for this brand/product combination
        const chainIntegrity = await validateChainIntegrity(supabase, item.brand, item.product_name);
        
        return {
          brand: item.brand,
          product_name: item.product_name,
          financial_beneficiary: productData[0].financial_beneficiary,
          beneficiary_country: productData[0].beneficiary_country,
          confidence_score: productData[0].confidence_score,
          ownership_flow: productData[0].ownership_flow,
          chain_integrity: chainIntegrity,
          match_count: item.matchCount
        };
      });

      const productResults = await Promise.all(productPromises);
      const validResults = productResults.filter(result => result !== null);

      console.log('✅ [OwnershipEntities] Returning grouped results with safeguards:', validResults.length);
      return { 
        success: true, 
        ambiguousResults: validResults,
        validation: {
          cross_contamination: false,
          chain_integrity: validResults.every(r => r.chain_integrity),
          data_freshness: new Date().toISOString()
        }
      };
    }

    // STAGE 4: Single result with enhanced chain reconstruction
    const firstMatch = uniqueBrandProducts[0];
    const { brand, product_name } = firstMatch;

    console.log('✅ [OwnershipEntities] Single match found, retrieving full chain with integrity validation for:', { brand, product_name });

    // Validate chain integrity before proceeding
    const chainIntegrity = await validateChainIntegrity(supabase, brand, product_name);
    if (!chainIntegrity) {
      console.warn('⚠️ [OwnershipEntities] Chain integrity validation failed for:', { brand, product_name });
      return { success: false, error: 'Chain integrity validation failed' };
    }

    // Get the complete ownership data from products table
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('brand', brand)
      .eq('product_name', product_name)
      .limit(1);

    if (productError) {
      console.error('❌ [OwnershipEntities] Product lookup error:', productError);
      return { success: false, error: productError.message };
    }

    if (!productData || productData.length === 0) {
      console.log('ℹ️ [OwnershipEntities] No product data found, reconstructing from ownership_entities...');
      
      // Reconstruct ownership flow from ownership_entities
      let chainResult = await fetchOwnershipChainRecursive(supabase, brand, product_name);
      
      if (!chainResult.success) {
        console.log('🔄 [OwnershipEntities] Recursive CTE failed, using fallback chain retrieval...');
        chainResult = await fetchOwnershipChainFallback(supabase, brand, product_name);
      }

      if (!chainResult.success || !chainResult.chain) {
        console.error('❌ [OwnershipEntities] Chain reconstruction failed:', chainResult.error);
        return { success: false, error: chainResult.error || 'Chain reconstruction failed' };
      }

      const chainEntities = chainResult.chain;
      console.log('✅ [OwnershipEntities] Graph-based chain reconstruction successful:', {
        chainLength: chainEntities.length,
        entities: chainEntities.map(e => ({ name: e.company_name, type: e.relationship_type }))
      });

      // Reconstruct the ownership_flow with UI-compatible structure including flexible relationship types
      const ownershipFlow = chainEntities.map((entity, index) => {
        const isLast = index === chainEntities.length - 1;
        const isFirst = index === 0;
        
        // Determine normalized type for UI display
        let normalizedType = entity.relationship_type || 'unknown';
        if (!entity.is_verified && entity.relationship_type && entity.relationship_type !== 'unknown') {
          normalizedType = 'other'; // Mark unverified types as "other"
        }
        
        return {
          name: entity.company_name,
          type: isFirst ? 'brand' : isLast ? 'ultimate_owner' : 'subsidiary',
          relationship_type: normalizedType, // Normalized for UI
          raw_relationship_type: entity.relationship_type || 'unknown', // Raw value from DB
          is_verified: entity.is_verified ?? false,
          parent_entity_id: entity.parent_entity_id,
          confidence_score: entity.confidence_score || 0,
          sources: entity.sources || [],
          country: 'Unknown', // We don't store country in ownership_entities yet
          flag: null, // Will be populated by UI
          ultimate: isLast,
          source: 'cached_chain',
          confidence: entity.confidence_score || 0,
          original_brand: brand,
          original_product: product_name
        };
      });

      // Determine ultimate owner from the reconstructed chain
      const ultimateOwner = ownershipFlow.length > 0 ? ownershipFlow[ownershipFlow.length - 1].name : 'Unknown';
      
      // Create enriched product data from reconstructed chain
      const enrichedProduct = {
        brand,
        product_name,
        financial_beneficiary: ultimateOwner,
        beneficiary_country: 'Unknown',
        beneficiary_flag: null,
        confidence_score: 90, // Default confidence for reconstructed chains
        ownership_structure_type: 'Reconstructed',
        ownership_flow: ownershipFlow,
        sources: [],
        reasoning: 'Reconstructed from ownership_entities table',
        agent_results: {},
        result_type: 'reconstructed_chain',
        cache_hit: true,
        hit_type: 'company_name_safe',
        validation: {
          chain_integrity: true,
          cross_contamination: false,
          data_freshness: new Date().toISOString()
        }
      };

      console.log('✅ [OwnershipEntities] Successfully reconstructed ownership chain with UI compatibility:', {
        brand: enrichedProduct.brand,
        product_name: enrichedProduct.product_name,
        chainLength: ownershipFlow.length,
        chainIntegrity: true,
        crossContamination: false
      });

      return { success: true, data: enrichedProduct };
    }

    const product = productData[0];
    console.log('✅ [OwnershipEntities] Retrieved product data:', {
      brand: product.brand,
      product_name: product.product_name,
      beneficiary: product.financial_beneficiary
    });

    // STAGE 5: Graph-based chain reconstruction with UI compatibility
    console.log('🔄 [OwnershipEntities] Stage 5: Graph-based chain reconstruction for UI compatibility...');
    
    // Try recursive CTE first, fallback to traditional query
    let chainResult = await fetchOwnershipChainRecursive(supabase, brand, product_name);
    
    if (!chainResult.success) {
      console.log('🔄 [OwnershipEntities] Recursive CTE failed, using fallback chain retrieval...');
      chainResult = await fetchOwnershipChainFallback(supabase, brand, product_name);
    }

    if (!chainResult.success || !chainResult.chain) {
      console.error('❌ [OwnershipEntities] Chain reconstruction failed:', chainResult.error);
      return { success: false, error: chainResult.error || 'Chain reconstruction failed' };
    }

    const chainEntities = chainResult.chain;
    console.log('✅ [OwnershipEntities] Graph-based chain reconstruction successful:', {
      chainLength: chainEntities.length,
      entities: chainEntities.map(e => ({ name: e.company_name, type: e.relationship_type }))
    });

    // Reconstruct the ownership_flow with UI-compatible structure including flexible relationship types
    const ownershipFlow = chainEntities.map((entity, index) => {
      const isLast = index === chainEntities.length - 1;
      const isFirst = index === 0;
      
      // Determine normalized type for UI display
      let normalizedType = entity.relationship_type || 'unknown';
      if (!entity.is_verified && entity.relationship_type && entity.relationship_type !== 'unknown') {
        normalizedType = 'other'; // Mark unverified types as "other"
      }
      
      return {
        name: entity.company_name,
        type: isFirst ? 'brand' : isLast ? 'ultimate_owner' : 'subsidiary',
        relationship_type: normalizedType, // Normalized for UI
        raw_relationship_type: entity.relationship_type || 'unknown', // Raw value from DB
        is_verified: entity.is_verified ?? false,
        parent_entity_id: entity.parent_entity_id,
        confidence_score: entity.confidence_score || 0,
        sources: entity.sources || [],
        country: 'Unknown', // We don't store country in ownership_entities yet
        flag: null, // Will be populated by UI
        ultimate: isLast,
        source: 'cached_chain',
        confidence: entity.confidence_score || 0,
        original_brand: brand,
        original_product: product_name
      };
    });

    // Update the product data with the reconstructed ownership_flow
    const enrichedProduct = {
      ...product,
      ownership_flow: ownershipFlow,
      cache_hit: true,
      hit_type: 'company_name_safe',
      validation: {
        chain_integrity: true,
        cross_contamination: false,
        data_freshness: new Date().toISOString()
      }
    };

    console.log('✅ [OwnershipEntities] Successfully reconstructed ownership chain with UI compatibility:', {
      brand: enrichedProduct.brand,
      product_name: enrichedProduct.product_name,
      chainLength: ownershipFlow.length,
      chainIntegrity: true,
      crossContamination: false
    });

          return { success: true, data: enrichedProduct };

  } catch (error) {
    console.error('❌ [OwnershipEntities] Unexpected lookup error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Graph-based retrieval using recursive CTEs to fetch complete ownership chains
 * Traverses parent_entity_id relationships to reconstruct full chains
 */
export async function fetchOwnershipChainRecursive(
  supabase: SupabaseClient,
  brand: string,
  productName: string
): Promise<{ success: boolean; chain?: any[]; error?: string }> {
  try {
    console.log('🔄 [OwnershipEntities] Graph-based retrieval for:', { brand, productName });
    
    // First, try to get all entities for this brand/product to check for ambiguous ownership
    const { data: allEntities, error: allEntitiesError } = await supabase
      .from('ownership_entities')
      .select('*')
      .eq('brand', brand)
      .eq('product_name', productName);

    if (allEntitiesError) {
      console.error('❌ [OwnershipEntities] All entities lookup error:', allEntitiesError);
      return { success: false, error: allEntitiesError.message };
    }

    // If we have multiple entities with different relationship types, it's ambiguous ownership
    const relationshipTypes = new Set(allEntities?.map(e => e.relationship_type) || []);
    const hasAmbiguousOwnership = allEntities && allEntities.length > 1 && relationshipTypes.size > 1;

    if (hasAmbiguousOwnership) {
      console.log('🔍 [OwnershipEntities] Detected ambiguous ownership, returning all entities');
      
      // Sort entities by relationship type priority
      const sortedEntities = allEntities.sort((a, b) => {
        const priorityOrder = {
          'brand': 1,
          'ultimate_owner': 2,
          'parent': 3,
          'subsidiary': 4,
          'licensed_manufacturer': 5,
          'joint_venture_partner': 6,
          'licensed_owner': 7,
          'minority_owner': 8,
          'former_owner': 9,
          'original_owner': 10
        };
        
        const aPriority = priorityOrder[a.relationship_type] || 11;
        const bPriority = priorityOrder[b.relationship_type] || 11;
        
        return aPriority - bPriority;
      });

      console.log('✅ [OwnershipEntities] Ambiguous ownership retrieval successful:', {
        chainLength: sortedEntities.length,
        entities: sortedEntities.map(e => ({ name: e.company_name, type: e.relationship_type }))
      });

      return { success: true, chain: sortedEntities };
    }

    // Use recursive CTE to traverse the ownership chain for simple cases
    // Start from the brand entity and follow parent_entity_id relationships
    const { data: chainEntities, error } = await supabase
      .rpc('get_ownership_chain_recursive', {
        p_brand: brand,
        p_product_name: productName
      });

    if (error) {
      console.error('❌ [OwnershipEntities] Recursive chain lookup error:', error);
      return { success: false, error: error.message };
    }

    if (!chainEntities || chainEntities.length === 0) {
      console.log('ℹ️ [OwnershipEntities] No chain found for:', { brand, productName });
      return { success: false, error: 'No ownership chain found' };
    }

    console.log('✅ [OwnershipEntities] Recursive chain retrieval successful:', {
      chainLength: chainEntities.length,
      entities: chainEntities.map(e => ({ name: e.company_name, type: e.relationship_type }))
    });

    return { success: true, chain: chainEntities };

  } catch (error) {
    console.error('❌ [OwnershipEntities] Recursive chain retrieval error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Fallback chain retrieval using traditional query (for when recursive CTE is not available)
 * Orders by creation time and reconstructs chain based on parent_entity_id relationships
 */
async function fetchOwnershipChainFallback(
  supabase: SupabaseClient,
  brand: string,
  productName: string
): Promise<{ success: boolean; chain?: any[]; error?: string }> {
  try {
    console.log('🔄 [OwnershipEntities] Fallback chain retrieval for:', { brand, productName });
    
    // Get all entities for this brand/product
    const { data: allEntities, error } = await supabase
      .from('ownership_entities')
      .select('*')
      .eq('brand', brand)
      .eq('product_name', productName)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ [OwnershipEntities] Fallback chain lookup error:', error);
      return { success: false, error: error.message };
    }

    if (!allEntities || allEntities.length === 0) {
      console.log('ℹ️ [OwnershipEntities] No entities found for:', { brand, productName });
      return { success: false, error: 'No ownership entities found' };
    }

    // Reconstruct chain by following parent_entity_id relationships
    const chainMap = new Map();
    const rootEntities = [];
    
    // Build a map of entities by ID
    allEntities.forEach(entity => {
      chainMap.set(entity.id, entity);
    });

    // Find root entities (those with no parent or parent not in this chain)
    allEntities.forEach(entity => {
      if (!entity.parent_entity_id || !chainMap.has(entity.parent_entity_id)) {
        rootEntities.push(entity);
      }
    });

    // If no clear root, use the first entity (brand)
    const startEntity = rootEntities.length > 0 ? rootEntities[0] : allEntities[0];
    
    // Reconstruct chain by following parent relationships
    const reconstructedChain = [];
    let currentEntity = startEntity;
    
    while (currentEntity) {
      reconstructedChain.push(currentEntity);
      
      // Find next entity in chain (child of current entity)
      const nextEntity = allEntities.find(entity => 
        entity.parent_entity_id === currentEntity.id
      );
      
      currentEntity = nextEntity;
    }

    console.log('✅ [OwnershipEntities] Fallback chain reconstruction successful:', {
      chainLength: reconstructedChain.length,
      entities: reconstructedChain.map(e => ({ name: e.company_name, type: e.relationship_type }))
    });

    return { success: true, chain: reconstructedChain };

  } catch (error) {
    console.error('❌ [OwnershipEntities] Fallback chain retrieval error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Validate chain integrity for a specific brand/product combination
 * Ensures that the ownership chain is complete and consistent
 */
async function validateChainIntegrity(
  supabase: SupabaseClient,
  brand: string,
  productName: string
): Promise<boolean> {
  try {
    console.log('🛡️ [OwnershipEntities] Validating chain integrity for:', { brand, productName });
    
    // Check if we have at least 2 entities in the chain (brand + at least one parent)
    const { data: chainEntities, error } = await supabase
      .from('ownership_entities')
      .select('company_name')
      .eq('brand', brand)
      .eq('product_name', productName);

    if (error) {
      console.error('❌ [OwnershipEntities] Chain integrity validation error:', error);
      return false;
    }

    if (!chainEntities || chainEntities.length < 2) {
      console.warn('⚠️ [OwnershipEntities] Chain integrity failed: Insufficient entities:', chainEntities?.length);
      return false;
    }

    // Check if the brand itself is in the chain
    const brandInChain = chainEntities.some(entity => 
      entity.company_name.toLowerCase() === brand.toLowerCase()
    );

    if (!brandInChain) {
      console.warn('⚠️ [OwnershipEntities] Chain integrity failed: Brand not found in chain');
      return false;
    }

    console.log('✅ [OwnershipEntities] Chain integrity validation passed');
    return true;

  } catch (error) {
    console.error('❌ [OwnershipEntities] Chain integrity validation error:', error);
    return false;
  }
} 
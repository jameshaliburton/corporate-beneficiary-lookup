/**
 * Entity Canonicalization System
 * 
 * Provides consistent entity name mapping for cache key generation
 * to prevent cache misses due to minor variations in entity names.
 */

// Canonical entity name mappings
const CANONICAL_ENTITY_MAP: Record<string, string> = {
  // Clorox variations
  'clorox': 'The Clorox Company',
  'clorox company': 'The Clorox Company',
  'the clorox company': 'The Clorox Company',
  
  // Unilever variations
  'unilever': 'Unilever',
  'unilever usa inc': 'Unilever',
  'unilever usa inc.': 'Unilever',
  'unilever plc': 'Unilever',
  
  // Procter & Gamble variations
  'procter and gamble': 'The Procter & Gamble Company',
  'procter & gamble': 'The Procter & Gamble Company',
  'p&g': 'The Procter & Gamble Company',
  'the procter & gamble company': 'The Procter & Gamble Company',
  
  // Warby Parker variations
  'warby parker inc': 'Warby Parker, Inc.',
  'warby parker inc.': 'Warby Parker, Inc.',
  'warby parker, inc': 'Warby Parker, Inc.',
  'warby parker, inc.': 'Warby Parker, Inc.',
  'warby parker': 'Warby Parker, Inc.',
  
  // Samsung variations
  'samsung electronics co., ltd': 'Samsung Electronics Co., Ltd.',
  'samsung electronics co ltd': 'Samsung Electronics Co., Ltd.',
  'samsung electronics': 'Samsung Electronics Co., Ltd.',
  'samsung': 'Samsung Electronics Co., Ltd.',
  
  // L'Oréal variations
  'l\'oréal s.a.': 'L\'Oréal S.A.',
  'l\'oréal sa': 'L\'Oréal S.A.',
  'l\'oréal': 'L\'Oréal S.A.',
  'loreal': 'L\'Oréal S.A.',
  
  // Nestlé variations
  'nestlé s.a.': 'Nestlé S.A.',
  'nestle sa': 'Nestlé S.A.',
  'nestle': 'Nestlé S.A.',
  'nestlé': 'Nestlé S.A.',
  
  // Oatly variations
  'oatly ab': 'Oatly AB',
  'oatly': 'Oatly AB',
  
  // Chobani variations
  'chobani, llc': 'Chobani, LLC',
  'chobani llc': 'Chobani, LLC',
  'chobani': 'Chobani, LLC',
  
  // Dr. Bronner's variations
  'dr. bronner\'s magic soaps': 'Dr. Bronner\'s Magic Soaps',
  'dr bronner\'s magic soaps': 'Dr. Bronner\'s Magic Soaps',
  'dr. bronner\'s': 'Dr. Bronner\'s Magic Soaps',
  'dr bronner\'s': 'Dr. Bronner\'s Magic Soaps',
};

// Sub-brand to parent company mappings
const SUB_BRAND_MAP: Record<string, string> = {
  // Unilever sub-brands
  'ben & jerry\'s': 'Unilever',
  'ben and jerry\'s': 'Unilever',
  'seventh generation': 'Unilever',
  'dove': 'Unilever',
  'axe': 'Unilever',
  'hellmann\'s': 'Unilever',
  'lipton': 'Unilever',
  'knorr': 'Unilever',
  
  // Procter & Gamble sub-brands
  'tide': 'The Procter & Gamble Company',
  'pampers': 'The Procter & Gamble Company',
  'gillette': 'The Procter & Gamble Company',
  'head & shoulders': 'The Procter & Gamble Company',
  'olay': 'The Procter & Gamble Company',
  'crest': 'The Procter & Gamble Company',
  'bounty': 'The Procter & Gamble Company',
  'charmin': 'The Procter & Gamble Company',
  
  // Clorox sub-brands
  'burt\'s bees': 'The Clorox Company',
  'burt\'s bees products': 'The Clorox Company',
  'glad': 'The Clorox Company',
  'kingsford': 'The Clorox Company',
  'hidden valley': 'The Clorox Company',
  
  // SC Johnson sub-brands
  'method': 'SC Johnson',
  'method products': 'SC Johnson',
  'pledge': 'SC Johnson',
  'windex': 'SC Johnson',
  'scrubbing bubbles': 'SC Johnson',
  
  // Aldi sub-brands
  'trader joe\'s': 'Aldi Nord',
  'trader joes': 'Aldi Nord',
  
  // L'Oréal sub-brands
  'lancôme': 'L\'Oréal S.A.',
  'maybelline': 'L\'Oréal S.A.',
  'garnier': 'L\'Oréal S.A.',
  'kiehl\'s': 'L\'Oréal S.A.',
  'urban decay': 'L\'Oréal S.A.',
  
  // Nestlé sub-brands
  'nescafé': 'Nestlé S.A.',
  'nescafe': 'Nestlé S.A.',
  'kit kat': 'Nestlé S.A.',
  'kitkat': 'Nestlé S.A.',
  'maggi': 'Nestlé S.A.',
  'gerber': 'Nestlé S.A.',
};

/**
 * Canonicalizes an entity name to ensure consistent cache keys
 */
export function canonicalizeEntityName(entityName: string): string {
  if (!entityName || typeof entityName !== 'string') {
    return entityName;
  }
  
  const normalized = entityName.toLowerCase().trim();
  const canonical = CANONICAL_ENTITY_MAP[normalized];
  
  if (canonical) {
    console.log(`[CANONICALIZE] Original: "${entityName}" → Canonical: "${canonical}"`);
    return canonical;
  }
  
  return entityName;
}

/**
 * Resolves a sub-brand to its parent company
 */
export function resolveSubBrandToParent(brandName: string): string | null {
  if (!brandName || typeof brandName !== 'string') {
    return null;
  }
  
  const normalized = brandName.toLowerCase().trim();
  const parent = SUB_BRAND_MAP[normalized];
  
  if (parent) {
    console.log(`[SUBBRAND] Matched sub-brand: "${brandName}" → "${parent}"`);
    return parent;
  }
  
  return null;
}

/**
 * Enhanced entity key creation with canonicalization
 */
export function createCanonicalEntityKey(
  entityName: string, 
  countryCode: string
): string {
  // First canonicalize the entity name
  const canonicalEntity = canonicalizeEntityName(entityName);
  
  // Then create the key using the canonical name
  const normalizedEntity = canonicalEntity.toLowerCase().trim();
  const normalizedCountry = countryCode.toLowerCase().trim();
  
  const entityKey = `${normalizedEntity}|${normalizedCountry}`;
  
  console.log(`[CANONICALIZE] Entity key: "${entityKey}" (from "${entityName}" → "${canonicalEntity}")`);
  
  return entityKey;
}

/**
 * Validates if two entity keys would match after canonicalization
 */
export function validateEntityKeyMatch(
  key1: string, 
  key2: string
): { match: boolean; reason?: string } {
  if (key1 === key2) {
    return { match: true };
  }
  
  // Extract entity names from keys
  const [entity1, country1] = key1.split('|');
  const [entity2, country2] = key2.split('|');
  
  if (country1 !== country2) {
    return { match: false, reason: 'Different countries' };
  }
  
  // Check if canonicalization would make them match
  const canonical1 = canonicalizeEntityName(entity1);
  const canonical2 = canonicalizeEntityName(entity2);
  
  if (canonical1 === canonical2) {
    return { match: true, reason: 'Match after canonicalization' };
  }
  
  return { match: false, reason: 'Different entities even after canonicalization' };
}

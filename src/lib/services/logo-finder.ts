/**
 * LogoFinder Service
 * 
 * Fetches company logos from authoritative sources:
 * 1. Wikidata/Wikipedia API - searches for company and returns logo image
 * 2. Clearbit Logo API - guesses domain from company name
 * 
 * Includes error handling and in-memory caching to avoid repeated lookups.
 */

interface LogoCache {
  [companyName: string]: {
    logoUrl: string | null;
    timestamp: number;
  };
}

// In-memory cache with 24-hour expiration
const logoCache: LogoCache = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Cleans company name for better domain guessing
 */
function cleanCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
    .replace(/^(the|inc|corp|corporation|company|co|llc|limited|ltd)$/g, ''); // Remove common suffixes
}

/**
 * Guesses domain from company name
 */
function guessDomain(companyName: string): string | null {
  const cleanName = cleanCompanyName(companyName);
  
  // Common company domain mappings
  const domainMappings: { [key: string]: string } = {
    'microsoft': 'microsoft.com',
    'apple': 'apple.com',
    'google': 'google.com',
    'amazon': 'amazon.com',
    'facebook': 'meta.com', // Facebook is now Meta
    'meta': 'meta.com',
    'netflix': 'netflix.com',
    'tesla': 'tesla.com',
    'nike': 'nike.com',
    'adidas': 'adidas.com',
    'coca': 'coca-cola.com',
    'cocacola': 'coca-cola.com',
    'pepsi': 'pepsi.com',
    'unilever': 'unilever.com',
    'nestle': 'nestle.com',
    'nestlé': 'nestle.com',
    'procter': 'pg.com',
    'gamble': 'pg.com',
    'johnson': 'jnj.com',
    'newyorktimes': 'nytimes.com',
    'nytimes': 'nytimes.com',
    'washingtonpost': 'washingtonpost.com',
    'wapo': 'washingtonpost.com',
    'wallstreetjournal': 'wsj.com',
    'wsj': 'wsj.com',
    'ford': 'ford.com',
    'general': 'gm.com',
    'motors': 'gm.com',
    'toyota': 'toyota.com',
    'honda': 'honda.com',
    'volkswagen': 'volkswagen.com',
    'bmw': 'bmw.com',
    'mercedes': 'mercedes-benz.com',
    'benz': 'mercedes-benz.com',
    'audi': 'audi.com',
    'volvo': 'volvo.com',
    'ikea': 'ikea.com',
    'walmart': 'walmart.com',
    'target': 'target.com',
    'costco': 'costco.com',
    'home': 'homedepot.com',
    'depot': 'homedepot.com',
    'lowes': 'lowes.com',
    'mcdonalds': 'mcdonalds.com',
    'starbucks': 'starbucks.com',
    'subway': 'subway.com',
    'dominos': 'dominos.com',
    'pizza': 'dominos.com',
    'kfc': 'kfc.com',
    'burger': 'burgerking.com',
    'king': 'burgerking.com',
    'wendys': 'wendys.com',
    'tacobell': 'tacobell.com',
    'chipotle': 'chipotle.com',
    'panera': 'panerabread.com',
    'bread': 'panerabread.com',
    'dunkin': 'dunkindonuts.com',
    'donuts': 'dunkindonuts.com',
    'tim': 'timhortons.com',
    'hortons': 'timhortons.com',
    'peets': 'peets.com',
    'coffee': 'starbucks.com',
  };

  // Check exact mappings first
  if (domainMappings[cleanName]) {
    return domainMappings[cleanName];
  }

  // Try partial matches
  for (const [key, domain] of Object.entries(domainMappings)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return domain;
    }
  }

  // Simple heuristic: if it looks like a domain, use it
  if (cleanName.includes('.') && cleanName.length > 3) {
    return cleanName;
  }

  return null;
}

/**
 * Searches Wikidata for company logo
 */
async function searchWikidata(companyName: string): Promise<string | null> {
  try {
    // Search for the company in Wikidata
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(companyName)}&language=en&type=item&format=json&origin=*`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) return null;
    
    const searchData = await searchResponse.json();
    
    if (!searchData.search || searchData.search.length === 0) {
      return null;
    }

    // Get the first result (most relevant)
    const entityId = searchData.search[0].id;
    
    // Get entity data including logo property (P154)
    const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=claims&format=json&origin=*`;
    
    const entityResponse = await fetch(entityUrl);
    if (!entityResponse.ok) return null;
    
    const entityData = await entityResponse.json();
    const entity = entityData.entities[entityId];
    
    if (!entity || !entity.claims) return null;

    // Look for logo property (P154)
    if (entity.claims.P154 && entity.claims.P154.length > 0) {
      return entity.claims.P154[0].mainsnak.datavalue.value;
    }

    // Look for image property (P18)
    if (entity.claims.P18 && entity.claims.P18.length > 0) {
      const imageName = entity.claims.P18[0].mainsnak.datavalue.value;
      return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageName)}`;
    }

    return null;
  } catch (error) {
    console.warn(`Wikidata search failed for "${companyName}":`, error);
    return null;
  }
}

/**
 * Gets logo from Clearbit Logo API
 */
async function getClearbitLogo(domain: string): Promise<string | null> {
  try {
    const logoUrl = `https://logo.clearbit.com/${domain}`;
    
    // Check if the logo exists by making a HEAD request
    const response = await fetch(logoUrl, { method: 'HEAD' });
    
    if (response.ok) {
      return logoUrl;
    }
    
    return null;
  } catch (error) {
    console.warn(`Clearbit logo fetch failed for "${domain}":`, error);
    return null;
  }
}

/**
 * Finds company logo from authoritative sources
 * 
 * @param companyName - The name of the company to find logo for
 * @returns Promise<string | null> - Logo URL if found, null otherwise
 */
export async function findCompanyLogo(companyName: string): Promise<string | null> {
  // Check cache first
  const cached = logoCache[companyName];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.logoUrl;
  }

  let logoUrl: string | null = null;

  try {
    // Step 1: Try Wikidata/Wikipedia
    logoUrl = await searchWikidata(companyName);
    
    // Step 2: If no Wikidata result, try Clearbit
    if (!logoUrl) {
      const domain = guessDomain(companyName);
      if (domain) {
        logoUrl = await getClearbitLogo(domain);
      }
    }

    // Cache the result (including null results to avoid repeated failed lookups)
    logoCache[companyName] = {
      logoUrl,
      timestamp: Date.now()
    };

    return logoUrl;
  } catch (error) {
    console.error(`Logo finder failed for "${companyName}":`, error);
    
    // Cache null result to avoid repeated failed lookups
    logoCache[companyName] = {
      logoUrl: null,
      timestamp: Date.now()
    };
    
    return null;
  }
}

/**
 * Finds company logo with a strict timeout
 * 
 * @param companyName - The name of the company to find logo for
 * @param timeoutMs - Timeout in milliseconds (default: 1000ms)
 * @returns Promise<string | null> - Logo URL if found within timeout, null otherwise
 */
export async function findCompanyLogoWithTimeout(companyName: string, timeoutMs = 1000): Promise<string | null> {
  return Promise.race([
    findCompanyLogo(companyName),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

/**
 * Clears the logo cache (useful for testing or memory management)
 */
export function clearLogoCache(): void {
  Object.keys(logoCache).forEach(key => delete logoCache[key]);
}

/**
 * Gets cache statistics for debugging
 */
export function getLogoCacheStats(): { size: number; entries: string[] } {
  return {
    size: Object.keys(logoCache).length,
    entries: Object.keys(logoCache)
  };
} 
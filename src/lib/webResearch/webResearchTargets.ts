export interface WebResearchTarget {
  name: string;
  url: string;
  promptTemplate: (brand: string) => string;
  description: string;
}

export interface WebResearchTargets {
  [country: string]: WebResearchTarget;
}

/**
 * Centralized web research targets for country-specific ownership research
 */
export const webResearchTargets: WebResearchTargets = {
  France: {
    name: "INPI RNE (Registre National des Entreprises)",
    url: "https://data.inpi.fr/recherche_avancee/entreprises",
    description: "French National Institute of Industrial Property - National Business Register",
    promptTemplate: (brand: string) => `
      Please search the French company registry INPI (https://data.inpi.fr/recherche_avancee/entreprises) for a company named "${brand}".
      
      Focus on finding:
      1. Full legal name and SIREN number
      2. Registered address and contact information
      3. Company status (active, dissolved, etc.)
      4. Parent company or ultimate owner information
      5. Date of incorporation
      6. Business activity description
      
      If found, provide the complete company profile. If not found, search for similar names or parent companies that might own this brand.
    `
  },
  
  "United Kingdom": {
    name: "Companies House",
    url: "https://find-and-update.company-information.service.gov.uk/",
    description: "UK Companies House - Official company registry",
    promptTemplate: (brand: string) => `
      Please search the UK Companies House registry (https://find-and-update.company-information.service.gov.uk/) for a company named "${brand}".
      
      Focus on finding:
      1. Full legal name and company number
      2. Registered office address
      3. Company status (active, dissolved, etc.)
      4. Parent company or ultimate owner information
      5. Date of incorporation
      6. Nature of business
      7. Directors and shareholders information
      
      If found, provide the complete company profile. If not found, search for similar names or parent companies that might own this brand.
    `
  },
  
  Denmark: {
    name: "CVR (Central Business Register)",
    url: "https://cvrapi.dk/",
    description: "Danish Central Business Register",
    promptTemplate: (brand: string) => `
      Please search the Danish CVR (Central Business Register) at https://cvrapi.dk/ for a company named "${brand}".
      
      Focus on finding:
      1. Full legal name and CVR number
      2. Registered address and contact information
      3. Company status (active, bankrupt, etc.)
      4. Parent company or ultimate owner information
      5. Date of incorporation
      6. Industry classification
      7. Number of employees
      
      If found, provide the complete company profile. If not found, search for similar names or parent companies that might own this brand.
    `
  },
  
  Norway: {
    name: "Brreg (Enhetsregisteret)",
    url: "https://data.brreg.no/enhetsregisteret/",
    description: "Norwegian Business Registry",
    promptTemplate: (brand: string) => `
      Please search the Norwegian Brreg (Business Registry) at https://data.brreg.no/enhetsregisteret/ for a company named "${brand}".
      
      Focus on finding:
      1. Full legal name and organization number
      2. Registered address and contact information
      3. Company status (active, bankrupt, under liquidation, etc.)
      4. Parent company or ultimate owner information
      5. Date of incorporation
      6. Industry classification
      7. Number of employees
      
      If found, provide the complete company profile. If not found, search for similar names or parent companies that might own this brand.
    `
  },
  
  Netherlands: {
    name: "KvK (Kamer van Koophandel)",
    url: "https://www.kvk.nl/",
    description: "Dutch Chamber of Commerce",
    promptTemplate: (brand: string) => `
      Please search the Dutch KvK (Chamber of Commerce) at https://www.kvk.nl/ for a company named "${brand}".
      
      Focus on finding:
      1. Full legal name and KvK number
      2. Registered address and contact information
      3. Company status (active, dissolved, etc.)
      4. Parent company or ultimate owner information
      5. Date of incorporation
      6. Business activity description
      7. Directors information
      
      If found, provide the complete company profile. If not found, search for similar names or parent companies that might own this brand.
    `
  },
  
  Germany: {
    name: "Handelsregister",
    url: "https://www.handelsregister.de/",
    description: "German Commercial Register",
    promptTemplate: (brand: string) => `
      Please search the German Handelsregister (Commercial Register) at https://www.handelsregister.de/ for a company named "${brand}".
      
      Focus on finding:
      1. Full legal name and registration number
      2. Registered address and contact information
      3. Company status (active, dissolved, etc.)
      4. Parent company or ultimate owner information
      5. Date of incorporation
      6. Legal form (GmbH, AG, etc.)
      7. Business purpose
      
      If found, provide the complete company profile. If not found, search for similar names or parent companies that might own this brand.
    `
  },
  
  Sweden: {
    name: "Bolagsverket",
    url: "https://www.bolagsverket.se/",
    description: "Swedish Companies Registration Office",
    promptTemplate: (brand: string) => `
      Please search the Swedish Bolagsverket (Companies Registration Office) at https://www.bolagsverket.se/ for a company named "${brand}".
      
      Focus on finding:
      1. Full legal name and organization number
      2. Registered address and contact information
      3. Company status (active, dissolved, etc.)
      4. Parent company or ultimate owner information
      5. Date of incorporation
      6. Industry classification
      7. Number of employees
      
      If found, provide the complete company profile. If not found, search for similar names or parent companies that might own this brand.
    `
  },
  
  Finland: {
    name: "Yritys- ja yhteisötietojärjestelmä",
    url: "https://www.ytj.fi/",
    description: "Finnish Business Information System",
    promptTemplate: (brand: string) => `
      Please search the Finnish Business Information System at https://www.ytj.fi/ for a company named "${brand}".
      
      Focus on finding:
      1. Full legal name and business ID
      2. Registered address and contact information
      3. Company status (active, dissolved, etc.)
      4. Parent company or ultimate owner information
      5. Date of incorporation
      6. Industry classification
      7. Number of employees
      
      If found, provide the complete company profile. If not found, search for similar names or parent companies that might own this brand.
    `
  }
};

/**
 * Get the appropriate web research prompt for a given country and brand
 */
export function getWebResearchPrompt(country: string, brand: string): string {
  const target = webResearchTargets[country];
  
  if (target) {
    return target.promptTemplate(brand);
  }
  
  // Fallback to generic prompt for unsupported countries
  return `
    Please perform a comprehensive web search to find ownership information for the brand "${brand}".
    
    Focus on finding:
    1. The ultimate parent company or owner
    2. Corporate structure and ownership chain
    3. Company registration details
    4. Business activities and subsidiaries
    5. Recent ownership changes or acquisitions
    
    Search multiple sources including:
    - Company websites and investor relations pages
    - Business registries and official databases
    - Financial news and corporate filings
    - Industry reports and company profiles
    
    Provide a detailed analysis with sources and confidence level.
  `;
}

/**
 * Get web research target information for a country
 */
export function getWebResearchTarget(country: string): WebResearchTarget | null {
  return webResearchTargets[country] || null;
}

/**
 * Check if a country has a supported web research target
 */
export function hasWebResearchTarget(country: string): boolean {
  return country in webResearchTargets;
}

/**
 * Get all supported countries for web research
 */
export function getSupportedCountries(): string[] {
  return Object.keys(webResearchTargets);
} 
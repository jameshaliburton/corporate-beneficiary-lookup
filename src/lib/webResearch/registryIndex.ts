export interface RegistryEntry {
  name: string;
  url: string;
  searchUrl?: string;
  description: string;
  accessLevel: 'public' | 'limited' | 'restricted';
  searchMethod: 'direct' | 'api' | 'manual';
  notes: string;
  fallbackPriority: number; // Lower number = higher priority
}

export interface RegistryIndex {
  [country: string]: RegistryEntry;
}

/**
 * Comprehensive registry index for global business registries
 * Organized by country with search capabilities and access information
 */
export const registryIndex: RegistryIndex = {
  "United Kingdom": {
    name: "Companies House",
    url: "https://find-and-update.company-information.service.gov.uk",
    searchUrl: "https://find-and-update.company-information.service.gov.uk/search",
    description: "UK official company registry - highly structured and searchable",
    accessLevel: "public",
    searchMethod: "direct",
    notes: "Excellent search functionality. Returns company number, status, directors, shareholders, and filing history.",
    fallbackPriority: 1
  },
  
  "Denmark": {
    name: "CVR / Virk",
    url: "https://datacvr.virk.dk",
    searchUrl: "https://cvrapi.dk/api",
    description: "Danish Central Business Register",
    accessLevel: "public",
    searchMethod: "api",
    notes: "Public API available. Returns CVR number, address, industry, employees, and status.",
    fallbackPriority: 1
  },
  
  "Norway": {
    name: "Brønnøysundregistrene (Brreg)",
    url: "https://www.brreg.no",
    searchUrl: "https://data.brreg.no/enhetsregisteret/api/enheter",
    description: "Norwegian Business Registry",
    accessLevel: "public",
    searchMethod: "api",
    notes: "Public API available. Returns organization number, address, status, and industry classification.",
    fallbackPriority: 1
  },
  
  "France": {
    name: "Registre National des Entreprises (RNE)",
    url: "https://data.inpi.fr/recherche_avancee/entreprises",
    searchUrl: "https://data.inpi.fr/recherche_avancee/entreprises",
    description: "French National Business Register",
    accessLevel: "public",
    searchMethod: "direct",
    notes: "Public access with SIREN number lookup. Returns legal name, address, status, and parent company info.",
    fallbackPriority: 1
  },
  
  "Sweden": {
    name: "Bolagsverket",
    url: "https://bolagsverket.se",
    searchUrl: "https://bolagsverket.se/sok",
    description: "Swedish Companies Registration Office",
    accessLevel: "limited",
    searchMethod: "direct",
    notes: "Limited public access without login. Basic company information available.",
    fallbackPriority: 2
  },
  
  "Germany": {
    name: "Unternehmensregister",
    url: "https://www.unternehmensregister.de",
    searchUrl: "https://www.unternehmensregister.de/ureg/result.html",
    description: "German Company Register",
    accessLevel: "public",
    searchMethod: "direct",
    notes: "Public but harder to navigate. Returns company details, legal form, and address.",
    fallbackPriority: 2
  },
  
  "Italy": {
    name: "Registro Imprese",
    url: "https://www.registroimprese.it",
    searchUrl: "https://www.registroimprese.it/ricerca",
    description: "Italian Business Register",
    accessLevel: "public",
    searchMethod: "direct",
    notes: "Public search with partial data access. Returns company details and legal status.",
    fallbackPriority: 2
  },
  
  "Spain": {
    name: "Registro Mercantil Central",
    url: "https://www.rmc.es",
    searchUrl: "https://www.rmc.es/busqueda",
    description: "Spanish Central Commercial Register",
    accessLevel: "limited",
    searchMethod: "direct",
    notes: "May require captcha. Partial public access to company information.",
    fallbackPriority: 3
  },
  
  "Netherlands": {
    name: "KVK (Kamer van Koophandel)",
    url: "https://www.kvk.nl",
    searchUrl: "https://www.kvk.nl/zoeken",
    description: "Dutch Chamber of Commerce",
    accessLevel: "limited",
    searchMethod: "direct",
    notes: "Basic info is free; detailed data behind paywall. Returns KvK number and basic company details.",
    fallbackPriority: 2
  },
  
  "Belgium": {
    name: "Banque-Carrefour des Entreprises (BCE)",
    url: "https://kbopub.economie.fgov.be/kbopub/zoekwoordenform.html",
    searchUrl: "https://kbopub.economie.fgov.be/kbopub/zoekwoordenform.html",
    description: "Belgian Crossroads Bank for Enterprises",
    accessLevel: "public",
    searchMethod: "direct",
    notes: "Offers basic search; multi-language support. Returns company number and basic details.",
    fallbackPriority: 2
  },
  
  "Portugal": {
    name: "Registo Nacional de Pessoas Colectivas",
    url: "https://www.irn.mj.pt/sections/empresas",
    searchUrl: "https://www.irn.mj.pt/sections/empresas",
    description: "Portuguese National Register of Legal Entities",
    accessLevel: "limited",
    searchMethod: "direct",
    notes: "Mixed access quality. Basic company information available.",
    fallbackPriority: 3
  },
  
  "Switzerland": {
    name: "Zefix",
    url: "https://www.zefix.ch",
    searchUrl: "https://www.zefix.ch/web/search",
    description: "Swiss Commercial Register",
    accessLevel: "public",
    searchMethod: "direct",
    notes: "Unified registry for all cantons. Returns company details and legal status.",
    fallbackPriority: 1
  },
  
  "USA": {
    name: "OpenCorporates",
    url: "https://opencorporates.com",
    searchUrl: "https://opencorporates.com/companies",
    description: "Aggregated US corporate data",
    accessLevel: "public",
    searchMethod: "direct",
    notes: "No single federal registry; aggregates state data. Good for basic company lookup.",
    fallbackPriority: 2
  },
  
  "Canada": {
    name: "Corporations Canada",
    url: "https://ised-isde.canada.ca/cc",
    searchUrl: "https://ised-isde.canada.ca/cc/search",
    description: "Canadian Federal Corporation Registry",
    accessLevel: "public",
    searchMethod: "direct",
    notes: "Federal-level data only; provinces differ. Returns basic corporation information.",
    fallbackPriority: 2
  },
  
  "Japan": {
    name: "Houjinbangou (Corporate Number)",
    url: "https://www.houjin-bangou.nta.go.jp",
    searchUrl: "https://www.houjin-bangou.nta.go.jp/search",
    description: "Japanese Corporate Number Registry",
    accessLevel: "public",
    searchMethod: "direct",
    notes: "Mostly in Japanese; works well for native terms. Returns corporate number and basic info.",
    fallbackPriority: 2
  },
  
  "South Korea": {
    name: "KISLINE",
    url: "https://www.kisline.com",
    searchUrl: "https://www.kisline.com/search",
    description: "Korean Business Information Service",
    accessLevel: "limited",
    searchMethod: "direct",
    notes: "Public access limited; some lookup possible. Basic company information available.",
    fallbackPriority: 3
  },
  
  "India": {
    name: "MCA (Ministry of Corporate Affairs)",
    url: "https://www.mca.gov.in",
    searchUrl: "https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do",
    description: "Indian Ministry of Corporate Affairs",
    accessLevel: "public",
    searchMethod: "direct",
    notes: "Supports company and director lookup. Returns CIN, company details, and directors.",
    fallbackPriority: 2
  },
  
  "Australia": {
    name: "ABN Lookup / ASIC",
    url: "https://abr.business.gov.au",
    searchUrl: "https://abr.business.gov.au/search",
    description: "Australian Business Number Registry",
    accessLevel: "public",
    searchMethod: "direct",
    notes: "Reliable and structured. Returns ABN, company details, and status.",
    fallbackPriority: 1
  },
  
  "New Zealand": {
    name: "NZ Companies Office",
    url: "https://companies-register.companiesoffice.govt.nz",
    searchUrl: "https://companies-register.companiesoffice.govt.nz/search",
    description: "New Zealand Companies Register",
    accessLevel: "public",
    searchMethod: "direct",
    notes: "Open and searchable. Returns company number, status, and basic details.",
    fallbackPriority: 1
  },
  
  "Singapore": {
    name: "ACRA",
    url: "https://www.acra.gov.sg",
    searchUrl: "https://www.acra.gov.sg/search",
    description: "Singapore Accounting and Corporate Regulatory Authority",
    accessLevel: "limited",
    searchMethod: "direct",
    notes: "Paywall for some data, but basic search is public. Returns company number and status.",
    fallbackPriority: 2
  },
  
  "Hong Kong": {
    name: "Companies Registry",
    url: "https://www.cr.gov.hk/en/home/index.htm",
    searchUrl: "https://www.cr.gov.hk/en/search",
    description: "Hong Kong Companies Registry",
    accessLevel: "limited",
    searchMethod: "direct",
    notes: "Captcha and access limitations. Basic company information available.",
    fallbackPriority: 3
  }
};

/**
 * Get registry entry for a country
 */
export function getRegistryEntry(country: string): RegistryEntry | null {
  return registryIndex[country] || null;
}

/**
 * Check if a country has a supported registry
 */
export function hasRegistry(country: string): boolean {
  return country in registryIndex;
}

/**
 * Get all supported countries for registry lookup
 */
export function getSupportedCountries(): string[] {
  return Object.keys(registryIndex);
}

/**
 * Get registry entries sorted by priority
 */
export function getRegistryEntriesByPriority(): RegistryEntry[] {
  return Object.values(registryIndex).sort((a, b) => a.fallbackPriority - b.fallbackPriority);
}

/**
 * Get registry entries for a specific country
 */
export function getRegistryEntriesForCountry(country: string): RegistryEntry[] {
  const entry = getRegistryEntry(country);
  return entry ? [entry] : [];
}

/**
 * Get registry entries with public access
 */
export function getPublicRegistries(): RegistryEntry[] {
  return Object.values(registryIndex).filter(entry => entry.accessLevel === 'public');
}

/**
 * Get registry entries with API access
 */
export function getApiRegistries(): RegistryEntry[] {
  return Object.values(registryIndex).filter(entry => entry.searchMethod === 'api');
} 
/**
 * Trusted Sources for Ownership Verification
 * 
 * This file contains a comprehensive list of trusted sources for corporate ownership verification.
 * Sources are categorized by trust level and region to enable dynamic verification logic.
 */

export interface TrustedSource {
  domain: string;
  name: string;
  country: string;
  region: string;
  trustLevel: 'verified' | 'highly_likely' | 'reliable';
  type: 'government' | 'official_registry' | 'financial_regulator' | 'open_data' | 'corporate_database';
  description: string;
  apiAvailable: boolean;
  freeAccess: boolean;
}

export const TRUSTED_SOURCES: TrustedSource[] = [
  // Government Registries - Highest Trust Level
  {
    domain: 'opencorporates.com',
    name: 'OpenCorporates',
    country: 'Global',
    region: 'Global',
    trustLevel: 'verified',
    type: 'official_registry',
    description: 'Largest open database of companies in the world',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'sec.gov',
    name: 'SEC EDGAR',
    country: 'USA',
    region: 'North America',
    trustLevel: 'verified',
    type: 'financial_regulator',
    description: 'US Securities and Exchange Commission filings',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'companieshouse.gov.uk',
    name: 'Companies House',
    country: 'UK',
    region: 'Europe',
    trustLevel: 'verified',
    type: 'official_registry',
    description: 'UK official company registry',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'bolagsverket.se',
    name: 'Bolagsverket',
    country: 'Sweden',
    region: 'Europe',
    trustLevel: 'verified',
    type: 'official_registry',
    description: 'Swedish Companies Registration Office',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'asic.gov.au',
    name: 'ASIC',
    country: 'Australia',
    region: 'Oceania',
    trustLevel: 'verified',
    type: 'financial_regulator',
    description: 'Australian Securities and Investments Commission',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'imprese.registro.it',
    name: 'Registro Imprese',
    country: 'Italy',
    region: 'Europe',
    trustLevel: 'verified',
    type: 'official_registry',
    description: 'Italian Business Register',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'e-justice.europa.eu',
    name: 'EU Business Registers',
    country: 'EU',
    region: 'Europe',
    trustLevel: 'verified',
    type: 'official_registry',
    description: 'Interconnected EU business registries',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'kbopub.economie.fgov.be',
    name: 'KBO Belgium',
    country: 'Belgium',
    region: 'Europe',
    trustLevel: 'verified',
    type: 'official_registry',
    description: 'Belgian Crossroads Bank for Enterprises',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'krs.gov.pl',
    name: 'KRS Poland',
    country: 'Poland',
    region: 'Europe',
    trustLevel: 'verified',
    type: 'official_registry',
    description: 'Polish National Court Register',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'brreg.no',
    name: 'Brønnøysundregistrene',
    country: 'Norway',
    region: 'Europe',
    trustLevel: 'verified',
    type: 'official_registry',
    description: 'Norwegian Business Registry',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'kvk.nl',
    name: 'Kamer van Koophandel',
    country: 'Netherlands',
    region: 'Europe',
    trustLevel: 'verified',
    type: 'official_registry',
    description: 'Dutch Chamber of Commerce',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'infogreffe.fr',
    name: 'Infogreffe',
    country: 'France',
    region: 'Europe',
    trustLevel: 'verified',
    type: 'official_registry',
    description: 'French Commercial Court Registry',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'data.gov',
    name: 'Data.gov',
    country: 'USA',
    region: 'North America',
    trustLevel: 'verified',
    type: 'open_data',
    description: 'US Government open data portal',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'data.gov.uk',
    name: 'Data.gov.uk',
    country: 'UK',
    region: 'Europe',
    trustLevel: 'verified',
    type: 'open_data',
    description: 'UK Government open data portal',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'data.europa.eu',
    name: 'Data.europa.eu',
    country: 'EU',
    region: 'Europe',
    trustLevel: 'verified',
    type: 'open_data',
    description: 'EU open data portal',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'supercias.gov.co',
    name: 'Superintendencia de Sociedades',
    country: 'Colombia',
    region: 'South America',
    trustLevel: 'verified',
    type: 'financial_regulator',
    description: 'Colombian Business Registry',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'corporationscanada.ic.gc.ca',
    name: 'Corporations Canada',
    country: 'Canada',
    region: 'North America',
    trustLevel: 'verified',
    type: 'official_registry',
    description: 'Canadian federal business registry',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'companies-register.companiesoffice.govt.nz',
    name: 'NZ Companies Register',
    country: 'New Zealand',
    region: 'Oceania',
    trustLevel: 'verified',
    type: 'official_registry',
    description: 'New Zealand Companies Office',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'sam.gov',
    name: 'SAM.gov',
    country: 'USA',
    region: 'North America',
    trustLevel: 'verified',
    type: 'government',
    description: 'US System for Award Management',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'crunchbase.com',
    name: 'Crunchbase',
    country: 'Global',
    region: 'Global',
    trustLevel: 'highly_likely',
    type: 'corporate_database',
    description: 'Startup and private company database',
    apiAvailable: true,
    freeAccess: false
  },
  {
    domain: 'bloomberg.com',
    name: 'Bloomberg',
    country: 'Global',
    region: 'Global',
    trustLevel: 'highly_likely',
    type: 'financial_regulator',
    description: 'Financial data and news',
    apiAvailable: true,
    freeAccess: false
  },
  {
    domain: 'reuters.com',
    name: 'Reuters',
    country: 'Global',
    region: 'Global',
    trustLevel: 'highly_likely',
    type: 'financial_regulator',
    description: 'Financial news and data',
    apiAvailable: true,
    freeAccess: false
  },
  {
    domain: 'ft.com',
    name: 'Financial Times',
    country: 'Global',
    region: 'Global',
    trustLevel: 'highly_likely',
    type: 'financial_regulator',
    description: 'Financial news and analysis',
    apiAvailable: true,
    freeAccess: false
  },
  {
    domain: 'wsj.com',
    name: 'Wall Street Journal',
    country: 'Global',
    region: 'Global',
    trustLevel: 'highly_likely',
    type: 'financial_regulator',
    description: 'Financial news and data',
    apiAvailable: true,
    freeAccess: false
  },
  {
    domain: 'yahoo.com',
    name: 'Yahoo Finance',
    country: 'Global',
    region: 'Global',
    trustLevel: 'reliable',
    type: 'financial_regulator',
    description: 'Financial data and news',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'marketwatch.com',
    name: 'MarketWatch',
    country: 'Global',
    region: 'Global',
    trustLevel: 'reliable',
    type: 'financial_regulator',
    description: 'Financial news and data',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'investing.com',
    name: 'Investing.com',
    country: 'Global',
    region: 'Global',
    trustLevel: 'reliable',
    type: 'financial_regulator',
    description: 'Financial data and news',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'morningstar.com',
    name: 'Morningstar',
    country: 'Global',
    region: 'Global',
    trustLevel: 'reliable',
    type: 'financial_regulator',
    description: 'Investment research and data',
    apiAvailable: true,
    freeAccess: false
  },
  {
    domain: 'forbes.com',
    name: 'Forbes',
    country: 'Global',
    region: 'Global',
    trustLevel: 'reliable',
    type: 'financial_regulator',
    description: 'Business news and analysis',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'fortune.com',
    name: 'Fortune',
    country: 'Global',
    region: 'Global',
    trustLevel: 'reliable',
    type: 'financial_regulator',
    description: 'Business news and analysis',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'cnbc.com',
    name: 'CNBC',
    country: 'Global',
    region: 'Global',
    trustLevel: 'reliable',
    type: 'financial_regulator',
    description: 'Financial news and data',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'cnn.com',
    name: 'CNN Business',
    country: 'Global',
    region: 'Global',
    trustLevel: 'reliable',
    type: 'financial_regulator',
    description: 'Business news and analysis',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'bbc.com',
    name: 'BBC Business',
    country: 'Global',
    region: 'Global',
    trustLevel: 'reliable',
    type: 'financial_regulator',
    description: 'Business news and analysis',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'theguardian.com',
    name: 'The Guardian Business',
    country: 'Global',
    region: 'Global',
    trustLevel: 'reliable',
    type: 'financial_regulator',
    description: 'Business news and analysis',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'economist.com',
    name: 'The Economist',
    country: 'Global',
    region: 'Global',
    trustLevel: 'reliable',
    type: 'financial_regulator',
    description: 'Business and economic analysis',
    apiAvailable: true,
    freeAccess: false
  },
  {
    domain: 'businessinsider.com',
    name: 'Business Insider',
    country: 'Global',
    region: 'Global',
    trustLevel: 'reliable',
    type: 'financial_regulator',
    description: 'Business news and analysis',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'techcrunch.com',
    name: 'TechCrunch',
    country: 'Global',
    region: 'Global',
    trustLevel: 'reliable',
    type: 'financial_regulator',
    description: 'Technology business news',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'venturebeat.com',
    name: 'VentureBeat',
    country: 'Global',
    region: 'Global',
    trustLevel: 'reliable',
    type: 'financial_regulator',
    description: 'Technology business news',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'wired.com',
    name: 'Wired',
    country: 'Global',
    region: 'Global',
    trustLevel: 'reliable',
    type: 'financial_regulator',
    description: 'Technology news and analysis',
    apiAvailable: true,
    freeAccess: true
  },
  {
    domain: 'arstechnica.com',
    name: 'Ars Technica',
    country: 'Global',
    region: 'Global',
    trustLevel: 'reliable',
    type: 'financial_regulator',
    description: 'Technology news and analysis',
    apiAvailable: true,
    freeAccess: true
  }
];

/**
 * Get trusted source by domain
 */
export function getTrustedSource(domain: string): TrustedSource | null {
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
  return TRUSTED_SOURCES.find(source => 
    normalizedDomain.includes(source.domain.toLowerCase())
  ) || null;
}

/**
 * Get all trusted sources by trust level
 */
export function getTrustedSourcesByLevel(trustLevel: TrustedSource['trustLevel']): TrustedSource[] {
  return TRUSTED_SOURCES.filter(source => source.trustLevel === trustLevel);
}

/**
 * Get trusted sources by region
 */
export function getTrustedSourcesByRegion(region: string): TrustedSource[] {
  return TRUSTED_SOURCES.filter(source => source.region === region);
}

/**
 * Get verified sources only (highest trust level)
 */
export function getVerifiedSources(): TrustedSource[] {
  return getTrustedSourcesByLevel('verified');
}

/**
 * Check if a domain is a trusted source
 */
export function isTrustedSource(domain: string): boolean {
  return getTrustedSource(domain) !== null;
}

/**
 * Get trust level for a domain
 */
export function getTrustLevel(domain: string): TrustedSource['trustLevel'] | null {
  const source = getTrustedSource(domain);
  return source ? source.trustLevel : null;
} 
/**
 * Runtime Configuration Logging
 * 
 * Provides minimal runtime config logging to ensure environment parity
 * between manual runs and automated tests.
 */

export interface RuntimeConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE: string;
  NODE_ENV: string;
  ANTHROPIC_API_KEY: string;
  GOOGLE_API_KEY: string;
  GOOGLE_CSE_ID: string;
  OPENCORPORATES_API_KEY: string;
}

export interface RuntimeConfigSummary {
  hasSupabaseUrl: boolean;
  hasSupabaseAnonKey: boolean;
  hasSupabaseServiceRole: boolean;
  hasAnthropicKey: boolean;
  hasGoogleKey: boolean;
  hasGoogleCseId: boolean;
  hasOpenCorporatesKey: boolean;
  nodeEnv: string;
  supabaseUrlLength: number;
  supabaseAnonKeyLength: number;
  supabaseServiceRoleLength: number;
  anthropicKeyLength: number;
  googleKeyLength: number;
  googleCseIdLength: number;
  openCorporatesKeyLength: number;
}

/**
 * Print minimal runtime configuration for debugging environment parity
 * 
 * @param tag - Identifier for the logging context (e.g., 'SERVER_BOOTSTRAP', 'TEST_SETUP')
 */
export function printMinimalRuntimeConfig(tag: string): RuntimeConfigSummary {
  const config: RuntimeConfig = {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE || '',
    NODE_ENV: process.env.NODE_ENV || 'development',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
    GOOGLE_CSE_ID: process.env.GOOGLE_CSE_ID || '',
    OPENCORPORATES_API_KEY: process.env.OPENCORPORATES_API_KEY || ''
  };

  const summary: RuntimeConfigSummary = {
    hasSupabaseUrl: !!config.SUPABASE_URL,
    hasSupabaseAnonKey: !!config.SUPABASE_ANON_KEY,
    hasSupabaseServiceRole: !!config.SUPABASE_SERVICE_ROLE,
    hasAnthropicKey: !!config.ANTHROPIC_API_KEY,
    hasGoogleKey: !!config.GOOGLE_API_KEY,
    hasGoogleCseId: !!config.GOOGLE_CSE_ID,
    hasOpenCorporatesKey: !!config.OPENCORPORATES_API_KEY,
    nodeEnv: config.NODE_ENV,
    supabaseUrlLength: config.SUPABASE_URL.length,
    supabaseAnonKeyLength: config.SUPABASE_ANON_KEY.length,
    supabaseServiceRoleLength: config.SUPABASE_SERVICE_ROLE.length,
    anthropicKeyLength: config.ANTHROPIC_API_KEY.length,
    googleKeyLength: config.GOOGLE_API_KEY.length,
    googleCseIdLength: config.GOOGLE_CSE_ID.length,
    openCorporatesKeyLength: config.OPENCORPORATES_API_KEY.length
  };

  console.log(`[RUNTIME] ${tag} - Environment Configuration:`, {
    NODE_ENV: summary.nodeEnv,
    SUPABASE_URL_EXISTS: summary.hasSupabaseUrl,
    SUPABASE_ANON_KEY_EXISTS: summary.hasSupabaseAnonKey,
    SUPABASE_SERVICE_ROLE_EXISTS: summary.hasSupabaseServiceRole,
    ANTHROPIC_API_KEY_EXISTS: summary.hasAnthropicKey,
    GOOGLE_API_KEY_EXISTS: summary.hasGoogleKey,
    GOOGLE_CSE_ID_EXISTS: summary.hasGoogleCseId,
    OPENCORPORATES_API_KEY_EXISTS: summary.hasOpenCorporatesKey,
    SUPABASE_URL_LENGTH: summary.supabaseUrlLength,
    SUPABASE_ANON_KEY_LENGTH: summary.supabaseAnonKeyLength,
    SUPABASE_SERVICE_ROLE_LENGTH: summary.supabaseServiceRoleLength,
    ANTHROPIC_API_KEY_LENGTH: summary.anthropicKeyLength,
    GOOGLE_API_KEY_LENGTH: summary.googleKeyLength,
    GOOGLE_CSE_ID_LENGTH: summary.googleCseIdLength,
    OPENCORPORATES_API_KEY_LENGTH: summary.openCorporatesKeyLength
  });

  return summary;
}

/**
 * Validate that all required environment variables are present
 * 
 * @param tag - Identifier for the validation context
 * @returns true if all required vars are present, false otherwise
 */
export function validateRuntimeConfig(tag: string): boolean {
  const summary = printMinimalRuntimeConfig(tag);
  
  const required = [
    summary.hasSupabaseUrl,
    summary.hasSupabaseAnonKey,
    summary.hasSupabaseServiceRole,
    summary.hasAnthropicKey,
    summary.hasGoogleKey,
    summary.hasGoogleCseId,
    summary.hasOpenCorporatesKey
  ];

  const allPresent = required.every(Boolean);
  
  if (!allPresent) {
    console.error(`[RUNTIME] ${tag} - Missing required environment variables:`, {
      SUPABASE_URL: summary.hasSupabaseUrl ? '✅' : '❌',
      SUPABASE_ANON_KEY: summary.hasSupabaseAnonKey ? '✅' : '❌',
      SUPABASE_SERVICE_ROLE: summary.hasSupabaseServiceRole ? '✅' : '❌',
      ANTHROPIC_API_KEY: summary.hasAnthropicKey ? '✅' : '❌',
      GOOGLE_API_KEY: summary.hasGoogleKey ? '✅' : '❌',
      GOOGLE_CSE_ID: summary.hasGoogleCseId ? '✅' : '❌',
      OPENCORPORATES_API_KEY: summary.hasOpenCorporatesKey ? '✅' : '❌'
    });
  } else {
    console.log(`[RUNTIME] ${tag} - All required environment variables present ✅`);
  }

  return allPresent;
}

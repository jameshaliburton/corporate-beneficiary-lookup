export function getRuntimeConfig() {
  return {
    ENABLE_GEMINI_OWNERSHIP_AGENT: true, // Temporarily hardcoded for testing
    ENABLE_DISAMBIGUATION_AGENT: process.env.ENABLE_DISAMBIGUATION_AGENT === 'true',
    ENABLE_AGENT_REPORTS: process.env.ENABLE_AGENT_REPORTS === 'true',
    ENABLE_PIPELINE_LOGGING: process.env.ENABLE_PIPELINE_LOGGING === 'true',
    NODE_ENV: process.env.NODE_ENV,
    ANTHROPIC_API_KEY_PRESENT: !!process.env.ANTHROPIC_API_KEY,
    GEMINI_API_KEY_PRESENT: !!process.env.GEMINI_API_KEY,
    SUPABASE_URL_PRESENT: !!process.env.SUPABASE_URL,
    SUPABASE_KEY_PRESENT: !!process.env.SUPABASE_KEY
  };
}

export function logRuntimeConfig(context: string = 'Unknown') {
  const config = getRuntimeConfig();
  console.log(`[RUNTIME_CONFIG] ${context}:`, config);
}

export function printMinimalRuntimeConfig(context: string = 'Unknown') {
  const config = getRuntimeConfig();
  console.log(`[RUNTIME_CONFIG] ${context}:`, {
    ENABLE_GEMINI_OWNERSHIP_AGENT: config.ENABLE_GEMINI_OWNERSHIP_AGENT,
    ENABLE_DISAMBIGUATION_AGENT: config.ENABLE_DISAMBIGUATION_AGENT,
    NODE_ENV: config.NODE_ENV
  });
}

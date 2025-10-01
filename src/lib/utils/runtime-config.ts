/**
 * Runtime configuration utilities
 */

export interface RuntimeConfig {
  environment: string;
  isDevelopment: boolean;
  isProduction: boolean;
  apiUrl?: string;
  debugMode: boolean;
}

export function getRuntimeConfig(): RuntimeConfig {
  return {
    environment: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    debugMode: process.env.NODE_ENV === 'development'
  };
}

export const runtimeConfig = getRuntimeConfig();

export function printMinimalRuntimeConfig(context?: string) {
  console.log('🔧 Runtime Config:', {
    context,
    environment: runtimeConfig.environment,
    debugMode: runtimeConfig.debugMode
  });
}

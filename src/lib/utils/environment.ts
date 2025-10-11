/**
 * Environment Detection Utilities
 * 
 * Provides utilities for detecting the current deployment environment
 * and adjusting behavior accordingly.
 */

export type Environment = 'production' | 'staging' | 'development';

/**
 * Get the current environment
 */
export function getEnvironment(): Environment {
  // Check for explicit staging flag
  if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging') {
    return 'staging';
  }
  
  // Check for staging domain
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'staging.ownedby.ai') {
      return 'staging';
    }
  }
  
  // Check Node environment
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  return 'development';
}

/**
 * Check if running in staging environment
 */
export function isStagingEnv(): boolean {
  return getEnvironment() === 'staging';
}

/**
 * Check if running in production environment
 */
export function isProductionEnv(): boolean {
  return getEnvironment() === 'production';
}

/**
 * Check if running in development environment
 */
export function isDevelopmentEnv(): boolean {
  return getEnvironment() === 'development';
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  const env = getEnvironment();
  
  return {
    environment: env,
    isProduction: env === 'production',
    isStaging: env === 'staging',
    isDevelopment: env === 'development',
    // Staging mode should disable certain production behaviors
    shouldWriteToDatabase: env !== 'staging' || process.env.STAGING_ALLOW_DB_WRITES === 'true',
    shouldSendAnalytics: env === 'production',
    shouldShowDebugInfo: env !== 'production',
    apiBaseUrl: env === 'production' 
      ? 'https://ownedby.ai' 
      : env === 'staging'
      ? 'https://staging.ownedby.ai'
      : 'http://localhost:3000'
  };
}

/**
 * Log environment information (server-side only)
 */
export function logEnvironmentInfo() {
  if (typeof window === 'undefined') {
    const config = getEnvironmentConfig();
    console.log('🌍 Environment Info:', {
      environment: config.environment,
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
      shouldWriteToDatabase: config.shouldWriteToDatabase,
      shouldSendAnalytics: config.shouldSendAnalytics
    });
  }
}


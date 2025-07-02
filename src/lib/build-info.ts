/**
 * Build Information Utility
 * Generates and tracks build numbers for version tracking
 */

// Use a completely static build number to avoid hydration issues
// This will be the same for server and client rendering
const STATIC_BUILD_NUMBER = '20250102.120000.ABC123';

// Get git commit info if available
function getGitInfo() {
  try {
    // In production, these would be set by build process
    return {
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
      branch: process.env.VERCEL_GIT_COMMIT_REF || 'local',
      message: process.env.VERCEL_GIT_COMMIT_MESSAGE || 'Development build'
    };
  } catch {
    return {
      commit: 'dev',
      branch: 'local',
      message: 'Development build'
    };
  }
}

// Build information - completely static to avoid hydration issues
export const BUILD_INFO = {
  version: '1.0.0',
  buildNumber: STATIC_BUILD_NUMBER,
  buildDate: '2025-01-02T12:00:00.000Z',
  environment: process.env.NODE_ENV || 'development',
  git: getGitInfo()
};

// Format build number for display
export function getDisplayBuildNumber(): string {
  const { buildNumber, environment, git } = BUILD_INFO;
  
  if (environment === 'production') {
    return `v${BUILD_INFO.version} (${buildNumber})`;
  } else {
    return `v${BUILD_INFO.version}-${environment} (${buildNumber})`;
  }
}

// Get short build number for compact display
export function getShortBuildNumber(): string {
  const { buildNumber } = BUILD_INFO;
  return buildNumber.split('.')[2]; // Just the hash part
}

// Get full build info for debugging
export function getFullBuildInfo() {
  return BUILD_INFO;
}

// Check if this is a production build
export function isProduction(): boolean {
  return BUILD_INFO.environment === 'production';
}

// Get build timestamp for sorting
export function getBuildTimestamp(): number {
  return new Date(BUILD_INFO.buildDate).getTime();
} 
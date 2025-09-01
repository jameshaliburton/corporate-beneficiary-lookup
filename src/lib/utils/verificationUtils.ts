/**
 * Verification utility functions for consistent status handling
 */

export type VerificationStatus = "confirmed" | "contradicted" | "mixed_evidence" | "insufficient_evidence";
export type ConfidenceChange = "increased" | "decreased" | "unchanged";

export interface VerificationConfig {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
}

export interface ConfidenceChangeConfig {
  label: string;
  icon: string;
  color: string;
}

/**
 * Get verification status configuration
 */
export function getVerificationConfig(status: VerificationStatus): VerificationConfig {
  switch (status) {
    case 'confirmed':
      return {
        label: 'Verified by AI',
        icon: 'CheckCircle',
        color: 'text-green-400',
        bgColor: 'bg-green-900/20',
        borderColor: 'border-green-500/30',
        iconColor: 'text-green-400'
      };
    case 'contradicted':
      return {
        label: 'Contradictory evidence',
        icon: 'AlertTriangle',
        color: 'text-blue-400',
        bgColor: 'bg-blue-900/20',
        borderColor: 'border-blue-500/30',
        iconColor: 'text-blue-400'
      };
    case 'mixed_evidence':
      return {
        label: 'Conflicting sources',
        icon: 'AlertTriangle',
        color: 'text-blue-400',
        bgColor: 'bg-blue-900/20',
        borderColor: 'border-blue-500/30',
        iconColor: 'text-blue-400'
      };
    case 'insufficient_evidence':
    default:
      return {
        label: 'Not enough info',
        icon: 'HelpCircle',
        color: 'text-gray-400',
        bgColor: 'bg-gray-900/20',
        borderColor: 'border-gray-500/30',
        iconColor: 'text-gray-400'
      };
  }
}

/**
 * Get confidence change configuration
 */
export function getConfidenceChangeConfig(change: ConfidenceChange): ConfidenceChangeConfig {
  switch (change) {
    case 'increased':
      return {
        label: 'Confidence increased',
        icon: 'TrendingUp',
        color: 'text-green-600'
      };
    case 'decreased':
      return {
        label: 'Confidence decreased',
        icon: 'TrendingDown',
        color: 'text-red-600'
      };
    case 'unchanged':
    default:
      return {
        label: 'Confidence unchanged',
        icon: 'Minus',
        color: 'text-gray-500'
      };
  }
}

/**
 * Get panel title based on verification status
 */
export function getPanelTitle(status: VerificationStatus): string {
  switch (status) {
    case 'confirmed':
    case 'mixed_evidence':
      return 'How do we verify this?';
    case 'contradicted':
    case 'insufficient_evidence':
    default:
      return 'Verification Details';
  }
}

/**
 * Check if verification status should show evidence panel
 */
export function shouldShowEvidencePanel(status: VerificationStatus): boolean {
  return status !== 'insufficient_evidence';
}

/**
 * Normalize verification status from raw data
 */
export function normalizeVerificationStatus(rawStatus?: string): VerificationStatus {
  if (!rawStatus) return 'insufficient_evidence';
  
  const normalized = rawStatus.toLowerCase().trim();
  
  switch (normalized) {
    case 'confirmed':
    case 'verify':
    case 'verified':
      return 'confirmed';
    case 'contradicted':
    case 'contradict':
    case 'failed':
      return 'contradicted';
    case 'mixed_evidence':
    case 'mixed':
    case 'conflicting':
      return 'mixed_evidence';
    case 'insufficient_evidence':
    case 'insufficient':
    case 'unclear':
    case 'unknown':
    default:
      return 'insufficient_evidence';
  }
}

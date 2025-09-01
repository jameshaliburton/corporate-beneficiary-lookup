export type VerificationStatus = 'confirmed' | 'contradicted' | 'mixed_evidence' | 'insufficient_evidence' | 'unknown';

export interface VerificationConfig {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
}

export interface ConfidenceChangeConfig {
  icon: string;
  text: string;
  color: string;
}

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

export function getConfidenceChangeConfig(change: string | null): ConfidenceChangeConfig | null {
  if (!change) return null;
  
  switch (change) {
    case 'increased':
      return {
        icon: 'TrendingUp',
        text: 'Confidence increased',
        color: 'text-green-400'
      };
    case 'decreased':
      return {
        icon: 'TrendingDown',
        text: 'Confidence decreased',
        color: 'text-red-400'
      };
    case 'unchanged':
      return {
        icon: 'Minus',
        text: 'Confidence unchanged',
        color: 'text-gray-400'
      };
    default:
      return null;
  }
}

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

export function shouldShowEvidencePanel(status: VerificationStatus): boolean {
  return status !== 'unknown';
}

export function normalizeVerificationStatus(status: string | null | undefined): "confirmed" | "contradicted" | "mixed_evidence" | "insufficient_evidence" {
  if (!status) return 'insufficient_evidence';
  
  switch (status) {
    case 'confirmed':
    case 'contradicted':
    case 'mixed_evidence':
    case 'insufficient_evidence':
      return status;
    default:
      return 'insufficient_evidence';
  }
}

/**
 * Verification utility functions
 */

export function normalizeVerificationStatus(status: string | undefined | null): string {
  if (!status) return 'none';
  
  const normalized = status.toLowerCase().trim();
  
  // Map various status formats to standard values
  switch (normalized) {
    case 'confirmed':
    case 'verified':
    case 'valid':
      return 'confirmed';
    
    case 'contradicted':
    case 'rejected':
    case 'invalid':
      return 'contradicted';
    
    case 'mixed_evidence':
    case 'mixed':
    case 'conflicting':
      return 'mixed_evidence';
    
    case 'insufficient_evidence':
    case 'insufficient':
    case 'not_enough_info':
    case 'unverified':
      return 'insufficient_evidence';
    
    case 'unverified_due_to_parsing_error':
    case 'parsing_error':
      return 'parsing_error';
    
    default:
      return 'unknown';
  }
}

export function getVerificationStatusColor(status: string): string {
  const normalized = normalizeVerificationStatus(status);
  
  switch (normalized) {
    case 'confirmed':
      return 'text-green-600 bg-green-100';
    case 'contradicted':
      return 'text-red-600 bg-red-100';
    case 'mixed_evidence':
      return 'text-yellow-600 bg-yellow-100';
    case 'insufficient_evidence':
      return 'text-gray-600 bg-gray-100';
    case 'parsing_error':
      return 'text-orange-600 bg-orange-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getVerificationStatusIcon(status: string): string {
  const normalized = normalizeVerificationStatus(status);
  
  switch (normalized) {
    case 'confirmed':
      return '✅';
    case 'contradicted':
      return '❌';
    case 'mixed_evidence':
      return '⚠️';
    case 'insufficient_evidence':
      return '❓';
    case 'parsing_error':
      return '🔧';
    default:
      return '❓';
  }
}

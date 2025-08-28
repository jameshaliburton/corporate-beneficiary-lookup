export interface EnrichedEntity {
  name: string;
  description?: string;
  confidence?: number;
  relationshipLabel?: string;
  logoUrl?: string;
  parentName?: string;
  type?: string;
  country?: string;
  countryFlag?: string;
  financial_beneficiary?: string;
  beneficiary_country?: string;
  confidence_score?: number;
}

export interface OwnershipNode {
  name: string;
  country: string;
  countryFlag: string;
  avatar: string;
  relationshipType?: string;
  isVerified?: boolean;
  ultimate?: boolean;
  description?: string;
  relationshipLabel?: string;
} 
import React, { useState, useEffect } from 'react';
import { findCompanyLogoWithTimeout } from '@/lib/services/logo-finder';
import { HelpCircle, ArrowRight, GitBranch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface OwnershipStep {
  name: string;
  country: string;
  flag: string;
  type: string;
  ultimate?: boolean;
  // Flexible relationship type fields
  relationship_type?: string;
  raw_relationship_type?: string;
  is_verified?: boolean;
}

export interface AmbiguousOwnershipGroup {
  brand: string;
  relationships: Array<{
    parent: string;
    relationship_type: string;
    raw_relationship_type: string;
    is_verified: boolean;
    chain: OwnershipStep[];
  }>;
}

export interface EnhancedOwnershipTrailProps {
  steps: OwnershipStep[];
}

// Enhanced relationship type styles with better visual distinction
const relationshipStyles: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  brand: { 
    bg: 'bg-yellow-50', 
    text: 'text-yellow-800', 
    border: 'border-yellow-300',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  ultimate_owner: { 
    bg: 'bg-blue-50', 
    text: 'text-blue-800', 
    border: 'border-blue-400',
    badge: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  subsidiary: { 
    bg: 'bg-purple-50', 
    text: 'text-purple-800', 
    border: 'border-purple-300',
    badge: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  licensed_manufacturer: { 
    bg: 'bg-green-50', 
    text: 'text-green-800', 
    border: 'border-green-300',
    badge: 'bg-green-100 text-green-800 border-green-200'
  },
  joint_venture_partner: { 
    bg: 'bg-orange-50', 
    text: 'text-orange-800', 
    border: 'border-orange-300',
    badge: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  parent: { 
    bg: 'bg-indigo-50', 
    text: 'text-indigo-800', 
    border: 'border-indigo-300',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  unknown: { 
    bg: 'bg-gray-50', 
    text: 'text-gray-800', 
    border: 'border-gray-300',
    badge: 'bg-gray-100 text-gray-800 border-gray-200'
  }
};

// Detect ambiguous ownership by grouping entities with multiple relationships
const detectAmbiguousOwnership = (steps: OwnershipStep[]): AmbiguousOwnershipGroup[] => {
  // Group by brand name (case insensitive)
  const brandGroups = new Map<string, OwnershipStep[]>();
  
  steps.forEach(step => {
    const brandKey = step.name.toLowerCase();
    if (!brandGroups.has(brandKey)) {
      brandGroups.set(brandKey, []);
    }
    brandGroups.get(brandKey)!.push(step);
  });
  
  // Find brands with multiple relationships
  const ambiguousGroups: AmbiguousOwnershipGroup[] = [];
  
  brandGroups.forEach((entities, brandKey) => {
    if (entities.length > 1) {
      // Group by relationship type to identify different ownership paths
      const relationshipGroups = new Map<string, OwnershipStep[]>();
      
      entities.forEach(entity => {
        const relType = entity.relationship_type || 'unknown';
        if (!relationshipGroups.has(relType)) {
          relationshipGroups.set(relType, []);
        }
        relationshipGroups.get(relType)!.push(entity);
      });
      
      // If we have multiple relationship types, it's ambiguous
      if (relationshipGroups.size > 1) {
        const relationships = Array.from(relationshipGroups.entries()).map(([relType, entities]) => ({
          parent: entities[0].name,
          relationship_type: relType,
          raw_relationship_type: entities[0].raw_relationship_type || relType,
          is_verified: entities[0].is_verified || false,
          chain: entities
        }));
        
        ambiguousGroups.push({
          brand: entities[0].name,
          relationships
        });
      }
    }
  });
  
  return ambiguousGroups;
};

// Get relationship style based on relationship type
const getRelationshipStyle = (relationshipType?: string) => {
  if (!relationshipType) return relationshipStyles.unknown;
  return relationshipStyles[relationshipType] || relationshipStyles.unknown;
};

// Enhanced ownership step card component
const OwnershipStepCard: React.FC<{ step: OwnershipStep; logoUrl?: string | null; isLoadingLogo?: boolean }> = ({ 
  step, 
  logoUrl, 
  isLoadingLogo 
}) => {
  const style = getRelationshipStyle(step.relationship_type);
  
  return (
    <div className={`min-w-[140px] max-w-[200px] ${style.bg} rounded-xl shadow-sm p-3 flex flex-col items-center relative border ${step.ultimate ? 'border-2 border-blue-500' : style.border}`}>
      {/* Logo or Flag Display */}
      <div className="mb-2 flex items-center justify-center">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={`${step.name} logo`}
            className="w-10 h-10 object-contain rounded-full"
            onError={() => {
              // Fallback handled by parent component
            }}
          />
        ) : isLoadingLogo ? (
          <div className="w-10 h-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
          </div>
        ) : (
          <div className="text-2xl">{step.flag}</div>
        )}
      </div>
      
      {/* Company Name */}
      <div className="font-semibold text-sm mb-2 text-center leading-tight">{step.name}</div>
      
      {/* Relationship Type Badge */}
      <div className="flex items-center gap-1 mb-2">
        <Badge variant="outline" className={`text-xs ${style.badge}`}>
          {step.relationship_type || step.type || 'Unknown'}
        </Badge>
        {step.is_verified === false && step.raw_relationship_type && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 text-amber-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  <div className="font-semibold mb-1">Unverified Relationship Type</div>
                  <div className="text-xs text-gray-300">
                    Raw value: {step.raw_relationship_type}
                  </div>
                  <div className="text-xs text-gray-300 mt-1">
                    This relationship type is not in our verified list and may need review.
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {step.is_verified === true && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-3 w-3 text-green-500">✓</div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  <div className="font-semibold mb-1">Verified Relationship Type</div>
                  <div className="text-xs text-gray-300">
                    This relationship type is confirmed and reliable.
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {/* Ultimate Owner Indicator */}
      {step.ultimate && (
        <div className="text-xs text-blue-700 font-bold mt-1 flex items-center gap-1">
          🎯 Ultimate Owner
        </div>
      )}
    </div>
  );
};

// Ambiguous ownership display component
const AmbiguousOwnershipDisplay: React.FC<{ groups: AmbiguousOwnershipGroup[] }> = ({ groups }) => {
  const [logos, setLogos] = useState<Record<string, string | null>>({});
  const [loadingLogos, setLoadingLogos] = useState<Record<string, boolean>>({});

  // Async logo fetching for all entities in ambiguous groups
  useEffect(() => {
    const fetchLogos = async () => {
      const allEntities = groups.flatMap(group => 
        group.relationships.flatMap(rel => rel.chain)
      );
      
      for (const entity of allEntities) {
        const companyName = entity.name;
        if (!companyName || logos[companyName] !== undefined || loadingLogos[companyName]) continue;

        setLoadingLogos(prev => ({ ...prev, [companyName]: true }));
        
        try {
          const logoUrl = await findCompanyLogoWithTimeout(companyName, 1000);
          setLogos(prev => ({ ...prev, [companyName]: logoUrl }));
        } catch (error) {
          console.warn(`⚠️ Logo fetch failed for ${companyName}:`, error);
          setLogos(prev => ({ ...prev, [companyName]: null }));
        } finally {
          setLoadingLogos(prev => ({ ...prev, [companyName]: false }));
        }
      }
    };

    fetchLogos();
  }, [groups, logos, loadingLogos]);

  return (
    <div className="space-y-6">
      {groups.map((group, index) => (
        <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-lg text-blue-900">{group.brand}</h3>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
              Multiple Owners
            </Badge>
          </div>
          
          {/* Relationship Paths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.relationships.map((rel, relIndex) => (
              <div key={relIndex} className="bg-white rounded-lg p-4 border border-gray-200">
                {/* Relationship Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${getRelationshipStyle(rel.relationship_type).badge}`}>
                    {rel.relationship_type}
                  </div>
                  {!rel.is_verified && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-amber-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-xs">
                            <div className="font-semibold mb-1">Unverified Relationship</div>
                            <div className="text-xs text-gray-300">
                              Raw value: {rel.raw_relationship_type}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                
                {/* Ownership Chain */}
                <div className="space-y-2">
                  {rel.chain.map((step, stepIndex) => (
                    <div key={stepIndex} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                        {stepIndex + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{step.name}</div>
                        <div className="text-xs text-gray-500">
                          {step.relationship_type || step.type}
                        </div>
                      </div>
                      {step.ultimate && (
                        <div className="text-xs text-blue-600 font-medium">🎯 Ultimate</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Enhanced linear ownership trail for simple chains
const LinearOwnershipTrail: React.FC<{ 
  steps: OwnershipStep[];
  logos: Record<string, string | null>;
  loadingLogos: Record<string, boolean>;
}> = ({ steps, logos, loadingLogos }) => {
  return (
    <div className="mb-6">
      <div className="font-semibold text-lg mb-2 flex items-center gap-2">
        <span role="img" aria-label="ownership">🧬</span> Ownership Chain
      </div>
      
      <div className="flex overflow-x-auto gap-3 pb-2">
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <OwnershipStepCard 
              step={step} 
              logoUrl={logos[step.name]} 
              isLoadingLogo={loadingLogos[step.name]} 
            />
            {i < steps.length - 1 && (
              <div className="flex items-center self-center">
                <ArrowRight className="h-5 w-5 text-gray-300" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Main enhanced ownership trail component
const EnhancedOwnershipTrail: React.FC<EnhancedOwnershipTrailProps> = ({ steps }) => {
  const [logos, setLogos] = useState<Record<string, string | null>>({});
  const [loadingLogos, setLoadingLogos] = useState<Record<string, boolean>>({});

  // Async logo fetching with timeout
  useEffect(() => {
    const fetchLogos = async () => {
      console.log('🔄 Starting async logo fetching for', steps.length, 'entities');
      
      for (const step of steps) {
        const companyName = step.name;
        if (!companyName || logos[companyName] !== undefined || loadingLogos[companyName]) continue;

        setLoadingLogos(prev => ({ ...prev, [companyName]: true }));
        
        try {
          console.log(`🔍 Fetching logo for: ${companyName}`);
          const logoUrl = await findCompanyLogoWithTimeout(companyName, 1000);
          
          if (logoUrl) {
            console.log(`✅ Found logo for ${companyName}: ${logoUrl}`);
          } else {
            console.log(`⏰ Timeout or no logo found for ${companyName}`);
          }
          
          setLogos(prev => ({ ...prev, [companyName]: logoUrl }));
        } catch (error) {
          console.warn(`⚠️ Logo fetch failed for ${companyName}:`, error);
          setLogos(prev => ({ ...prev, [companyName]: null }));
        } finally {
          setLoadingLogos(prev => ({ ...prev, [companyName]: false }));
        }
      }
    };

    fetchLogos();
  }, [steps, logos, loadingLogos]);

  // Detect ambiguous ownership
  const ambiguousGroups = detectAmbiguousOwnership(steps);
  
  // If we have ambiguous ownership, show the enhanced display
  if (ambiguousGroups.length > 0) {
    return <AmbiguousOwnershipDisplay groups={ambiguousGroups} />;
  }
  
  // Otherwise, show the linear trail
  return <LinearOwnershipTrail steps={steps} logos={logos} loadingLogos={loadingLogos} />;
};

export default EnhancedOwnershipTrail; 
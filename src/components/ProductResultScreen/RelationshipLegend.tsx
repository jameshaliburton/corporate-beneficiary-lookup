import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, CheckCircle, AlertCircle, Filter } from 'lucide-react';

export interface RelationshipType {
  key: string;
  label: string;
  description: string;
  color: string;
  isVerified: boolean;
  examples: string[];
}

const relationshipTypes: RelationshipType[] = [
  {
    key: 'brand',
    label: 'Brand',
    description: 'The original brand or product name',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    isVerified: true,
    examples: ['Kit Kat', 'Lipton', 'Vaseline']
  },
  {
    key: 'ultimate_owner',
    label: 'Ultimate Owner',
    description: 'The final parent company that controls the brand',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    isVerified: true,
    examples: ['Nestlé S.A.', 'Unilever PLC']
  },
  {
    key: 'subsidiary',
    label: 'Subsidiary',
    description: 'A company owned by another company',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    isVerified: true,
    examples: ['Mondelez Holdings LLC']
  },
  {
    key: 'licensed_manufacturer',
    label: 'Licensed Manufacturer',
    description: 'Company licensed to manufacture the product',
    color: 'bg-green-100 text-green-800 border-green-200',
    isVerified: true,
    examples: ['The Hershey Company']
  },
  {
    key: 'joint_venture_partner',
    label: 'Joint Venture Partner',
    description: 'Company in a joint venture agreement',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    isVerified: true,
    examples: ['Pepsi Lipton International']
  },
  {
    key: 'parent',
    label: 'Parent Company',
    description: 'Immediate parent company',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    isVerified: true,
    examples: ['Unilever Personal Care']
  },
  {
    key: 'unknown',
    label: 'Unknown',
    description: 'Relationship type not yet verified',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    isVerified: false,
    examples: ['Various unverified relationships']
  }
];

export interface RelationshipLegendProps {
  showUnverifiedOnly?: boolean;
  onFilterChange?: (showUnverifiedOnly: boolean) => void;
}

const RelationshipLegend: React.FC<RelationshipLegendProps> = ({ 
  showUnverifiedOnly = false, 
  onFilterChange 
}) => {
  const [showUnverified, setShowUnverified] = useState(showUnverifiedOnly);

  const handleFilterChange = (value: boolean) => {
    setShowUnverified(value);
    onFilterChange?.(value);
  };

  const filteredTypes = showUnverified 
    ? relationshipTypes.filter(type => !type.isVerified)
    : relationshipTypes;

  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Relationship Types</h3>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showUnverified}
              onChange={(e) => handleFilterChange(e.target.checked)}
              className="rounded border-gray-300"
            />
            Show unverified only
          </label>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredTypes.map((type) => (
          <div key={type.key} className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50">
            {/* Badge */}
            <div className="flex-shrink-0">
              <Badge variant="outline" className={`text-xs ${type.color}`}>
                {type.label}
              </Badge>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{type.label}</span>
                {type.isVerified ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CheckCircle className="h-4 w-4 text-green-500" />
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
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-w-xs">
                          <div className="font-semibold mb-1">Unverified Relationship Type</div>
                          <div className="text-xs text-gray-300">
                            This relationship type needs verification and may be inaccurate.
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{type.description}</p>
              
              {type.examples.length > 0 && (
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Examples:</span> {type.examples.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <HelpCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">About Relationship Types</div>
            <p className="text-xs">
              Relationship types help you understand how companies are connected. 
              Verified types are confirmed reliable, while unverified types may need review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelationshipLegend; 
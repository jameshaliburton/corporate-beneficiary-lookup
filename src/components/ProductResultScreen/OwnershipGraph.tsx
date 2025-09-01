import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Download } from 'lucide-react';
import { findCompanyLogoWithTimeout } from '@/lib/services/logo-finder';

export interface OwnershipGraphNode {
  id: string;
  name: string;
  type: string;
  relationship_type?: string;
  raw_relationship_type?: string;
  is_verified?: boolean;
  country?: string;
  flag?: string;
  logoUrl?: string | null;
  isUltimate?: boolean;
}

export interface OwnershipGraphEdge {
  id: string;
  source: string;
  target: string;
  relationship_type?: string;
  raw_relationship_type?: string;
  is_verified?: boolean;
}

export interface OwnershipGraphProps {
  nodes: OwnershipGraphNode[];
  edges: OwnershipGraphEdge[];
  title?: string;
}

// Custom node component for ownership entities
const OwnershipNode: React.FC<{ data: OwnershipGraphNode }> = ({ data }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(data.logoUrl || null);
  const [isLoadingLogo, setIsLoadingLogo] = useState(false);

  // Fetch logo if not provided
  useEffect(() => {
    if (!data.logoUrl && !logoUrl && !isLoadingLogo) {
      setIsLoadingLogo(true);
      findCompanyLogoWithTimeout(data.name, 1000)
        .then(url => {
          setLogoUrl(url);
          setIsLoadingLogo(false);
        })
        .catch(() => {
          setIsLoadingLogo(false);
        });
    }
  }, [data.name, data.logoUrl, logoUrl, isLoadingLogo]);

  // Get relationship style
  const getRelationshipStyle = (relationshipType?: string) => {
    const styles: Record<string, { bg: string; text: string; border: string; badge: string }> = {
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

    if (!relationshipType) return styles.unknown;
    return styles[relationshipType] || styles.unknown;
  };

  const style = getRelationshipStyle(data.relationship_type);

  return (
    <div className={`${style.bg} rounded-xl shadow-lg p-4 border-2 ${data.isUltimate ? 'border-blue-500' : style.border} min-w-[160px] max-w-[200px]`}>
      {/* Logo or Flag Display */}
      <div className="mb-3 flex items-center justify-center">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={`${data.name} logo`}
            className="w-12 h-12 object-contain rounded-full"
            onError={() => setLogoUrl(null)}
          />
        ) : isLoadingLogo ? (
          <div className="w-12 h-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
          </div>
        ) : (
          <div className="text-3xl">{data.flag || '🏢'}</div>
        )}
      </div>
      
      {/* Company Name */}
      <div className="font-bold text-sm mb-2 text-center leading-tight">{data.name}</div>
      
      {/* Relationship Type Badge */}
      <div className="flex items-center gap-1 mb-2 justify-center">
        <Badge variant="outline" className={`text-xs ${style.badge}`}>
          {data.relationship_type || data.type || 'Unknown'}
        </Badge>
        {data.is_verified === false && data.raw_relationship_type && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 text-amber-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  <div className="font-semibold mb-1">Unverified Relationship Type</div>
                  <div className="text-xs text-gray-300">
                    Raw value: {data.raw_relationship_type}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {/* Ultimate Owner Indicator */}
      {data.isUltimate && (
        <div className="text-xs text-blue-700 font-bold mt-1 flex items-center gap-1 justify-center">
          🎯 Ultimate Owner
        </div>
      )}
    </div>
  );
};

const OwnershipGraph: React.FC<OwnershipGraphProps> = ({ nodes, edges, title = "Ownership Structure" }) => {
  const exportGraph = () => {
    // Simple export functionality - could be enhanced later
    const graphData = {
      title,
      nodes,
      edges,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-ownership-graph.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full border rounded-lg overflow-hidden bg-white">
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={exportGraph}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex flex-wrap gap-6 justify-center">
          {nodes.map((node, index) => (
            <div key={node.id} className="flex flex-col items-center">
              <OwnershipNode data={node} />
              
              {/* Connection line to next node */}
              {index < nodes.length - 1 && (
                <div className="flex items-center mt-4 mb-4">
                  <div className="w-8 h-0.5 bg-gray-300"></div>
                  <div className="mx-2">
                    <Badge variant="outline" className="text-xs bg-white">
                      {edges[index]?.relationship_type || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="w-8 h-0.5 bg-gray-300"></div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Relationship Types:</h4>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(nodes.map(n => n.relationship_type).filter(Boolean))).map(type => (
              <Badge key={type} variant="outline" className="text-xs">
                {type}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnershipGraph; 
import { ArrowDown } from "lucide-react";

interface OwnershipNode {
  name: string;
  country: string;
  countryFlag: string;
  avatar: string;
  logoUrl?: string; // Optional logo URL from authoritative sources
  type?: string; // "Brand", "Parent Company", "Subsidiary", etc.
}

interface OwnershipChainProps {
  nodes: OwnershipNode[];
  brandTheme?: {
    primary: string;
    accent: string;
    gradient: string;
  };
  // Additional metadata for the brand (first node)
  structureType?: string;
  acquisitionYear?: number;
  publicTicker?: string;
}

export function OwnershipChain({ 
  nodes, 
  brandTheme, 
  structureType, 
  acquisitionYear, 
  publicTicker 
}: OwnershipChainProps) {
  if (nodes.length === 0) return null;

  const getNodeType = (index: number) => {
    if (index === 0) return "Brand";
    if (index === nodes.length - 1) return "Ultimate Owner";
    return "Parent Company";
  };

  const getNodeMetadata = (index: number) => {
    const metadata = [];
    
    // Country pill for all nodes
    metadata.push({
      type: 'country',
      content: (
        <>
          <span className="text-xs">{nodes[index].countryFlag}</span>
          <span className="text-[12px] font-medium text-foreground">
            {nodes[index].country}
          </span>
        </>
      )
    });

    // Structure type for all nodes that have it
    const nodeStructureType = index === 0 ? structureType : nodes[index].type;
    if (nodeStructureType) {
      metadata.push({
        type: 'structure',
        content: (
          <span className="text-[12px] font-medium text-foreground">
            {nodeStructureType}
          </span>
        )
      });
    }

    // Ticker symbol for nodes that have it (typically ultimate owner)
    if (index === nodes.length - 1 && publicTicker) {
      metadata.push({
        type: 'ticker',
        content: (
          <span className="text-[12px] font-medium text-foreground">
            {publicTicker}
          </span>
        )
      });
    }

    // Acquisition year for brand node
    if (index === 0 && acquisitionYear) {
      metadata.push({
        type: 'year',
        content: (
          <span className="text-[12px] font-medium text-foreground">
            Est. {acquisitionYear}
          </span>
        )
      });
    }

    return metadata;
  };

  return (
    <div className="space-y-card-gap-sm">
      {nodes.map((node, index) => {
        const isFirstNode = index === 0;
        const isLastNode = index === nodes.length - 1;
        const nodeMetadata = getNodeMetadata(index);
        
        return (
          <div key={index} className="flex flex-col items-center">
            {/* Node Container */}
            <div className={`glass-card p-card-gap space-y-2 w-full max-w-xs transition-all duration-200 border border-accent/30 rounded-component ${
              isLastNode 
                ? 'ring-1 ring-primary-glow/40 bg-muted/30' // Ultimate owner emphasis
                : isFirstNode 
                  ? 'ring-1 ring-primary-glow/40 bg-muted/20' // Brand styling - now with bright ring
                  : 'bg-muted/25' // Parent companies
            }`}>
              
              {/* Logo and Main Info */}
              <div className="flex items-start gap-3">
                {/* Circular avatar - larger size */}
                {node.logoUrl ? (
                  <img 
                    src={node.logoUrl} 
                    alt={`${node.name} logo`}
                    className={`rounded-full object-contain border-2 border-border/20 flex-shrink-0 bg-white ${
                      isLastNode ? 'h-12 w-12' : 'h-11 w-11'
                    }`}
                    onError={(e) => {
                      // Fallback to initials avatar if logo fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = node.avatar;
                      target.onerror = null; // Prevent infinite loop
                    }}
                  />
                ) : (
                  <img 
                    src={node.avatar} 
                    alt={`${node.name} logo`}
                    className={`rounded-full object-cover border-2 border-border/20 flex-shrink-0 ${
                      isLastNode ? 'h-12 w-12' : 'h-11 w-11'
                    }`}
                  />
                )}
                
                {/* Company name and type */}
                <div className="flex-1 min-w-0 space-y-0">
                  <h3 className="text-subheadline text-foreground whitespace-normal break-words leading-snug">
                    {node.name}
                  </h3>
                  <p className="text-small font-medium text-muted-foreground mt-0.5">
                    {getNodeType(index)}
                  </p>
                </div>
              </div>
              
              {/* Metadata Pills */}
              {nodeMetadata.length > 0 && (
                <div className="flex flex-wrap gap-1 pl-[56px] -mt-1">
                  {nodeMetadata.map((meta, metaIndex) => (
                    <div 
                      key={metaIndex}
                      className="inline-flex items-center gap-1 h-5 px-1.5 rounded-full bg-background/50 backdrop-blur-sm border border-border/30"
                    >
                      {meta.content}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Refined connector with marching ants animation */}
            {index < nodes.length - 1 && (
              <div className="flex flex-col items-center -mt-0.5 mb-1.5 relative z-10">
                {/* Smaller connection point circle - positioned to intersect border */}
                <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-sm mb-1 relative z-10"></div>
                {/* Vertical line with marching ants animation */}
                <div className="w-0.5 h-5 rounded-full marching-ants-bright"></div>
                {/* Brighter, smaller arrow */}
                <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-accent mt-1"></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
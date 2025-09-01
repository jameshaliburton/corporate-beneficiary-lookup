import { OwnershipCard } from "./OwnershipCard";
import { ChevronDown } from "lucide-react";

interface OwnershipEntity {
  name: string;
  logo?: string;
  country: string;
  countryFlag: string;
  relationshipType: string;
  isVerified: boolean;
}

interface OwnershipTrailProps {
  entities: OwnershipEntity[];
  onEntityClick?: (entity: OwnershipEntity) => void;
}

export const OwnershipTrail = ({ entities, onEntityClick }: OwnershipTrailProps) => {
  if (entities.length === 0) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">🔗 Ownership Trail</h2>
      
      <div className="relative max-w-[500px] mx-auto">
        {/* Vertical connector line with gradient - only if more than one entity */}
        {entities.length > 1 && (
          <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20"></div>
        )}
        
        <div className="space-y-3">
          {entities.map((entity, index) => (
            <div key={index} className="relative">
              {/* Timeline dot centered on card logo - only if more than one entity */}
              {entities.length > 1 && (
                <div className="absolute left-3 top-5 w-4 h-4 bg-primary rounded-full border-2 border-background z-10 shadow-sm"></div>
              )}
              
              {/* Entity card with left margin for timeline only if multiple entities */}
              <div className={entities.length > 1 ? "ml-10" : ""}>
                <OwnershipCard
                  {...entity}
                  onClick={() => onEntityClick?.(entity)}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* End dot for visual completion - only if more than one entity */}
        {entities.length > 1 && (
          <div className="absolute left-3 bottom-1 w-4 h-4 bg-primary/30 rounded-full border-2 border-background"></div>
        )}
      </div>
    </div>
  );
};
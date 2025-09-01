import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface MoreDetailsProps {
  country?: string;
  ownershipType?: string;
  parentCompany?: string;
  stockTicker?: string;
  yearFounded?: number;
  countryFlag?: string;
}

export const MoreDetails = ({ 
  country, 
  ownershipType, 
  parentCompany, 
  stockTicker, 
  yearFounded,
  countryFlag 
}: MoreDetailsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if no details are provided
  if (!country && !ownershipType && !parentCompany && !stockTicker && !yearFounded) {
    return null;
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-3">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full p-0 h-auto hover:bg-transparent"
        >
          <span className="text-lg font-semibold">More Details</span>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </Button>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4 pt-0">
          {country && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Country of Incorporation:</span>
              <div className="flex items-center gap-2">
                {countryFlag && <span>{countryFlag}</span>}
                <span className="font-semibold">{country}</span>
              </div>
            </div>
          )}
          
          {ownershipType && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Ownership Type:</span>
              <span className="font-semibold">{ownershipType}</span>
            </div>
          )}
          
          {parentCompany && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Parent Company:</span>
              <span className="font-semibold">{parentCompany}</span>
            </div>
          )}
          
          {stockTicker && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Stock Ticker:</span>
              <span className="font-semibold font-mono">{stockTicker}</span>
            </div>
          )}
          
          {yearFounded && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Year Founded:</span>
              <span className="font-semibold">{yearFounded}</span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
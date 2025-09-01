import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Verified, AlertTriangle } from "lucide-react";

interface OwnershipCardProps {
  name: string;
  logo?: string;
  country: string;
  countryFlag: string;
  relationshipType: string;
  isVerified: boolean;
  onClick?: () => void;
}

export const OwnershipCard = ({ 
  name, 
  logo, 
  country, 
  countryFlag, 
  relationshipType, 
  isVerified,
  onClick 
}: OwnershipCardProps) => {
  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'brand':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'parent':
      case 'company':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'ultimate_owner':
      case 'ultimate owner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ultimate_owner':
        return 'Ultimate Owner';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <Card 
      className={`hover:shadow-md transition-all duration-200 rounded-xl shadow-sm max-w-[500px] ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Logo */}
          {logo ? (
            <img 
              src={logo} 
              alt={`${name} logo`}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">
                {name.charAt(0)}
              </span>
            </div>
          )}

          {/* Entity info */}
          <div className="flex-1 min-w-0">
            {/* Country row - above name */}
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs">{countryFlag}</span>
              <span className="text-xs text-muted-foreground">{country}</span>
              <Badge 
                variant="secondary" 
                className={`text-xs ml-auto ${getTypeColor(relationshipType)}`}
              >
                {getTypeLabel(relationshipType)}
              </Badge>
            </div>
            
            {/* Name and verification */}
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base truncate">{name}</h3>
              {isVerified ? (
                <Verified className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
import { ConfidenceBadge } from "@/components/ConfidenceBadge";

interface ExposéHeadlineProps {
  brand: string;
  owner: string;
  confidence: number;
  structureType?: string;
  ultimateOwnerCountry?: string;
}

// Helper functions for exposé headline
const getCountryAdjective = (country: string): string => {
  const adjectives: Record<string, string> = {
    'USA': 'American',
    'United States': 'American',
    'Switzerland': 'Swiss',
    'UK': 'British',
    'United Kingdom': 'British',
    'Germany': 'German',
    'France': 'French',
    'Japan': 'Japanese',
    'China': 'Chinese',
    'Italy': 'Italian',
    'Netherlands': 'Dutch',
    'Sweden': 'Swedish',
    'South Korea': 'South Korean',
    'Brazil': 'Brazilian',
    'India': 'Indian',
    'Canada': 'Canadian',
    'Australia': 'Australian'
  };
  return adjectives[country] || country;
};

const getCategoryEmoji = (category: string): string => {
  const emojis: Record<string, string> = {
    'beauty': '💄',
    'chocolate': '🍫', 
    'consumer goods': '🧴',
    'skincare': '🧴',
    'food': '🍽️',
    'beverage': '🥤',
    'fashion': '👗',
    'technology': '💻',
    'automotive': '🚗',
    'pharmaceutical': '💊',
    'cosmetics': '💄'
  };
  return emojis[category.toLowerCase()] || '🏢';
};

export function ExposéHeadline({ 
  brand, 
  owner, 
  confidence, 
  structureType,
  ultimateOwnerCountry
}: ExposéHeadlineProps) {
  // Generate exposé headline data
  const countryAdjective = ultimateOwnerCountry ? getCountryAdjective(ultimateOwnerCountry) : '';
  const category = structureType || 'consumer goods';
  const categoryEmoji = getCategoryEmoji(category);

  return (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-3 text-3xl md:text-4xl font-bold">
          <span>{categoryEmoji}</span>
          <span className="text-foreground">{brand}</span>
        </div>
        <div className="text-xl md:text-2xl text-foreground">
          is part of a <span className="text-foreground">{countryAdjective} {category} giant</span>
        </div>
        <div className="text-2xl md:text-3xl font-bold text-primary">
          {owner}
        </div>
      </div>
      
      {/* Confidence Badge */}
      <div className="flex justify-center">
        <ConfidenceBadge confidence={confidence} />
      </div>
    </div>
  );
} 
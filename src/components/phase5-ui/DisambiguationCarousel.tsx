import React from 'react';

interface DisambiguationOption {
  id: string;
  name: string;
  description?: string;
  confidence?: number;
  type?: string;
  country?: string;
  countryFlag?: string;
  suggested?: boolean;
  logo?: string;
  confidence_score?: number;
  tagline?: string;
}

interface DisambiguationCarouselProps {
  options?: DisambiguationOption[];
  entities?: DisambiguationOption[];
  onSelect?: (option: DisambiguationOption) => void;
  onChoose?: (option: DisambiguationOption) => void;
  searchTerm?: string;
  onNotSure?: () => void;
}

export function DisambiguationCarousel({ options, entities, onSelect, onChoose, searchTerm, onNotSure }: DisambiguationCarouselProps) {
  const items = entities || options || [];
  const handleSelect = onChoose || onSelect;
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Multiple options found for "{searchTerm || 'your search'}"
      </h3>
      <p className="text-sm text-gray-600">Please select the correct option:</p>
      
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleSelect(item)}
            className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-gray-900">{item.name}</div>
            {item.description && (
              <div className="text-sm text-gray-600 mt-1">{item.description}</div>
            )}
            {(item.confidence || item.confidence_score) && (
              <div className="text-xs text-gray-500 mt-1">
                Confidence: {(item.confidence || item.confidence_score)}%
              </div>
            )}
          </button>
        ))}
      </div>
      
      {onNotSure && (
        <button
          onClick={onNotSure}
          className="w-full p-3 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
        >
          I'm not sure - show me more options
        </button>
      )}
    </div>
  );
}

export function DisambiguationScreen({ options, onSelect }: DisambiguationCarouselProps) {
  return DisambiguationCarousel({ options, onSelect });
}

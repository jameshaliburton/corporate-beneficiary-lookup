"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface DisambiguationOption {
  id: string;
  name: string;
  country?: string;
  countryFlag?: string;
  website?: string;
  confidence?: number;
  source?: "registry" | "web" | "ai";
  normalizedName?: string;
  // Enhanced fields for better disambiguation
  description?: string;
  financial_beneficiary?: string;
  product_name?: string;
  ownership_flow?: any[];
}

interface DisambiguationChooserProps {
  brand: string;
  options: DisambiguationOption[];
  activeEntityId?: string;
  onSelect?: (option: DisambiguationOption) => void;
  decisionRules?: string[];
}

export default function DisambiguationChooser({ brand, options, activeEntityId, onSelect, decisionRules }: DisambiguationChooserProps) {
  const router = useRouter();

  // Analytics events
  const fireAnalytics = (event: string, data: any) => {
    console.info(`[Analytics] ${event}:`, data);
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({ event, ...data });
    }
  };

  // Copy link to clipboard
  const copyLink = async (entityId: string) => {
    const deepLink = `${window.location.origin}/result/${encodeURIComponent(brand)}?entityId=${encodeURIComponent(entityId)}`;
    try {
      await navigator.clipboard.writeText(deepLink);
      fireAnalytics('disambiguation_copy_link', { brand, entity_id: entityId });
      // Simple toast - could be enhanced with a proper toast system
      console.info('✅ Link copied to clipboard');
    } catch (err) {
      console.warn('Failed to copy link:', err);
    }
  };

  const handleSelect = (option: DisambiguationOption) => {
    if (onSelect) {
      onSelect(option);
    }
    
    fireAnalytics('disambiguation_choose', { 
      brand, 
      entity_id: option.id, 
      index: options.indexOf(option)
    });
    
    const targetBrand = option.normalizedName || option.name;
    const url = `/result/${encodeURIComponent(targetBrand)}?entityId=${encodeURIComponent(option.id)}`;
    router.push(url);
  };

  // Fire view analytics on mount
  React.useEffect(() => {
    fireAnalytics('disambiguation_view', { 
      brand, 
      option_count: options.length
    });
  }, [brand, options.length]);

  if (!options || options.length === 0) {
    return (
      <div className="mb-6 p-4 bg-muted/50 rounded-lg border text-center text-muted-foreground">
        We couldn't find multiple entities for '{brand}'.
      </div>
    );
  }

  console.log("[DisambiguationChooser] Rendering with options:", options);
  return (
    <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
      <div style={{background: 'red', color: 'white', padding: '5px', marginBottom: '10px', fontSize: '12px'}}>
        DISAMBIGUATION CHOOSER RENDERING - {options.length} options
      </div>
      
            {/* Change selection link */}
      {activeEntityId && (
        <div className="mb-3">
          <button
            onClick={() => router.push(`/result/${encodeURIComponent(brand)}`)}
            className="text-sm text-primary hover:underline"
          >
            ← Change selection
          </button>
        </div>
      )}

      {/* Language hint */}
      {decisionRules && decisionRules.includes('language_contradiction') && (
        <div className="mb-3 p-2 bg-blue-50 text-blue-800 text-xs rounded border border-blue-200">
          🌐 Language mismatch influenced this result
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">We found multiple matches — pick the one you meant</h3>
        <button
          onClick={() => {
            // TODO: Implement search wider functionality
            console.log('Search wider clicked for brand:', brand);
          }}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          🔎 Not seeing it? Search wider
        </button>
      </div>
      
      <div className="space-y-2" role="list">
        {options.map((option, index) => {
          const isActive = activeEntityId === option.id;
          return (
            <div key={index} role="listitem" className={`p-3 bg-background rounded-lg border transition-colors ${isActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                  {option.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    {option.name}
                    {isActive && <span className="text-primary">✓</span>}
                  </div>
                  {/* Show product name if different from option name */}
                  {option.product_name && option.product_name !== option.name && (
                    <div className="text-sm text-muted-foreground">
                      Product: {option.product_name}
                    </div>
                  )}
                  {/* Show financial beneficiary */}
                  {option.financial_beneficiary && (
                    <div className="text-sm text-muted-foreground">
                      Owned by: {option.financial_beneficiary}
                    </div>
                  )}
                  {/* Show country if available */}
                  {option.country && option.country !== "Unknown" && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      {option.countryFlag && <span>{option.countryFlag}</span>}
                      <span>{option.country}</span>
                    </div>
                  )}
                  {/* Show confidence score */}
                  {option.confidence && option.confidence > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Confidence: {option.confidence}%
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyLink(option.id)}
                    className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded hover:bg-muted"
                    aria-label={`Copy link for ${option.name}`}
                  >
                    Copy link
                  </button>
                  <button
                    onClick={() => handleSelect(option)}
                    disabled={isActive}
                    className={`px-3 py-1 text-sm rounded ${isActive ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                    aria-pressed={isActive}
                  >
                    {isActive ? 'Chosen' : 'Choose'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

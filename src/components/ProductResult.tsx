import { Building2, ArrowRight, ChevronDown, ChevronUp, Share2, Camera, Eye, Search, Building, Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { TraceSection } from "./TraceSection";
import { OwnershipChain } from "./OwnershipChain";
import { ShareModal } from "./ShareModal";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatTraceStages } from "@/lib/utils/trace-formatter";
import { findCompanyLogoWithTimeout } from "@/lib/services/logo-finder";

interface ProductResultProps {
  brand: string;
  owner: string;
  confidence: number;
  productImage?: string;
  brandTheme?: BrandTheme;
  traces?: TraceData[];
  ownershipChain?: OwnershipNode[];
  structureType?: string;
  analysisText?: string;
  acquisitionYear?: number;
  publicTicker?: string;
  // LLM-generated copy for engaging storytelling
  generatedCopy?: {
    headline: string;
    subheadline: string;
    description: string;
    countryFact: string;
    traceSummary: {
      vision: string;
      retrieval: string;
      mapping: string;
    };
  };
}

interface OwnershipNode {
  name: string;
  country: string;
  countryFlag: string;
  avatar: string;
  logoUrl?: string; // Optional logo URL from authoritative sources
}

interface BrandTheme {
  primary: string;
  accent: string;
  gradient: string;
}

interface TraceData {
  stage: "vision" | "retrieval" | "ownership";
  status: "success" | "partial" | "failed";
  details: string;
  sources?: string[];
  duration?: number;
}

export function ProductResult({ 
  brand, 
  owner, 
  confidence, 
  productImage,
  brandTheme,
  traces = [],
  ownershipChain = [],
  structureType,
  analysisText,
  acquisitionYear,
  publicTicker,
  generatedCopy
}: ProductResultProps) {

  const [showTrace, setShowTrace] = useState(true);
  const [showMoreDetails, setShowMoreDetails] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [logos, setLogos] = useState<Record<string, string | null>>({});
  const router = useRouter();

  // Async logo fetching with timeout
  useEffect(() => {
    if (ownershipChain.length === 0) return;

    console.log('🔄 Starting async logo fetching for', ownershipChain.length, 'entities');

    ownershipChain.forEach(async (entity) => {
      const companyName = entity.name;
      if (!companyName || logos[companyName] !== undefined) return;

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
      }
    });
  }, [ownershipChain, logos]);

  // Apply dynamic theming when brand theme is provided
  const dynamicStyle = brandTheme ? {
    '--brand-primary': brandTheme.primary,
    '--brand-accent': brandTheme.accent,
    '--brand-gradient': brandTheme.gradient
  } as React.CSSProperties : {};

  // Create ownership chain with logos
  const ownershipChainWithLogos = ownershipChain.map(entity => ({
    ...entity,
    logoUrl: logos[entity.name] || undefined
  }));

  return (
    <div className="w-full max-w-md space-y-6" style={dynamicStyle}>
      
      {/* Top Section - No Card */}
      <div className="text-center">
        {/* Product Image - Larger, centered */}
        {productImage && (
          <div className="flex justify-center mb-6">
            <img 
              src={productImage} 
              alt={brand}
              className="h-32 w-32 object-cover rounded-full border-2 border-border/20 animate-reveal-slide"
            />
          </div>
        )}
        
        {/* Brand and Owner Names */}
        <div className="space-y-2 mb-6">
          <h2 className="text-headline text-foreground animate-reveal-slide" style={{ animationDelay: '0.1s' }}>
            {brand}
          </h2>
          {generatedCopy ? (
            <>
              <p className="text-subheadline text-foreground animate-reveal-slide" style={{ animationDelay: '0.2s' }}>
                {generatedCopy.headline}
              </p>
              <p className="text-body text-muted-foreground animate-reveal-slide" style={{ animationDelay: '0.25s' }}>
                {generatedCopy.subheadline}
              </p>
            </>
          ) : (
            <p className="text-subheadline text-muted-foreground animate-reveal-slide" style={{ animationDelay: '0.2s' }}>
              {owner}
            </p>
          )}
        </div>
        
        {/* Confidence Badge */}
        <div className="flex justify-center animate-reveal-slide" style={{ animationDelay: '0.3s' }}>
          <ConfidenceBadge confidence={confidence} />
        </div>
      </div>

      {/* Ownership Chain - Individual Cards */}
      {ownershipChain.length > 0 && (
        <div className="mt-8 animate-reveal-slide" style={{ animationDelay: '0.4s' }}>
          <OwnershipChain 
            nodes={ownershipChainWithLogos} 
            brandTheme={brandTheme}
            structureType={structureType}
            acquisitionYear={acquisitionYear}
            publicTicker={publicTicker}
          />
        </div>
      )}
      
      {/* Share Button - Close to Chain */}
      <div className="mt-6 animate-reveal-slide" style={{ animationDelay: '0.5s' }}>
        <Button 
          onClick={() => setShowShareModal(true)}
          className="w-full h-btn-primary rounded-component font-bold"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share Ownership Reveal
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Gradient Divider */}
      <div className="py-6 flex justify-center">
        <div className="w-[80%] h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent"></div>
      </div>

      {/* More Details Card */}
      {(structureType || analysisText) && (
        <Card className={`transition-smooth glass-card rounded-component animate-reveal-slide ${brandTheme ? 'brand-themed' : ''}`} style={{ animationDelay: '0.6s' }}>
          <CardHeader className="pb-card-gap-sm p-card-padding">
            <Button
              variant="ghost"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="flex items-center justify-between w-full p-0 h-auto hover:bg-transparent"
            >
              <span className="text-small font-medium">
                The Story of {ownershipChain.length > 0 ? ownershipChain[ownershipChain.length - 1]?.name : 'This Company'}
              </span>
              {showMoreDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CardHeader>
          
          {showMoreDetails && (
            <CardContent className="space-y-card-gap p-card-padding pt-0 animate-accordion-down">
              {/* Country and Structure Type - Side by Side */}
              <div className="flex items-center gap-4">
                {ownershipChain.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-body">
                      {ownershipChain[ownershipChain.length - 1]?.countryFlag}
                    </span>
                    <span className="text-body font-bold text-foreground">
                      {ownershipChain[ownershipChain.length - 1]?.country}
                    </span>
                  </div>
                )}
                {structureType && (
                  <span className="text-body font-bold text-foreground">
                    {structureType}
                  </span>
                )}
              </div>
              
              {/* Analysis Text */}
              {generatedCopy?.description && (
                <p className="text-body text-foreground leading-[140%]">
                  {generatedCopy.description}
                </p>
              )}
              {!generatedCopy?.description && analysisText && (
                <p className="text-body text-foreground leading-[140%]">
                  {analysisText}
                </p>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Behind the Scenes Card */}
      {traces.length > 0 && (
        <Card className={`transition-smooth glass-card rounded-component animate-reveal-slide ${brandTheme ? 'brand-themed' : ''}`} style={{ animationDelay: '0.7s' }}>
          <CardHeader className="pb-card-gap-sm p-card-padding">
            <Button
              variant="ghost"
              onClick={() => setShowTrace(!showTrace)}
              className="flex items-center justify-between w-full p-0 h-auto hover:bg-transparent"
            >
              <span className="text-small font-medium">Behind the Scenes</span>
              {showTrace ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CardHeader>
          
          {showTrace && (
            <CardContent className="space-y-card-gap-sm p-card-padding pt-0 animate-accordion-down">
              {/* Only show real execution trace - no static fallback */}
              {traces && traces.length > 0 ? (
                // Show actual execution trace using exact Lovable styling from TraceSection.tsx
                <div className="space-y-3">
                  {formatTraceStages(traces).map((section, sectionIndex) => {
                    const getStageConfig = (title: string) => {
                      switch (title) {
                        case "Vision Analysis":
                          return {
                            icon: Eye,
                            color: "trace-vision"
                          };
                        case "Data Retrieval":
                          return {
                            icon: Search,
                            color: "trace-retrieval"
                          };
                        case "Ownership Mapping":
                          return {
                            icon: Building,
                            color: "trace-ownership"
                          };
                        default:
                          return {
                            icon: Search,
                            color: "trace-retrieval"
                          };
                      }
                    };

                    const config = getStageConfig(section.title);
                    const StageIcon = config.icon;

                    return (
                      <div key={sectionIndex} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                        <div className={`flex-shrink-0 p-2 rounded-full bg-muted ${config.color}`}>
                          <StageIcon className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium">{section.title}</h4>
                              <Check className="h-3 w-3 text-success" />
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {section.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // No trace data available
                <div className="text-sm text-muted-foreground">
                  No trace information available for this search.
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Scan Another Product Button */}
      <div className="pt-card-gap pb-6 animate-reveal-slide" style={{ animationDelay: '0.8s' }}>
        <Button 
          onClick={() => router.push('/')}
          variant="outline"
          className="w-full h-btn-primary rounded-component font-medium"
        >
          <Camera className="h-4 w-4 mr-2" />
          Scan Another Product
        </Button>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        brand={brand}
        owner={owner}
        productImage={productImage}
        ownershipChain={ownershipChainWithLogos}
        generatedCopy={generatedCopy}
      />
    </div>
  );
}
import { Building2, ArrowRight, ChevronDown, ChevronUp, Share2, Camera } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { TraceSection } from "./TraceSection";
import { OwnershipChain } from "./OwnershipChain";
import { ShareModal } from "./ShareModal";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatTraceStages } from "@/lib/utils/trace-formatter";

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
  const router = useRouter();

  // Apply dynamic theming when brand theme is provided
  const dynamicStyle = brandTheme ? {
    '--brand-primary': brandTheme.primary,
    '--brand-accent': brandTheme.accent,
    '--brand-gradient': brandTheme.gradient
  } as React.CSSProperties : {};

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
            nodes={ownershipChain} 
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
              <span className="text-small font-medium">More Details</span>
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
              {generatedCopy?.traceSummary ? (
                // Use LLM-generated trace summaries
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-foreground">Vision Analysis</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {generatedCopy.traceSummary.vision}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-foreground">Data Retrieval</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {generatedCopy.traceSummary.retrieval}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-foreground">Ownership Mapping</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {generatedCopy.traceSummary.mapping}
                    </p>
                  </div>
                </div>
              ) : (
                // Fallback to original trace formatting
                formatTraceStages(traces).map((section, sectionIndex) => (
                  <div key={sectionIndex} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-foreground">{section.title}</h4>
                      <span className="text-xs text-muted-foreground">{section.description}</span>
                    </div>
                    <div className="space-y-2">
                      {section.stages.map((trace, traceIndex) => (
                        <TraceSection key={`${sectionIndex}-${traceIndex}`} {...trace} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Scan Another Product Button */}
      <div className="pt-card-gap animate-reveal-slide" style={{ animationDelay: '0.8s' }}>
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
        ownershipChain={ownershipChain}
        generatedCopy={generatedCopy}
      />
    </div>
  );
}
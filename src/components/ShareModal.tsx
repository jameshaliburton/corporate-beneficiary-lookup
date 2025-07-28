import { X, ArrowRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: string;
  owner: string;
  productImage?: string;
  ownershipChain?: Array<{
    name: string;
    country: string;
    countryFlag: string;
    avatar: string;
  }>;
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

export function ShareModal({ 
  isOpen, 
  onClose, 
  brand, 
  owner, 
  productImage,
  ownershipChain = [],
  generatedCopy
}: ShareModalProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  
  const handleCopyLink = async () => {
    try {
      // Create deep link to result page
      const deepLink = `${window.location.origin}/result/${brand.toLowerCase().replace(/\s+/g, '-')}`;
      await navigator.clipboard.writeText(deepLink);
      setCopySuccess(true);
      
      // Show fun toast message
      toast({
        description: "✅ Link copied – now spill the tea!",
        duration: 3000,
      });
      
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast({
        description: "❌ Failed to copy link. Please try again.",
        duration: 3000,
      });
    }
  };

  // Get ultimate owner's country info
  const ultimateOwner = ownershipChain[ownershipChain.length - 1];
  const ownerCountry = ultimateOwner ? ultimateOwner.country : '';
  const countryFlag = ultimateOwner ? ultimateOwner.countryFlag : '';

  // Generate country-focused headline
  const getCountryHeadline = () => {
    if (ownerCountry === 'USA') {
      return `${brand} is part of a US beauty empire 👀`;
    } else if (ownerCountry === 'France') {
      return `${brand} is owned by French luxury giants 👀`;
    } else if (ownerCountry === 'UK') {
      return `${brand} is controlled by British conglomerates 👀`;
    } else if (ownerCountry === 'Germany') {
      return `${brand} is part of a German business empire 👀`;
    } else if (ownerCountry) {
      return `${brand} is owned by a ${ownerCountry} powerhouse 👀`;
    } else {
      return `${brand} isn't as independent as you think 👀`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border border-accent/30 max-w-sm mx-auto p-card-padding rounded-component">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-card-gap-sm right-card-gap-sm h-8 w-8 rounded-full hover:bg-muted/50 z-10"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="space-y-card-gap text-center">
          {/* Hero Section */}
          <div className="space-y-card-gap-sm">
            {/* Product Image */}
            {productImage && (
              <div className="flex justify-center">
                <img 
                  src={productImage} 
                  alt={brand}
                  className="h-24 w-24 object-cover rounded-full border-3 border-border/30 shadow-lg"
                />
              </div>
            )}
            
            {/* Large Country Flag */}
            {countryFlag && (
              <div className="flex justify-center">
                <span className="text-4xl" role="img" aria-label={`${ownerCountry} flag`}>
                  {countryFlag}
                </span>
              </div>
            )}
          </div>

          {/* Country-Focused Headline */}
          <h2 className="text-subheadline text-foreground leading-tight">
            {generatedCopy?.headline || getCountryHeadline()}
          </h2>
          
          {/* AI-Powered Story */}
          <p className="text-body text-muted-foreground leading-relaxed">
            {generatedCopy?.description || `Our AI agents found that ${brand} is owned by ${owner} ${countryFlag}, a global powerhouse in beauty and fashion.`}
          </p>

          {/* Ownership Chain Recap */}
          <div className="bg-muted/20 rounded-component p-card-gap-sm border border-border/20">
            <div className="flex items-center justify-center gap-card-gap-sm text-small">
              <span className="font-medium text-foreground">{brand}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">
                {owner} ({ownerCountry || 'Unknown'})
              </span>
            </div>
          </div>

          {/* Copy Link Button */}
          <Button 
            onClick={handleCopyLink}
            className="w-full h-btn-primary rounded-component text-body font-bold bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary transition-all duration-300 shadow-lg"
            disabled={copySuccess}
          >
            {copySuccess ? '✅ Copied!' : '📋 Copy Link'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
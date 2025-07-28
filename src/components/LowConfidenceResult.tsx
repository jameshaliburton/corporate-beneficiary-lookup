import { RotateCcw, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LowConfidenceResultProps {
  brandName: string;
  brandLogo?: string;
  onRetrycan: () => void;
  onSearchManually: () => void;
}

export function LowConfidenceResult({ 
  brandName, 
  brandLogo, 
  onRetrycan, 
  onSearchManually 
}: LowConfidenceResultProps) {
  return (
    <div className="w-full max-w-md space-y-4">
      {/* Main Result Card */}
      <Card className="card-hover glass-card animate-reveal-slide">
        <CardContent className="p-6 space-y-5">
          
          {/* Brand Logo - Circular, 112px */}
          {brandLogo && (
            <div className="flex justify-center">
              <img 
                src={brandLogo} 
                alt={brandName}
                className="h-28 w-28 object-cover rounded-full border-2 border-border/20 opacity-75"
              />
            </div>
          )}
          
          {/* Headline and Brand */}
          <div className="text-center space-y-3">
            <h2 className="text-xl font-bold text-foreground">
              We think it might be…
            </h2>
            <div className="p-4 rounded-lg bg-muted/30 border border-border/20">
              <p className="text-lg font-semibold text-foreground">{brandName}</p>
            </div>
          </div>
          
          {/* Uncertainty indicator */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-amber-500/20 border border-amber-500/30">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Low Confidence
              </span>
            </div>
          </div>
          
          {/* Subtext */}
          <p className="text-center text-sm text-muted-foreground leading-relaxed">
            Our AI agents aren't 100% sure. Try rescanning or confirm manually.
          </p>
          
          {/* Action Buttons */}
          <div className="space-y-3 mt-6 pt-4">
            <Button 
              onClick={onRetrycan}
              className="w-full h-[52px] font-bold"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry Scan
            </Button>
            
            <button
              onClick={onSearchManually}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Search by name instead
            </button>
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
}
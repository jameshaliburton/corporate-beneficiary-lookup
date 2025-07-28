import { RotateCcw, Search, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FailedScanResultProps {
  onTryAgain: () => void;
  onEnterManually: () => void;
}

export function FailedScanResult({ onTryAgain, onEnterManually }: FailedScanResultProps) {
  const tips = [
    "Better lighting on the logo",
    "Point directly at the brand name", 
    "Try a different angle or distance"
  ];

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Main Result Card */}
      <Card className="card-hover glass-card animate-reveal-slide">
        <CardContent className="p-6 space-y-5">
          
          {/* Failure Icon */}
          <div className="flex justify-center">
            <div className="h-28 w-28 rounded-full bg-muted/30 border-2 border-border/20 flex items-center justify-center">
              <Search className="h-12 w-12 text-muted-foreground/50" />
            </div>
          </div>
          
          {/* Headline */}
          <div className="text-center space-y-3">
            <h2 className="text-xl font-bold text-foreground">
              We couldn't figure this one out.
            </h2>
          </div>
          
          {/* Error indicator */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-destructive/20 border border-destructive/30">
              <div className="w-2 h-2 rounded-full bg-destructive"></div>
              <span className="text-sm font-medium text-destructive">
                Scan Failed
              </span>
            </div>
          </div>
          
          {/* Explanation */}
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground leading-relaxed">
              Sometimes scans fail if the logo is unclear or the brand is too new.
            </p>
            
            {/* Tips section */}
            <div className="bg-muted/20 border border-border/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-foreground">Try:</span>
              </div>
              <ul className="space-y-1">
                {tips.map((tip, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/50"></div>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3 mt-6 pt-4">
            <Button 
              onClick={onTryAgain}
              className="w-full h-[52px] font-bold"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <button
              onClick={onEnterManually}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Enter brand/company manually
            </button>
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
}
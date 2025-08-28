import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface BehindTheScenesStep {
  title: string;
  status: string;
  details: string;
  sources?: string[];
  duration?: string;
}

interface BehindTheScenesProps {
  steps: BehindTheScenesStep[];
  languageSignal?: {
    detected_codes?: string[];
    cluster?: string;
    strength?: 'strong' | 'mixed' | 'weak';
    rationale?: string;
  };
  decisionRules?: string[];
  disambiguationEngine?: string;
}

export const BehindTheScenes = ({ steps, languageSignal, decisionRules, disambiguationEngine }: BehindTheScenesProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Always show the section for consistent layout, even if no steps

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-3">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full p-0 h-auto hover:bg-transparent"
        >
          <span className="text-lg font-semibold">Behind the Scenes</span>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </Button>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4 pt-0">
          {/* Decision Engine Version */}
          {disambiguationEngine && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                Decision engine: {disambiguationEngine}
              </span>
            </div>
          )}

          {/* Language Signal Display */}
          {languageSignal && languageSignal.strength !== 'weak' && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🌐</span>
              <span className="text-sm font-medium">
                Languages: {languageSignal.detected_codes?.join(', ').toUpperCase()} ({languageSignal.strength})
              </span>
            </div>
          )}

          {/* Decision Rules Display */}
          {decisionRules && decisionRules.length > 0 && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <span className="text-xs font-medium text-muted-foreground">Decision notes:</span>
              <div className="mt-1 space-y-1">
                {decisionRules.slice(0, 3).map((rule, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    • {rule}
                  </div>
                ))}
              </div>
            </div>
          )}

          {steps.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Here's how we found and verified this ownership chain:
              </p>
              
              {steps.map((step, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{step.status}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{step.title}</span>
                        {step.duration && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {step.duration}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.details}
                      </p>
                      
                      {step.sources && step.sources.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">Sources:</span>
                          {step.sources.map((source, sourceIndex) => (
                            <a
                              key={sourceIndex}
                              href={source}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {source.replace('https://', '').replace('http://', '')}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {index < steps.length - 1 && <div className="border-l-2 border-muted ml-3 h-4" />}
                </div>
              ))}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No behind the scenes information available for this search.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
};
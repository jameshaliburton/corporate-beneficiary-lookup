"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationEvidence {
  supporting_evidence?: string[];
  contradicting_evidence?: string[];
  neutral_evidence?: string[];
  missing_evidence?: string[];
  summary?: string;
}

interface VerificationDetailsPanelProps {
  status: "confirmed" | "contradicted" | "mixed_evidence" | "insufficient_evidence";
  evidence?: VerificationEvidence;
  confidenceChange?: "increased" | "decreased" | "unchanged";
  verificationMethod?: string;
  className?: string;
}

export const VerificationDetailsPanel: React.FC<VerificationDetailsPanelProps> = ({ 
  status, 
  evidence, 
  confidenceChange,
  verificationMethod,
  className 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle missing evidence gracefully
  if (!evidence || Object.values(evidence).every(arr => Array.isArray(arr) ? arr.length === 0 : !arr)) {
    return (
      <div className="w-full max-w-2xl border border-border/20 rounded-lg p-4 bg-muted/10">
        <div className="text-sm text-muted-foreground text-center">
          <p className="mb-2">No supporting or contradicting evidence was found during the AI verification process.</p>
          {verificationMethod && (
            <p className="text-xs italic">
              Verified using {verificationMethod.includes('gemini') ? 'Gemini (Google)' : 'Claude (Anthropic)'} AI model
            </p>
          )}
        </div>
      </div>
    );
  }

  const getPanelConfig = () => {
    switch (status) {
      case 'confirmed':
      case 'mixed_evidence':
        return {
          title: 'How do we verify this?',
          icon: CheckCircle,
          className: 'bg-green-900/10 border-green-500/30',
          headerClassName: 'text-green-400',
          iconClassName: 'text-green-400'
        };
      case 'contradicted':
      case 'insufficient_evidence':
      default:
        return {
          title: 'Verification Details',
          icon: AlertTriangle,
          className: 'bg-blue-900/10 border-blue-500/30',
          headerClassName: 'text-blue-400',
          iconClassName: 'text-blue-400'
        };
    }
  };

  const config = getPanelConfig();
  const Icon = config.icon;

  const supportingEvidence = evidence.supporting_evidence || [];
  const contradictingEvidence = evidence.contradicting_evidence || [];
  const neutralEvidence = evidence.neutral_evidence || [];
  const missingEvidence = evidence.missing_evidence || [];

  const hasEvidence = supportingEvidence.length > 0 || 
                     contradictingEvidence.length > 0 || 
                     neutralEvidence.length > 0 || 
                     missingEvidence.length > 0;

  if (!hasEvidence) return null;

  return (
    <Card className={cn("w-full max-w-2xl border", config.className, className)}>
      <CardHeader className="pb-3">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center justify-between w-full p-0 h-auto font-medium",
            config.headerClassName
          )}
        >
          <div className="flex items-center gap-2">
            <Icon className={cn("w-4 h-4", config.iconClassName)} />
            <span>{config.title}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Source Attribution */}
          {verificationMethod && (
            <div className="text-xs text-muted-foreground italic mb-2 pb-2 border-b border-border/20">
              Verified using {verificationMethod.includes('gemini') ? 'Gemini (Google)' : 'Claude (Anthropic)'} AI model
            </div>
          )}
          {/* Supporting Evidence */}
          {supportingEvidence.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-green-400">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Supporting Evidence
              </h4>
              <ul className="space-y-2">
                {supportingEvidence.map((item, index) => (
                  <li key={index} className="text-sm text-gray-300 bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contradicting Evidence */}
          {contradictingEvidence.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-blue-400">
                <AlertTriangle className="w-4 h-4 text-blue-400" />
                Contradicting Evidence
              </h4>
              <ul className="space-y-2">
                {contradictingEvidence.map((item, index) => (
                  <li key={index} className="text-sm text-gray-300 bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Neutral Evidence */}
          {neutralEvidence.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-gray-400">
                <HelpCircle className="w-4 h-4 text-gray-400" />
                Neutral Evidence
              </h4>
              <ul className="space-y-2">
                {neutralEvidence.map((item, index) => (
                  <li key={index} className="text-sm text-gray-400 bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Evidence */}
          {missingEvidence.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-gray-400">
                <HelpCircle className="w-4 h-4 text-gray-400" />
                Missing Evidence
              </h4>
              <ul className="space-y-2">
                {missingEvidence.map((item, index) => (
                  <li key={index} className="text-sm text-gray-500 bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary */}
          {evidence.summary && (
            <div className="bg-muted/30 p-3 rounded-lg border border-border/20">
              <p className="text-sm text-foreground font-medium mb-1">Summary</p>
              <p className="text-sm text-muted-foreground">{evidence.summary}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

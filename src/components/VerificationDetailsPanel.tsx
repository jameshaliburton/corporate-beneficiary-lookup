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
  verificationNotes?: string; // Add verification notes from main result
  className?: string;
}

export const VerificationDetailsPanel: React.FC<VerificationDetailsPanelProps> = ({ 
  status, 
  evidence, 
  confidenceChange,
  verificationNotes,
  className 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Enhanced logging for debugging
  console.log('[VerificationDetailsPanel] Component received props:', {
    status,
    evidence,
    confidenceChange,
    hasEvidence: !!evidence,
    evidenceKeys: evidence ? Object.keys(evidence) : [],
    evidenceValues: evidence ? {
      supporting_evidence: evidence.supporting_evidence?.length || 0,
      contradicting_evidence: evidence.contradicting_evidence?.length || 0,
      neutral_evidence: evidence.neutral_evidence?.length || 0,
      missing_evidence: evidence.missing_evidence?.length || 0,
      summary: evidence.summary
    } : null
  });

  if (!evidence) {
    console.log('[VerificationDetailsPanel] No evidence provided, returning null');
    return null;
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

  // Enhanced evidence checking - render panel even if evidence arrays are empty
  // This ensures we show verification details even for "insufficient_evidence" cases
  const shouldRenderPanel = hasEvidence || evidence.summary || verificationNotes || status === 'insufficient_evidence';

  console.log('[VerificationDetailsPanel] Evidence analysis:', {
    supportingEvidenceCount: supportingEvidence.length,
    contradictingEvidenceCount: contradictingEvidence.length,
    neutralEvidenceCount: neutralEvidence.length,
    missingEvidenceCount: missingEvidence.length,
    hasEvidence,
    hasSummary: !!evidence.summary,
    status,
    shouldRenderPanel
  });

  // Check if we need to show low confidence explanation
  const hasLowConfidence = supportingEvidence.length === 0 && status === 'insufficient_evidence';

  if (!shouldRenderPanel) {
    console.log('[VerificationDetailsPanel] No evidence to render, returning null');
    return null;
  }

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
          {/* Low Confidence Explanation */}
          {hasLowConfidence && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <h4 className="font-medium text-sm text-yellow-400">Low Confidence Assessment</h4>
              </div>
              <p className="text-sm text-gray-300">
                No clear evidence found. Confidence remains low until verified through additional research or official documentation.
              </p>
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
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 font-medium mb-1">Summary</p>
              <p className="text-sm text-gray-600">{evidence.summary}</p>
            </div>
          )}

          {/* Verification Notes from main result */}
          {verificationNotes && (
            <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30">
              <div className="flex items-start gap-2 text-blue-400">
                <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium mb-1">Verification Analysis</p>
                  <p className="text-sm text-gray-300">{verificationNotes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Fallback: Show message when no evidence arrays have content */}
          {!hasEvidence && !evidence.summary && !verificationNotes && (
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400">
                <HelpCircle className="w-4 h-4" />
                <p className="text-sm">
                  {status === 'insufficient_evidence' 
                    ? 'Limited verification data available. Additional research may be needed to confirm ownership details.'
                    : 'Verification analysis completed. No specific evidence items to display at this time.'
                  }
                </p>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

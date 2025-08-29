"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Camera, ChevronDown, ChevronUp, Building2, MapPin, TrendingUp, CheckCircle, AlertTriangle, HelpCircle, ExternalLink } from "lucide-react";
import { OwnershipResult, NarrativeFields } from '@/lib/services/narrative-generator-v3';

interface VerificationStatusBadgeProps {
  status: string;
  confidenceChange?: string;
  evidence?: any;
}

const VerificationStatusBadge: React.FC<VerificationStatusBadgeProps> = ({ 
  status, 
  confidenceChange, 
  evidence 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'confirmed':
        return {
          icon: CheckCircle,
          label: 'Verified by Gemini',
          className: 'bg-green-100 text-green-800 border-green-200',
          tooltip: 'Gemini AI has verified this ownership claim with supporting evidence.'
        };
      case 'contradicted':
        return {
          icon: AlertTriangle,
          label: '⚠️ Verification failed',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          tooltip: 'Gemini found evidence that contradicts this result.'
        };
      case 'inconclusive':
      default:
        return {
          icon: HelpCircle,
          label: 'Could not verify',
          className: 'bg-gray-100 text-gray-600 border-gray-200',
          tooltip: 'Gemini couldn\'t confirm or deny the claim based on available data.'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <div 
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${config.className}`}
        title={config.tooltip}
      >
        <Icon className="w-4 h-4" />
        {config.label}
      </div>
      {confidenceChange && (
        <span className="text-xs text-gray-500">
          ({confidenceChange})
        </span>
      )}
    </div>
  );
};

interface VerificationEvidencePanelProps {
  status: string;
  evidence?: any;
  confidenceChange?: string;
}

const VerificationEvidencePanel: React.FC<VerificationEvidencePanelProps> = ({ 
  status, 
  evidence, 
  confidenceChange 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPanelConfig = () => {
    switch (status) {
      case 'confirmed':
        return {
          title: 'How do we verify this?',
          icon: CheckCircle,
          className: 'bg-green-50 border-green-200',
          headerClassName: 'text-green-800',
          iconClassName: 'text-green-600'
        };
      case 'contradicted':
        return {
          title: 'Verification Details',
          icon: AlertTriangle,
          className: 'bg-yellow-50 border-yellow-200',
          headerClassName: 'text-yellow-800',
          iconClassName: 'text-yellow-600'
        };
      default:
        return {
          title: 'Verification Details',
          icon: HelpCircle,
          className: 'bg-gray-50 border-gray-200',
          headerClassName: 'text-gray-800',
          iconClassName: 'text-gray-600'
        };
    }
  };

  const config = getPanelConfig();
  const Icon = config.icon;

  if (!evidence) return null;

  const supportingEvidence = evidence.supporting_evidence || [];
  const contradictingEvidence = evidence.contradicting_evidence || [];
  const missingEvidence = evidence.missing_evidence || [];

  return (
    <div className={`w-full max-w-2xl border rounded-lg ${config.className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-opacity-80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${config.iconClassName}`} />
          <span className={`font-medium ${config.headerClassName}`}>
            {config.title}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-opacity-20">
          <div className="pt-4 space-y-4">
            {/* Confidence Change */}
            {confidenceChange && (
              <div className="text-sm">
                <span className="font-medium">Confidence Change:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  confidenceChange === 'increased' ? 'bg-green-100 text-green-800' :
                  confidenceChange === 'decreased' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {confidenceChange}
                </span>
              </div>
            )}

            {/* Supporting Evidence */}
            {supportingEvidence.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Supporting Evidence
                </h4>
                <ul className="space-y-2">
                  {supportingEvidence.map((item: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700 bg-white p-2 rounded border">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contradicting Evidence */}
            {contradictingEvidence.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Contradicting Evidence
                </h4>
                <ul className="space-y-2">
                  {contradictingEvidence.map((item: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700 bg-white p-2 rounded border">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Evidence */}
            {missingEvidence.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-gray-600" />
                  Missing Evidence
                </h4>
                <ul className="space-y-2">
                  {missingEvidence.map((item: string, index: number) => (
                    <li key={index} className="text-sm text-gray-600 bg-white p-2 rounded border">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Summary */}
            {evidence.summary && (
              <div className="bg-white p-3 rounded border">
                <h4 className="font-medium text-sm mb-2">Summary</h4>
                <p className="text-sm text-gray-700">{evidence.summary}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ProductResultV2Props {
  result: OwnershipResult;
  narrative?: NarrativeFields;
  onScanAnother?: () => void;
  onShare?: () => void;
}

export default function ProductResultV2({ 
  result, 
  narrative,
  onScanAnother,
  onShare 
}: ProductResultV2Props) {
  const [showFullStory, setShowFullStory] = useState(false);
  const [showBehindTheScenes, setShowBehindTheScenes] = useState(false);
  const router = useRouter();

  // Get country flag emoji
  const getCountryFlag = (country?: string): string => {
    if (!country || country === 'Unknown') return '🏳️';
    const flags: Record<string, string> = {
      'Sweden': '🇸🇪', 'Netherlands': '🇳🇱', 'United States': '🇺🇸', 'Germany': '🇩🇪',
      'France': '🇫🇷', 'United Kingdom': '🇬🇧', 'UK': '🇬🇧', 'Japan': '🇯🇵',
      'China': '🇨🇳', 'Switzerland': '🇨🇭', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
      'Italy': '🇮🇹', 'Spain': '🇪🇸', 'Denmark': '🇩🇰', 'Norway': '🇳🇴',
      'Finland': '🇫🇮', 'South Korea': '🇰🇷', 'Brazil': '🇧🇷', 'India': '🇮🇳',
      'Mexico': '🇲🇽'
    };
    return flags[country] || '🏳️';
  };

  // Get confidence badge color
  const getConfidenceColor = (confidence?: number): string => {
    if (!confidence) return 'bg-muted/30 text-muted-foreground';
    if (confidence >= 80) return 'bg-primary-glow/20 text-primary-glow';
    if (confidence >= 60) return 'bg-muted/30 text-muted-foreground';
    return 'bg-muted/30 text-muted-foreground';
  };

  const confidence = result.confidence || result.confidence_score || 0;
  const brandCountry = result.brand_country;
  const ownerCountry = result.ultimate_owner_country || result.financial_beneficiary_country;
  const owner = result.ultimate_owner || result.financial_beneficiary;

  // Debug logging for country data
  console.log('[ProductResultV2] Country data:', { 
    brandCountry, 
    ownerCountry, 
    brandFlag: getCountryFlag(brandCountry), 
    ownerFlag: getCountryFlag(ownerCountry) 
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header Section - No Card Styling, Center-Aligned */}
      <div className="space-y-6 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            {result.brand_name || 'Unknown Brand'}
          </h1>
        </div>
        
        {/* Narrative Headline and Tagline */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-primary-glow">
            {narrative?.headline || 'Ownership Analysis'}
          </h2>
          <p className="text-lg text-muted-foreground italic">
            {narrative?.tagline || 'Discovering the ownership structure...'}
          </p>
        </div>
      </div>

      {/* Narrative Content - No Card Styling */}
      <div className="space-y-4">
        {/* Story */}
        <div className="bg-muted/30 p-6 rounded-component border border-border/20">
          <h3 className="font-semibold text-foreground mb-3">
            The story of {result.brand_name || 'this brand'}
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {narrative?.story || 'Analyzing ownership data...'}
          </p>
        </div>
      </div>

      {/* Ownership Summary */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Ownership Summary
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Brand Card */}
            <div className="glass-card p-4 border border-border/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-glow/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">{getCountryFlag(brandCountry)}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{result.brand_name || 'Unknown Brand'}</p>
                  <p className="text-sm text-muted-foreground">Brand{brandCountry ? ` • ${brandCountry}` : ''}</p>
                </div>
              </div>
            </div>
            
            {/* Arrow Down */}
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-muted/30 rounded-full flex items-center justify-center">
                <span className="text-muted-foreground">↓</span>
              </div>
            </div>
            
            {/* Ultimate Owner Card */}
            <div className="glass-card p-4 border border-border/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-glow/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">{getCountryFlag(ownerCountry)}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{owner || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">Ultimate Owner{ownerCountry ? ` • ${ownerCountry}` : ''}</p>
                </div>
              </div>
            </div>
            
                  {/* Verification Status Badge */}
      {result.verification_status && (
        <div className="flex flex-col items-center gap-4">
          <VerificationStatusBadge
            status={result.verification_status}
            confidenceChange={result.verification_confidence_change}
            evidence={result.verification_evidence}
          />
          
          {/* Verification Evidence Panel */}
          {result.verification_status !== 'inconclusive' && result.verification_evidence && (
            <VerificationEvidencePanel
              status={result.verification_status}
              evidence={result.verification_evidence}
              confidenceChange={result.verification_confidence_change}
            />
          )}
        </div>
      )}
            
            {/* Revenue Flow */}
            <div className="bg-muted/30 p-4 rounded-component border border-border/20">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary-glow" />
                <div>
                  <p className="font-medium text-foreground">
                    Revenue from {result.brand_name || 'this brand'} ultimately flows to {owner || 'Unknown'}
                  </p>
                  {ownerCountry && (
                    <p className="text-sm text-muted-foreground">
                      in {getCountryFlag(ownerCountry)} {ownerCountry}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ownership Notes */}
      {narrative?.ownership_notes && narrative.ownership_notes.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">Ownership Notes</h3>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {narrative.ownership_notes.map((note, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary-glow mt-1">•</span>
                  <span className="text-muted-foreground">{note}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Behind the Scenes */}
      {narrative?.behind_the_scenes && narrative.behind_the_scenes.length > 0 && (
        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => setShowBehindTheScenes(!showBehindTheScenes)}
              className="flex items-center gap-2 p-0 h-auto font-semibold text-lg"
            >
              🔎 Behind the Scenes ({narrative.behind_the_scenes.length})
              {showBehindTheScenes ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </CardHeader>
          {showBehindTheScenes && (
            <CardContent>
              <div className="space-y-3">
                {narrative.behind_the_scenes.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-component">
                    <div className="w-6 h-6 bg-primary-glow/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-primary-glow">{index + 1}</span>
                    </div>
                    <p className="text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Action Buttons - Stacked Vertically */}
      <div className="space-y-3 pt-4">
        <Button
          onClick={onScanAnother || (() => router.push('/'))}
          variant="outline"
          className="w-full h-12"
        >
          <Camera className="w-4 h-4 mr-2" />
          Scan Another Product
        </Button>
        <Button
          onClick={onShare || (() => console.log('Share functionality'))}
          className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share This Result
        </Button>
      </div>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed">
          <CardHeader>
            <h3 className="text-sm font-medium text-muted-foreground">Debug Info</h3>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Template Used: {narrative?.template_used || 'fallback'}</p>
              <p>Confidence: {confidence}%</p>
              <p>Brand Country: {brandCountry || 'Not available'}</p>
              <p>Owner Country: {ownerCountry || 'Not available'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

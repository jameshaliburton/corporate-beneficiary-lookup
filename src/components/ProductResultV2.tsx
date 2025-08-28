"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Camera, ChevronDown, ChevronUp, Building2, MapPin, TrendingUp } from "lucide-react";
import { OwnershipResult, NarrativeFields } from '@/lib/services/narrative-generator-v3';

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
    if (!confidence) return 'bg-gray-100 text-gray-800';
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const confidence = result.confidence || result.confidence_score || 0;
  const brandCountry = result.brand_country;
  const ownerCountry = result.ultimate_owner_country || result.financial_beneficiary_country;
  const owner = result.ultimate_owner || result.financial_beneficiary;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header Section - No Card Styling, Center-Aligned */}
      <div className="space-y-6 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            {result.brand_name || 'Unknown Brand'}
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <span>{getCountryFlag(brandCountry)} {brandCountry || 'Unknown'}</span>
            <span>•</span>
            <span>{getCountryFlag(ownerCountry)} {ownerCountry || 'Unknown'}</span>
          </div>
          <Badge className={getConfidenceColor(confidence)}>
            {confidence}% confidence
          </Badge>
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
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">{getCountryFlag(brandCountry)}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{result.brand_name || 'Unknown Brand'}</p>
                  <p className="text-sm text-gray-600">Brand</p>
                </div>
              </div>
              <div className="text-gray-400">→</div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">{getCountryFlag(ownerCountry)}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{owner || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">Ultimate Owner</p>
                </div>
              </div>
            </div>
            
            {/* Revenue Flow */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    Revenue from {result.brand_name || 'this brand'} ultimately flows to {owner || 'Unknown'}
                  </p>
                  <p className="text-sm text-green-600">
                    in {getCountryFlag(ownerCountry)} {ownerCountry || 'Unknown'}
                  </p>
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
                  <span className="text-blue-500 mt-1">•</span>
                  <span className="text-gray-700">{note}</span>
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
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <p className="text-gray-700">{step}</p>
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
            <h3 className="text-sm font-medium text-gray-500">Debug Info</h3>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Template Used: {narrative?.template_used || 'fallback'}</p>
              <p>Confidence: {confidence}%</p>
              <p>Brand Country: {brandCountry || 'Unknown'}</p>
              <p>Owner Country: {ownerCountry || 'Unknown'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ContextualCluesData {
  step: string;
  step_name: string;
  extracted_data: {
    brand_name: string;
    product_name: string;
    product_type: string;
    confidence: number;
    reasoning: string;
    language_indicators: string[];
    country_indicators: string[];
    product_style: string;
    packaging_characteristics: string[];
    regional_clues: string[];
    certification_marks: string[];
    store_brand_indicators: boolean;
    premium_indicators: boolean;
    dietary_indicators: string[];
    size_format: string;
  };
  raw_extraction: string;
  extraction_timestamp: string;
  quality_assessment?: {
    step: string;
    step_name: string;
    result: any;
    needs_escalation: boolean;
  };
  vision_agent?: {
    step: string;
    step_name: string;
    used: boolean;
    result?: any;
    improved_results?: boolean;
    reason?: string;
  };
}

interface ContextualCluesDisplayProps {
  contextualClues: ContextualCluesData;
}

const ContextualCluesDisplay: React.FC<ContextualCluesDisplayProps> = ({ contextualClues }) => {
  const { extracted_data, step_name, quality_assessment, vision_agent } = contextualClues;

  const formatClues = (clues: string[], label: string) => {
    if (!clues || clues.length === 0) return null;
    return (
      <div className="mb-2">
        <span className="text-sm font-medium text-gray-700">{label}: </span>
        <span className="text-sm text-gray-600">{clues.join(', ')}</span>
      </div>
    );
  };

  const formatBooleanClue = (value: boolean, label: string) => {
    if (value === undefined || value === null) return null;
    return (
      <div className="mb-2">
        <span className="text-sm font-medium text-gray-700">{label}: </span>
        <Badge variant={value ? "default" : "secondary"} className="text-xs">
          {value ? "Yes" : "No"}
        </Badge>
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Image Analysis Results
          <Badge variant="outline" className="text-xs">
            {step_name}
          </Badge>
        </CardTitle>
        <div className="text-sm text-gray-600">
          <div>Confidence: {extracted_data.confidence}%</div>
          <div>Extracted: {new Date(contextualClues.extraction_timestamp).toLocaleTimeString()}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Basic Product Info */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">📦 Product Information</h4>
            <div className="text-sm space-y-1">
              <div><span className="font-medium">Brand:</span> {extracted_data.brand_name}</div>
              <div><span className="font-medium">Product:</span> {extracted_data.product_name}</div>
              <div><span className="font-medium">Type:</span> {extracted_data.product_type}</div>
              <div><span className="font-medium">Size/Format:</span> {extracted_data.size_format}</div>
            </div>
          </div>

          {/* Contextual Clues */}
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">🔍 Contextual Clues</h4>
            <div className="text-sm space-y-1">
              {formatClues(extracted_data.language_indicators, "Languages")}
              {formatClues(extracted_data.country_indicators, "Country Indicators")}
              {extracted_data.product_style !== 'Unknown' && (
                <div><span className="font-medium">Style:</span> {extracted_data.product_style}</div>
              )}
              {formatClues(extracted_data.regional_clues, "Regional Indicators")}
              {formatClues(extracted_data.packaging_characteristics, "Packaging")}
              {formatClues(extracted_data.certification_marks, "Certifications")}
              {formatClues(extracted_data.dietary_indicators, "Dietary Features")}
              {formatBooleanClue(extracted_data.store_brand_indicators, "Store Brand")}
              {formatBooleanClue(extracted_data.premium_indicators, "Premium Product")}
            </div>
          </div>

          {/* Quality Assessment */}
          {quality_assessment && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">🧐 Quality Assessment</h4>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">Step:</span> {quality_assessment.step_name}</div>
                <div><span className="font-medium">Needs Escalation:</span> 
                  <Badge variant={quality_assessment.needs_escalation ? "destructive" : "default"} className="ml-1 text-xs">
                    {quality_assessment.needs_escalation ? "Yes" : "No"}
                  </Badge>
                </div>
                {quality_assessment.result && (
                  <div><span className="font-medium">Reasoning:</span> {quality_assessment.result.reasoning}</div>
                )}
              </div>
            </div>
          )}

          {/* Vision Agent */}
          {vision_agent && (
            <div className="bg-purple-50 p-3 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">👁️ Vision Agent</h4>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">Step:</span> {vision_agent.step_name}</div>
                <div><span className="font-medium">Used:</span> 
                  <Badge variant={vision_agent.used ? "default" : "secondary"} className="ml-1 text-xs">
                    {vision_agent.used ? "Yes" : "No"}
                  </Badge>
                </div>
                {vision_agent.used && vision_agent.improved_results && (
                  <div><span className="font-medium">Improved Results:</span> 
                    <Badge variant="default" className="ml-1 text-xs">Yes</Badge>
                  </div>
                )}
                {!vision_agent.used && vision_agent.reason && (
                  <div><span className="font-medium">Reason:</span> {vision_agent.reason}</div>
                )}
              </div>
            </div>
          )}

          {/* Reasoning */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">💭 Analysis Reasoning</h4>
            <div className="text-sm text-gray-700">
              {extracted_data.reasoning}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { ContextualCluesDisplay }; 
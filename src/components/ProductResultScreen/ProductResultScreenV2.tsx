'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Camera, Barcode, Edit, RefreshCw, Settings } from 'lucide-react';
import { RefineModal } from '../RefineModal';

interface OwnershipFlowCompany {
  name: string;
  country?: string;
  type?: string;
  source?: string;
  flag?: string;
  ultimate?: boolean;
}

interface TraceStep {
  name: string;
  duration?: number;
  status: 'started' | 'success' | 'error' | 'completed';
  error?: string;
  data?: any;
  stage?: string;
}

interface ProductResult {
  success: boolean;
  product_name?: string;
  brand?: string;
  barcode?: string;
  financial_beneficiary?: string;
  beneficiary_country?: string;
  beneficiary_flag?: string;
  confidence_score?: number;
  ownership_structure_type?: string;
  user_contributed?: boolean;
  ownership_flow?: OwnershipFlowCompany[];
  reasoning?: string;
  sources?: string[];
  result_type?: string;
  agent_execution_trace?: {
    trace_id?: string;
    stages?: any[];
    reasoning_chain?: any[];
    performance_metrics?: {
      total_duration_ms?: number;
      api_calls?: number;
    };
  };
  lookup_trace?: string[];
  requires_manual_entry?: boolean;
  // Vision-first pipeline additions
  vision_context?: {
    brand: string;
    productName: string;
    confidence: number;
    isSuccessful: boolean;
    reasoning: string;
  };
  pipeline_type?: 'vision_first' | 'legacy';
}

interface ProductResultScreenV2Props {
  result: ProductResult;
  onScanAnother: () => void;
  onManualEntry?: () => void;
  onConfirmResult?: () => void;
  onFlagIssue?: () => void;
}

export default function ProductResultScreenV2({
  result,
  onScanAnother,
  onManualEntry,
  onConfirmResult,
  onFlagIssue
}: ProductResultScreenV2Props) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [showTrace, setShowTrace] = useState(false);
  const [showRefineModal, setShowRefineModal] = useState(false);
  const [refinementLoading, setRefinementLoading] = useState(false);

  // Extract data with fallbacks
  const brandName = result.brand || 'Unknown Brand';
  const companyName = result.financial_beneficiary || 'Unknown Company';
  const productName = result.product_name;
  const confidenceScore = result.confidence_score || 0;
  const ownershipFlow = result.ownership_flow || [];
  const reasoning = result.reasoning || 'No reasoning provided';
  const sources = result.sources || [];
  
  // Determine detection method
  const wasBarcodeUsed = result.barcode && !result.barcode.startsWith('img_');
  let detectionMethod = wasBarcodeUsed ? '📱 Barcode scan' : '📷 Photo analysis';
  
  // Update detection method for vision-first pipeline
  if (result.pipeline_type === 'vision_first') {
    detectionMethod = '🤖 Vision-first analysis';
  }
  
  // Get confidence label and color
  const getConfidenceInfo = (score: number) => {
    if (score >= 90) return { label: 'Very High', color: 'bg-green-100 text-green-800', barColor: 'bg-green-500' };
    if (score >= 75) return { label: 'High', color: 'bg-blue-100 text-blue-800', barColor: 'bg-blue-500' };
    if (score >= 60) return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800', barColor: 'bg-yellow-500' };
    return { label: 'Low', color: 'bg-red-100 text-red-800', barColor: 'bg-red-500' };
  };

  const confidenceInfo = getConfidenceInfo(confidenceScore);

  // Extract trace steps from agent execution trace
  const getTraceSteps = (): TraceStep[] => {
    if (!result.agent_execution_trace?.stages) return [];
    
    return result.agent_execution_trace.stages.map((stage: any) => ({
      name: stage.name || 'Unknown Step',
      duration: stage.duration_ms,
      status: stage.status || 'completed',
      error: stage.error,
      data: stage.data,
      stage: stage.stage
    }));
  };

  const traceSteps = getTraceSteps();

  const handleRefine = async (refinementData: any) => {
    setRefinementLoading(true);
    try {
      const response = await fetch('/api/evaluation-rerun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trace_id: result.agent_execution_trace?.trace_id || `manual_${Date.now()}`,
          corrected_query: refinementData.corrected_query,
          original_result: result,
          refinement_data: refinementData
        })
      });

      const data = await response.json();
      if (data.success) {
        // Update the result with the refined data
        // For now, we'll just show a success message
        alert('Refinement completed successfully! Check the evaluation logs for details.');
      } else {
        alert('Refinement failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Refinement error:', error);
      alert('Refinement failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setRefinementLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 px-4 py-8">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Ownership Analysis Complete</h1>
        </div>

        {/* 1. Top Summary Block */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500">{detectionMethod}</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">{brandName}</h2>
                {productName && (
                  <p className="text-gray-600 mb-2">{productName}</p>
                )}
                {companyName && companyName !== 'Unknown' && companyName !== brandName && (
                  <div className="text-blue-700 font-semibold text-lg">{companyName}</div>
                )}
              </div>
              <div className="text-right">
                <Badge className={`${confidenceInfo.color} font-semibold`}>
                  {confidenceInfo.label} ({confidenceScore}%)
                </Badge>
              </div>
            </div>
            
            {/* Confidence Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${confidenceInfo.barColor}`}
                style={{ width: `${confidenceScore}%` }}
              />
            </div>
            
            {confidenceScore < 70 && (
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                ⚠️ This structure is estimated and may not be definitive.
              </p>
            )}
            
            {/* Vision Context Information */}
            {result.vision_context && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">Vision Analysis</span>
                  {result.vision_context.isSuccessful ? (
                    <Badge className="bg-green-100 text-green-800 text-xs">Successful</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-800 text-xs">Limited</Badge>
                  )}
                </div>
                
                {result.vision_context.isSuccessful ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Extracted Brand:</span>
                      <span className="font-medium">{result.vision_context.brand}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Extracted Product:</span>
                      <span className="font-medium">{result.vision_context.productName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Vision Confidence:</span>
                      <span className="font-medium">{result.vision_context.confidence}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-amber-700">
                    <p className="mb-2">Vision analysis was limited:</p>
                    <p className="text-xs italic">{result.vision_context.reasoning}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Ownership Structure */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              👥 Ownership Structure
            </h3>
            
            <div className="space-y-3">
              {Array.isArray(ownershipFlow) && ownershipFlow.length > 0 ? (
                ownershipFlow.map((entry, i) => {
                  if (typeof entry === 'string') {
                    return (
                      <div key={i} className="flex items-center gap-2 py-2 border-b last:border-b-0">
                        <span className="text-2xl">🏢</span>
                        <span className="font-semibold text-gray-700">{entry}</span>
                      </div>
                    );
                  } else if (typeof entry === 'object' && entry !== null) {
                    return (
                      <div key={i} className="flex items-center gap-2 py-2 border-b last:border-b-0">
                        <span className="text-2xl">{entry.flag || '🏢'}</span>
                        <span className="font-semibold text-gray-700">{entry.name}</span>
                        {entry.type && <span className="text-xs text-gray-500">({entry.type})</span>}
                        {entry.country && <span className="text-xs text-gray-400 ml-2">{entry.country}</span>}
                      </div>
                    );
                  }
                  return null;
                })
              ) : (
                <div className="text-gray-400 italic">No ownership structure found</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onScanAnother}
            variant="ghost"
            className="w-full py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <Camera className="w-4 h-4 mr-2" />
            📷 Scan Another Product
          </Button>
        </div>

        {/* 4. Explanation + Trace (Collapsible) */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            {/* Reasoning Section */}
            <div className="mt-6">
              <button
                className="flex items-center gap-2 text-pink-600 font-semibold mb-2 focus:outline-none"
                onClick={() => setShowReasoning(v => !v)}
              >
                <span>🧠 See how we researched this</span>
                {showReasoning ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {showReasoning && (
                <div className="bg-gray-50 rounded-lg p-4 border text-sm text-gray-700 whitespace-pre-line">
                  {reasoning}
                  {/* If sources exist, show them as a list */}
                  {sources && sources.length > 0 && (
                    <div className="mt-2">
                      <div className="font-semibold text-xs text-gray-500 mb-1">Sources:</div>
                      <ul className="list-disc pl-5">
                        {sources.map((src, i) => (
                          <li key={i} className="break-all"><a href={src} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{src}</a></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Trace Section */}
            <div className="mt-4">
              <button
                className="flex items-center gap-2 text-gray-700 font-semibold mb-2 focus:outline-none"
                onClick={() => setShowTrace(v => !v)}
              >
                <span>🔍 View step-by-step trace</span>
                {showTrace ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {showTrace && traceSteps.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border text-sm">
                  {traceSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-4 py-1 border-b last:border-b-0">
                      <span className="font-semibold text-gray-700">
                        {step.name || step.stage || `Step ${i + 1}`}
                      </span>
                      <span className={step.status === 'success' ? 'text-green-600' : step.status === 'error' ? 'text-red-600' : 'text-gray-500'}>
                        {step.status}
                      </span>
                      {step.duration !== undefined && (
                        <span className="text-xs text-gray-400 ml-auto">{step.duration}ms</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 5. Barcode Trace (Conditional Only) */}
        {wasBarcodeUsed && result.agent_execution_trace?.performance_metrics && (
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Barcode className="w-5 h-5" />
                Barcode Analysis
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Total Time:</span>
                  <span className="ml-2 font-medium">
                    {result.agent_execution_trace.performance_metrics.total_duration_ms}ms
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">API Calls:</span>
                  <span className="ml-2 font-medium">
                    {result.agent_execution_trace.performance_metrics.api_calls || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Result Type:</span>
                  <span className="ml-2 font-medium">{result.result_type || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Barcode:</span>
                  <span className="ml-2 font-medium font-mono">{result.barcode}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 6. Bottom Action Buttons */}
        <div className="flex flex-col gap-3">
          {onManualEntry && (
            <Button
              onClick={onManualEntry}
              variant="outline"
              className="w-full py-3 font-semibold border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              ✏️ Manual Entry
            </Button>
          )}
          
          <Button
            onClick={() => setShowRefineModal(true)}
            disabled={refinementLoading}
            variant="outline"
            className="w-full py-3 font-semibold border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <Settings className="w-4 h-4 mr-2" />
            {refinementLoading ? '🔄 Refining...' : '🛠️ Refine Result'}
          </Button>
          
          <Button
            onClick={onScanAnother}
            variant="ghost"
            className="w-full py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <Camera className="w-4 h-4 mr-2" />
            📷 Scan Another Product
          </Button>
        </div>

        {/* Debug Info (Hidden by default, but preserved) */}
        <details className="mt-8">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
            Debug Info
          </summary>
          <div className="mt-2 p-4 bg-gray-100 rounded text-xs font-mono text-gray-600 overflow-auto">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        </details>
      </div>

      {/* Refine Modal */}
      <RefineModal
        originalResult={result}
        trace={{
          trace_id: result.agent_execution_trace?.trace_id || `manual_${Date.now()}`,
          stages: result.agent_execution_trace?.stages || [],
          reasoning_chain: result.agent_execution_trace?.reasoning_chain || [],
          performance_metrics: result.agent_execution_trace?.performance_metrics || {}
        }}
        onRefine={handleRefine}
        onClose={() => setShowRefineModal(false)}
        isOpen={showRefineModal}
      />
    </div>
  );
} 
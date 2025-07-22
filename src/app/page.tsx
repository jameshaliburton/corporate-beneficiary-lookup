'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BarcodeScanner } from '../../components/BarcodeScanner';
import ProductCamera from '@/components/ProductCamera';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getStageInfo } from '@/lib/utils';
import ProductResultScreen from '@/components/ProductResultScreen/index';
import ProductResultScreenV2 from '@/components/ProductResultScreen/ProductResultScreenV2';
import BuildInfo from '@/components/BuildInfo';
import DisambiguationModal from '@/components/ProductResultScreen/DisambiguationModal';
import VisionFallbackModal from '@/components/ProductResultScreen/VisionFallbackModal';

interface OwnershipFlowCompany {
  name: string;
  country?: string;
  type?: string;
  source?: string;
}

interface ProductResult {
  success: boolean;
  product_name?: string;
  brand?: string;
  barcode?: string;
  financial_beneficiary?: string;
  beneficiary_country?: string;
  beneficiary_flag?: string;
  confidence?: number;
  verification_status?: string;
  sources?: string[];
  reasoning?: string;
  result_type?: string;
  error?: string;
  confidence_score?: number;
  ownership_structure_type?: string;
  user_contributed?: boolean;
  ownership_flow?: OwnershipFlowCompany[];
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

interface ProgressUpdate {
  type: 'connected' | 'progress';
  queryId?: string;
  stage?: string;
  status?: 'started' | 'success' | 'error' | 'completed';
  data?: any;
  error?: string;
  timestamp?: string;
  reasoning?: string;
  description?: string;
}

export default function Home() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProductResult | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showUserContribution, setShowUserContribution] = useState(false);
  const [userContribution, setUserContribution] = useState({ product_name: '', brand: '' });
  const [contributionReason, setContributionReason] = useState<string>('not_found'); // 'not_found' | 'insufficient_data'
  const [showContributionSuccess, setShowContributionSuccess] = useState(false);
  const [currentBarcode, setCurrentBarcode] = useState('');
  const [showLowConfidenceFallback, setShowLowConfidenceFallback] = useState(false);
  const [lowConfidenceData, setLowConfidenceData] = useState({
    product_name: '',
    brand: ''
  });
  const [showDemo, setShowDemo] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<any>(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  
  // New state for enhanced UX flow
  const [showDisambiguationModal, setShowDisambiguationModal] = useState(false);
  const [showVisionFallbackModal, setShowVisionFallbackModal] = useState(false);
  const [disambiguationCandidates, setDisambiguationCandidates] = useState<any[]>([]);
  const [visionFallbackReason, setVisionFallbackReason] = useState<string>('');
  
  // Progress tracking
  const [currentProgress, setCurrentProgress] = useState<ProgressUpdate | null>(null);
  const [progressHistory, setProgressHistory] = useState<ProgressUpdate[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const startProgressTracking = (queryId: string) => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Start new connection
    const eventSource = new EventSource(`/api/progress?queryId=${queryId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressUpdate = JSON.parse(event.data);
        
        if (data.type === 'progress') {
          setCurrentProgress(data);
          setProgressHistory(prev => [...prev, data]);
        }
      } catch (error) {
        console.error('Error parsing progress update:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Progress tracking error:', error);
      eventSource.close();
    };
  };

  const stopProgressTracking = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setCurrentProgress(null);
    setProgressHistory([]);
  };

  // Helper function to check if result has low confidence or unknown data
  const shouldShowLowConfidenceFallback = (result: ProductResult): boolean => {
    if (!result.success) return false;
    if (result.user_contributed) return false; // Don't show for user-contributed data
    
    const hasUnknownBrand = !result.brand || 
                           result.brand.toLowerCase().includes('unknown') || 
                           result.brand === 'N/A';
    const hasUnknownBeneficiary = !result.financial_beneficiary || 
                                 result.financial_beneficiary.toLowerCase().includes('unknown');
    const hasLowConfidence = typeof result.confidence_score === 'number' && result.confidence_score < 50;
    
    return hasUnknownBrand || hasUnknownBeneficiary || hasLowConfidence;
  };

  const handleBarcode = async (barcode: string, userData?: { product_name: string; brand: string }) => {
    setProcessing(true);
    setResult(null);
    setCurrentBarcode(barcode);
    setShowContributionSuccess(false);
    setShowLowConfidenceFallback(false);
    stopProgressTracking(); // Clear any existing progress
    
    try {
      const payload = userData 
        ? { barcode, product_name: userData.product_name, brand: userData.brand }
        : { barcode };
        
      const response = await fetch('/api/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      setResult(data);
      
      // Start progress tracking if we have a query ID
      if (data.agent_execution_trace?.query_id) {
        startProgressTracking(data.agent_execution_trace.query_id);
      }
      
      // Handle requires_manual_entry response
      if (data.requires_manual_entry && !userData) {
        console.log('Manual entry required:', data.reason);
        setContributionReason('insufficient_data');
        
        // Show a more prominent modal with options
        setShowUserContribution(true);
        
        // Pre-fill with any partial data from barcode lookup
        const partialData = {
          product_name: data.barcode_data?.product_name || data.product_name || '',
          brand: data.barcode_data?.brand || data.brand || ''
        };
        
        setUserContribution(partialData);
        setLowConfidenceData(partialData);
        
        // Don't show result screen, show manual entry form instead
        return;
      }
      
      // Show success message for user contributions
      if (data.success && userData) {
        setShowContributionSuccess(true);
      }
      
      // Check if we should show low confidence fallback (only for non-user-contributed results)
      if (data.success && !userData && shouldShowLowConfidenceFallback(data)) {
        setShowLowConfidenceFallback(true);
        setLowConfidenceData({
          product_name: data.product_name || '',
          brand: data.brand || ''
        });
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      setResult({
        success: false,
        error: 'Failed to process barcode. Please try again.'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleManualEntry = () => {
    setShowManualEntry(true);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      handleBarcode(manualBarcode.trim());
      setShowManualEntry(false);
      setManualBarcode('');
    }
  };

  const handleUserContributionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userContribution.brand.trim()) {
      handleBarcode(currentBarcode, userContribution);
      setShowUserContribution(false);
      setUserContribution({ product_name: '', brand: '' });
    }
  };

  const handleLowConfidenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lowConfidenceData.product_name.trim() && lowConfidenceData.brand.trim()) {
      handleBarcode(currentBarcode, lowConfidenceData);
      setShowLowConfidenceFallback(false);
      setLowConfidenceData({ product_name: '', brand: '' });
    }
  };

  const handleScanAnother = () => {
    setResult(null);
    setShowDemo(false);
    setShowCamera(false);
    setImageAnalysisResult(null);
    setShowUserContribution(false);
    setShowLowConfidenceFallback(false);
    setShowContributionSuccess(false);
    setShowFallbackModal(false);
    stopProgressTracking();
  };

  const handleImageCaptured = async (file: File) => {
    setImageProcessing(true);
    setShowCamera(false);
    setResult(null);
    setShowContributionSuccess(false);
    setShowLowConfidenceFallback(false);
    stopProgressTracking();

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.readAsDataURL(file);
      });

      console.log('🔍 Starting vision-first pipeline analysis...');
      
      // Call vision-first pipeline API
      const response = await fetch('/api/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: base64,
          evaluation_mode: true
        }),
      });

      const data = await response.json();
      setImageProcessing(false);

      console.log('📸 Vision-first API response:', {
        success: data.success,
        pipeline_type: data.pipeline_type,
        vision_context: data.vision_context,
        requires_manual_entry: data.requires_manual_entry
      });

      // Handle different response scenarios based on vision-first pipeline
      if (data.success) {
        // Success - check vision context
        if (data.vision_context && data.vision_context.isSuccessful) {
          console.log('✅ Vision extraction successful:', {
            brand: data.vision_context.brand,
            productName: data.vision_context.productName,
            confidence: data.vision_context.confidence
          });
          setResult(data);
          
          if (data.agent_execution_trace?.query_id) {
            startProgressTracking(data.agent_execution_trace.query_id);
          }
        } else if (data.vision_context && !data.vision_context.isSuccessful) {
          // Vision failed but we have a result
          console.log('⚠️ Vision extraction failed:', data.vision_context.reasoning);
          setResult(data);
          
          if (data.agent_execution_trace?.query_id) {
            startProgressTracking(data.agent_execution_trace.query_id);
          }
        } else {
          // No vision context - treat as regular result
          console.log('✅ Standard result (no vision context)');
          setResult(data);
          
          if (data.agent_execution_trace?.query_id) {
            startProgressTracking(data.agent_execution_trace.query_id);
          }
        }
      } else if (data.requires_manual_entry) {
        // Manual entry required
        console.log('📝 Manual entry required:', data.reason);
        setContributionReason(data.reason || 'insufficient_data');
        setShowUserContribution(true);
        
        // Pre-fill with vision context data if available
        const partialData = {
          product_name: data.vision_context?.productName || data.product_data?.product_name || data.product_name || '',
          brand: data.vision_context?.brand || data.product_data?.brand || data.brand || ''
        };
        setUserContribution(partialData);
        setLowConfidenceData(partialData);
        
        // Store vision context for debugging
        if (data.vision_context) {
          console.log('🔍 Vision context available for manual entry:', data.vision_context);
        }
      } else {
        // Error or other failure
        console.error('❌ Vision-first analysis failed:', data.error);
        setContributionReason('analysis_failed');
        setShowUserContribution(true);
      }
    } catch (error) {
      console.error('❌ Error processing image:', error);
      setImageProcessing(false);
      setContributionReason('error');
      setShowUserContribution(true);
    }
  };

  const handleCameraClose = () => {
    setShowCamera(false);
  };

  // New handlers for enhanced UX flow
  const handleDisambiguationSelect = (candidate: any) => {
    setShowDisambiguationModal(false);
    // Use the selected candidate to proceed with ownership research
    handleUserContributionSubmit({
      preventDefault: () => {},
      target: {
        brand: { value: candidate.name },
        product_name: { value: candidate.product_name || '' }
      }
    } as any);
  };

  const handleDisambiguationManualEntry = () => {
    setShowDisambiguationModal(false);
    setShowUserContribution(true);
    setContributionReason('disambiguation');
  };

  const handleVisionFallbackRetake = () => {
    setShowVisionFallbackModal(false);
    setShowCamera(true);
  };

  const handleVisionFallbackManualEntry = () => {
    setShowVisionFallbackModal(false);
    setShowUserContribution(true);
    setContributionReason('vision_fallback');
  };

  // Helper to get flag emoji from country name
  const getFlag = (country: string | undefined) => {
    if (!country || country === 'Unknown') return '🏳️';
    const flagMap: { [key: string]: string } = {
      'Sweden': '🇸🇪',
      'United States': '🇺🇸',
      'United Kingdom': '🇬🇧',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Netherlands': '🇳🇱',
      'Switzerland': '🇨🇭',
      'Japan': '🇯🇵',
      'China': '🇨🇳',
      'Canada': '🇨🇦',
      'Australia': '🇦🇺',
      'Italy': '🇮🇹',
      'Spain': '🇪🇸',
      'Denmark': '🇩🇰',
      'Norway': '🇳🇴',
      'Finland': '🇫🇮',
      'Brazil': '🇧🇷',
      'India': '🇮🇳',
      'Mexico': '🇲🇽',
    };
    return flagMap[country] || '🏳️';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 px-4 py-8">
      <div className="w-full max-w-lg mx-auto flex flex-col items-center">
        {/* Header */}
        <div className="w-full text-center mb-8">
          <div className="flex justify-center items-center mb-2">
            <img src="/logo.png" alt="OwnedBy Logo" className="h-14 mr-2" />
            <span className="inline-block bg-yellow-200 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full align-middle shadow-sm">Beta</span>
          </div>
          <p className="text-gray-600 text-lg mt-2">
            Find out who really owns the products you buy
          </p>
        </div>

        {/* Landing Screen - Primary CTA */}
        {!showManualEntry && !showUserContribution && !result && !showDemo && !showCamera && !showFallbackModal && !processing && !imageProcessing && (
          <Card className="w-full p-0 rounded-2xl shadow-xl border border-gray-100">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">📸</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Discover who owns the companies behind your purchases
                </h2>
                <p className="text-gray-600 text-base mb-6">
                  Take a photo of any product packaging to reveal the corporate ownership behind it
                </p>
              </div>
              
              <Button
                onClick={() => {
                  console.log('📸 Camera button clicked');
                  setShowCamera(true);
                }}
                className="w-full text-lg py-4 font-semibold shadow-lg bg-blue-600 hover:bg-blue-700 mb-4"
                size="lg"
              >
                📸 Take a photo of the product
              </Button>
              
              <p className="text-sm text-gray-500 mb-6 text-center">
                Make sure the brand or company name is clearly visible
              </p>
              
              <div className="w-full text-center">
                <button
                  onClick={() => {
                    console.log('✏️ Manual entry button clicked');
                    setShowFallbackModal(true);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  ✏️ Enter brand/company manually
                </button>
              </div>
              
              {/* Dev/debug link (hidden in production) */}
              {true && (
                <div className="mt-4 w-full text-center">
                  <button
                    onClick={() => setShowManualEntry(true)}
                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    Scan barcode (legacy fallback)
                  </button>
                </div>
              )}
              
              {/* Demo Button */}
              <div className="mt-6 w-full">
                <Button
                  onClick={() => setShowDemo(true)}
                  variant="outline"
                  className="w-full text-base py-3 font-semibold"
                >
                  Preview Demo Result
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fallback Modal */}
        {showFallbackModal && !result && !processing && !imageProcessing && (
          <Card className="w-full rounded-2xl shadow-xl border border-gray-100">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🔍</div>
                <h2 className="text-xl font-bold text-gray-800 mb-3">
                  Alternative Entry Methods
                </h2>
                <p className="text-gray-600 text-base">
                  Choose how you'd like to identify the product
                </p>
              </div>
              
              <div className="w-full space-y-4">
                <Button
                  onClick={() => {
                    setShowFallbackModal(false);
                    setShowCamera(true);
                  }}
                  variant="outline"
                  className="w-full text-base py-4 font-semibold border-2 border-blue-400 text-blue-700 hover:bg-blue-100 hover:border-blue-500"
                >
                  📸 Take a Photo
                </Button>
                
                <Button
                  onClick={() => {
                    setShowFallbackModal(false);
                    setShowUserContribution(true);
                    setContributionReason('manual_entry');
                  }}
                  variant="outline"
                  className="w-full text-base py-4 font-semibold"
                >
                  ✏️ Enter Manually
                </Button>
                
                {true && (
                  <Button
                    onClick={() => {
                      setShowFallbackModal(false);
                      setShowManualEntry(true);
                    }}
                    variant="outline"
                    className="w-full text-base py-4 font-semibold"
                  >
                    📱 Scan Barcode (Dev)
                  </Button>
                )}
              </div>
              
              <Button
                onClick={() => setShowFallbackModal(false)}
                variant="secondary"
                className="mt-6 w-full text-base py-3 font-semibold"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Camera Component */}
        {showCamera && (
          <ProductCamera
            onImageCaptured={handleImageCaptured}
            onClose={handleCameraClose}
          />
        )}

        {/* Disambiguation Modal */}
        <DisambiguationModal
          candidates={disambiguationCandidates}
          onSelect={handleDisambiguationSelect}
          onManualEntry={handleDisambiguationManualEntry}
          onClose={() => setShowDisambiguationModal(false)}
          isOpen={showDisambiguationModal}
        />

        {/* Vision Fallback Modal */}
        <VisionFallbackModal
          onRetakePhoto={handleVisionFallbackRetake}
          onManualEntry={handleVisionFallbackManualEntry}
          onClose={() => setShowVisionFallbackModal(false)}
          isOpen={showVisionFallbackModal}
          reason={visionFallbackReason}
        />

        {/* Show Demo Result Screen */}
        {showDemo && (
          <ProductResultScreen onScanAnother={handleScanAnother} />
        )}

        {/* Show Actual Result Screen */}
        {result && !processing && !showDemo && !result.requires_manual_entry && (
          <ProductResultScreenV2 
            result={result} 
            onScanAnother={handleScanAnother}
            onManualEntry={() => setShowUserContribution(true)}
            onConfirmResult={() => {
              console.log('Result confirmed by user');
              // Could add analytics or feedback collection here
            }}
            onFlagIssue={() => {
              console.log('Issue flagged by user');
              // Could add issue reporting functionality here
            }}
          />
        )}

        {/* Manual/Camera Entry Modal if required by quality agent */}
        {result && result.requires_manual_entry && !processing && !showDemo && (
          <Card className="w-full rounded-2xl shadow-xl border border-blue-200 bg-blue-50">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🧐</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Quality Check: More Information Needed
                </h2>
                <p className="text-gray-700 text-base mb-3">
                  Our quality assessment found the barcode data wasn't detailed enough for accurate ownership research. Please help us by providing the product name and brand.
                </p>
                <p className="text-gray-600 text-sm">
                  Barcode: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{currentBarcode}</span>
                </p>
                {/* Show what was found from barcode lookup, if any */}
                {(result.product_name || result.brand) && (
                  <div className="mt-4 bg-white border border-blue-300 rounded-lg p-4 text-left">
                    <div className="text-sm text-blue-800 font-semibold mb-2">📋 Partial data found from barcode lookup:</div>
                    {result.product_name && (
                      <div className="text-sm text-gray-800 mb-1"><b>Product:</b> {result.product_name}</div>
                    )}
                    {result.brand && (
                      <div className="text-sm text-gray-800"><b>Brand:</b> {result.brand}</div>
                    )}
                    <div className="text-xs text-blue-600 mt-2">Please verify and complete this information below.</div>
                  </div>
                )}
              </div>
              {/* Camera Option - Make it more prominent */}
              <div className="w-full mb-6">
                <Button
                  onClick={() => setShowCamera(true)}
                  variant="outline"
                  className="w-full text-base py-4 font-semibold border-2 border-blue-400 text-blue-700 hover:bg-blue-100 hover:border-blue-500 transition-colors"
                >
                  📸 Take a Photo Instead
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Use your camera to capture the product packaging for AI analysis
                </p>
              </div>
              <div className="w-full border-t border-blue-200 pt-4">
                <p className="text-sm text-gray-600 mb-4 text-center">Or enter the information manually:</p>
                <form onSubmit={handleUserContributionSubmit} className="w-full space-y-4">
                  <div>
                    <label htmlFor="product_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name (Optional)
                    </label>
                    <Input
                      type="text"
                      id="product_name"
                      value={userContribution.product_name || result.product_name || ''}
                      onChange={(e) => setUserContribution(prev => ({ ...prev, product_name: e.target.value }))}
                      className="w-full text-lg bg-white border-gray-300 focus:border-blue-500"
                      placeholder="e.g., Kit Kat Matcha Green Tea (optional)"
                    />
                  </div>
                  <div>
                    <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                      Brand/Company Name *
                    </label>
                    <Input
                      type="text"
                      id="brand"
                      value={userContribution.brand || result.brand || ''}
                      onChange={(e) => setUserContribution(prev => ({ ...prev, brand: e.target.value }))}
                      className="w-full text-lg bg-white border-gray-300 focus:border-blue-500"
                      placeholder="e.g., Nestlé, Coca-Cola, Nike"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      className="flex-1 text-base py-3 font-semibold shadow-lg bg-blue-600 hover:bg-blue-700"
                      disabled={!(userContribution.brand || result.brand)}
                    >
                      🔍 Research Ownership
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setResult(null)}
                      className="flex-1 text-base py-3 font-semibold shadow"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  💡 <strong>Tip:</strong> More specific brand names (e.g., "Nestlé" instead of "Kit Kat") help us find the ultimate owner.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Entry Form */}
        {showManualEntry && !result && (
          <Card className="w-full rounded-2xl shadow-xl border border-gray-100">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">✏️</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  Enter Product Information
                </h2>
                <p className="text-gray-600 text-base">
                  Can you tell us who made this product?
                </p>
              </div>
              
              <form onSubmit={handleManualSubmit} className="w-full space-y-6">
                <div>
                  <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
                    Product Barcode (Optional)
                  </label>
                  <Input
                    type="text"
                    id="barcode"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    className="w-full text-lg bg-gray-50"
                    placeholder="Enter product barcode if available..."
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If you don't have the barcode, you can still proceed with manual entry
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 text-base py-3 font-semibold shadow"
                    disabled={!manualBarcode.trim()}
                  >
                    Search
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowManualEntry(false)}
                    className="flex-1 text-base py-3 font-semibold shadow"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
              
              <div className="mt-6 w-full text-center">
                <p className="text-sm text-gray-500 mb-3">
                  Or try a different approach:
                </p>
                <Button
                  onClick={() => {
                    setShowManualEntry(false);
                    setShowUserContribution(true);
                    setContributionReason('manual_entry');
                  }}
                  variant="outline"
                  className="w-full text-base py-3 font-semibold"
                >
                  ✏️ Enter brand/company manually
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Contribution Form */}
        {showUserContribution && !result && (
          <Card className="w-full rounded-2xl shadow-xl border border-blue-200 bg-blue-50">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">✏️</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  {contributionReason === 'insufficient_data' 
                    ? 'Quality Check: More Information Needed' 
                    : contributionReason === 'manual_entry'
                    ? 'Enter Product Information'
                    : contributionReason === 'disambiguation'
                    ? 'Manual Entry Required'
                    : contributionReason === 'vision_fallback'
                    ? 'Manual Entry Required'
                    : contributionReason === 'analysis_failed'
                    ? 'Analysis Failed'
                    : contributionReason === 'error'
                    ? 'Error Occurred'
                    : 'We couldn\'t find this product'
                  }
                </h2>
                <p className="text-gray-700 text-base mb-3">
                  {contributionReason === 'insufficient_data'
                    ? 'Our quality assessment found the barcode data wasn\'t detailed enough for accurate ownership research. Please help us by providing the product name and brand.'
                    : contributionReason === 'manual_entry'
                    ? 'Can you tell us who made this product?'
                    : contributionReason === 'disambiguation'
                    ? 'None of the detected companies matched. Please enter the correct company information.'
                    : contributionReason === 'vision_fallback'
                    ? 'Image analysis couldn\'t identify the company clearly. Please enter the information manually.'
                    : contributionReason === 'analysis_failed'
                    ? 'Image analysis failed to extract company information. Please provide the details manually.'
                    : contributionReason === 'error'
                    ? 'An error occurred during analysis. Please enter the information manually.'
                    : 'Want to help by entering its name and brand?'
                  }
                </p>
                {currentBarcode && (
                  <p className="text-gray-600 text-sm">
                    Barcode: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{currentBarcode}</span>
                  </p>
                )}
                {/* Show what was found from barcode lookup, if any */}
                {(lowConfidenceData.product_name || lowConfidenceData.brand) && (
                  <div className="mt-4 bg-white border border-blue-300 rounded-lg p-4 text-left">
                    <div className="text-sm text-blue-800 font-semibold mb-2">📋 Partial data found from barcode lookup:</div>
                    {lowConfidenceData.product_name && (
                      <div className="text-sm text-gray-800 mb-1"><b>Product:</b> {lowConfidenceData.product_name}</div>
                    )}
                    {lowConfidenceData.brand && (
                      <div className="text-sm text-gray-800"><b>Brand:</b> {lowConfidenceData.brand}</div>
                    )}
                    <div className="text-xs text-blue-600 mt-2">Please verify and complete this information below.</div>
                  </div>
                )}
              </div>
              
              {/* Camera Option - Make it more prominent */}
              <div className="w-full mb-6">
                <Button
                  onClick={() => setShowCamera(true)}
                  variant="outline"
                  className="w-full text-base py-4 font-semibold border-2 border-blue-400 text-blue-700 hover:bg-blue-100 hover:border-blue-500 transition-colors"
                >
                  📸 Take a Photo Instead
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Use your camera to capture the product packaging for AI analysis
                </p>
              </div>
              
              <div className="w-full border-t border-blue-200 pt-4">
                <p className="text-sm text-gray-600 mb-4 text-center">Or enter the information manually:</p>
                <form onSubmit={handleUserContributionSubmit} className="w-full space-y-4">
                  <div>
                    <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                      Brand or Company Name *
                    </label>
                    <Input
                      type="text"
                      id="brand"
                      value={userContribution.brand}
                      onChange={(e) => setUserContribution(prev => ({ ...prev, brand: e.target.value }))}
                      className="w-full text-lg bg-white border-gray-300 focus:border-blue-500"
                      placeholder="e.g., Nestlé, Coca-Cola, Apple"
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the company that owns or produces this product
                    </p>
                  </div>
                  <div>
                    <label htmlFor="product_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name (Optional)
                    </label>
                    <Input
                      type="text"
                      id="product_name"
                      value={userContribution.product_name}
                      onChange={(e) => setUserContribution(prev => ({ ...prev, product_name: e.target.value }))}
                      className="w-full text-lg bg-white border-gray-300 focus:border-blue-500"
                      placeholder="e.g., Kit Kat Matcha Green Tea"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Helpful but not required for ownership research
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      className="flex-1 text-base py-3 font-semibold shadow-lg bg-blue-600 hover:bg-blue-700"
                      disabled={!userContribution.brand.trim()}
                    >
                      🔍 Research Ownership
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowUserContribution(false)}
                      className="flex-1 text-base py-3 font-semibold shadow"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  💡 <strong>Tip:</strong> More specific company names (e.g., "Nestlé" instead of "Kit Kat") help us find the ultimate owner.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing State */}
        {processing && (
          <Card className="w-full rounded-2xl shadow-xl border border-gray-100">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Researching Ownership...
                </h3>
              <p className="text-gray-600 text-center">
                {currentProgress ? getStageInfo(currentProgress.stage || '').description : 'Starting research...'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Image Processing State */}
        {imageProcessing && (
          <Card className="w-full rounded-2xl shadow-xl border border-gray-100">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Analyzing Product Image...
              </h3>
              <div className="text-gray-600 text-center space-y-2">
                <p className="text-sm">
                  Step 1: Running OCR and brand detection...
                </p>
                <p className="text-sm">
                  Step 2: Assessing confidence and quality...
                </p>
                <p className="text-sm">
                  Step 3: Determining next steps...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!processing && result && progressHistory.length > 0 && (
          <div className="mt-8">
            <h4 className="font-semibold text-gray-800 mb-2">Process Summary</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border rounded-lg">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="px-3 py-2 text-left">Step</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Reasoning</th>
                  </tr>
                </thead>
                <tbody>
                  {progressHistory.map((step, idx) => {
                    const stageInfo = getStageInfo(step.stage || '')
                    return (
                      <tr key={idx} className="border-b last:border-b-0">
                        <td className="px-3 py-2 whitespace-nowrap flex items-center gap-2">
                          <span className="text-lg">{stageInfo.icon}</span>
                          <span>{stageInfo.name}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            step.status === 'success' ? 'bg-green-100 text-green-800' :
                            step.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {step.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-700">
                          {step.reasoning || step.data?.reasoning || step.description || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* Build Info - Always visible for version tracking */}
      <BuildInfo variant="compact" position="bottom-right" />
    </div>
  );
} 
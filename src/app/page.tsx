'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BarcodeScanner } from '../../components/BarcodeScanner';
import ProductCamera from '@/components/ProductCamera';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getStageInfo } from '@/lib/utils';
import ProductResultScreen from '@/components/ProductResultScreen/index';

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
      
      // If lookup failed and no user data was provided, show contribution form
      if (!data.success && !userData && !data.requires_manual_entry && (
        data.error?.includes('No product found') || 
        data.error?.includes('Please try manual entry')
      )) {
        setContributionReason('not_found');
        setShowUserContribution(true);
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to lookup product. Please try again.',
      });
    } finally {
      setProcessing(false);
      // Stop progress tracking after a delay to allow final updates
      setTimeout(() => {
        stopProgressTracking();
      }, 2000);
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
    if (userContribution.product_name.trim() && userContribution.brand.trim()) {
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
    setShowManualEntry(false);
    setShowUserContribution(false);
    setShowContributionSuccess(false);
    setShowLowConfidenceFallback(false);
    setShowDemo(false);
    setShowCamera(false);
    setImageAnalysisResult(null);
    setCurrentBarcode('');
    setManualBarcode('');
    setUserContribution({ product_name: '', brand: '' });
    setLowConfidenceData({ product_name: '', brand: '' });
    setContributionReason('not_found');
    stopProgressTracking();
  };

  const handleImageCaptured = async (file: File) => {
    setImageProcessing(true);
    setShowCamera(false);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/image-recognition', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      setImageAnalysisResult(result);
      
      if (result.success && result.data.confidence >= 70) {
        // High confidence - proceed with ownership research
        await handleBarcode('', {
          product_name: result.data.product_name,
          brand: result.data.brand_name
        });
      } else if (result.success) {
        // Low confidence - show manual entry with suggestions
        setContributionReason('insufficient_data');
        setShowUserContribution(true);
        setUserContribution({
          product_name: result.data.product_name,
          brand: result.data.brand_name
        });
      } else {
        // Failed analysis - show manual entry
        setContributionReason('not_found');
        setShowUserContribution(true);
        setUserContribution({ product_name: '', brand: '' });
      }
    } catch (error) {
      console.error('Image analysis failed:', error);
      setContributionReason('not_found');
      setShowUserContribution(true);
      setUserContribution({ product_name: '', brand: '' });
    } finally {
      setImageProcessing(false);
    }
  };

  const handleCameraClose = () => {
    setShowCamera(false);
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
            Discover who owns the companies behind your purchases
          </p>
        </div>

        {/* Main Scanner */}
        {!showManualEntry && !showUserContribution && !result && !showDemo && !showCamera && (
          <Card className="w-full p-0 rounded-2xl shadow-xl border border-gray-100">
            <CardContent className="p-6 flex flex-col items-center">
              <BarcodeScanner
                onBarcode={handleBarcode}
                processing={processing}
                onManualEntry={handleManualEntry}
              />
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

        {/* Camera Component */}
        {showCamera && (
          <ProductCamera
            onImageCaptured={handleImageCaptured}
            onClose={handleCameraClose}
          />
        )}

        {/* Show Demo Result Screen */}
        {showDemo && (
          <ProductResultScreen onScanAnother={handleScanAnother} />
        )}

        {/* Show Actual Result Screen */}
        {result && !processing && !showDemo && !result.requires_manual_entry && (
          <ProductResultScreen onScanAnother={handleScanAnother} result={result} />
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
                      Product Name *
                    </label>
                    <Input
                      type="text"
                      id="product_name"
                      value={userContribution.product_name || result.product_name || ''}
                      onChange={(e) => setUserContribution(prev => ({ ...prev, product_name: e.target.value }))}
                      className="w-full text-lg bg-white border-gray-300 focus:border-blue-500"
                      placeholder="e.g., Kit Kat Matcha Green Tea"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                      Brand Name *
                    </label>
                    <Input
                      type="text"
                      id="brand"
                      value={userContribution.brand || result.brand || ''}
                      onChange={(e) => setUserContribution(prev => ({ ...prev, brand: e.target.value }))}
                      className="w-full text-lg bg-white border-gray-300 focus:border-blue-500"
                      placeholder="e.g., Kit Kat, Nestlé"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      className="flex-1 text-base py-3 font-semibold shadow-lg bg-blue-600 hover:bg-blue-700"
                      disabled={!(userContribution.product_name || result.product_name) || !(userContribution.brand || result.brand)}
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
              <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                Enter Barcode Manually
              </h2>
              <form onSubmit={handleManualSubmit} className="w-full space-y-6">
                <div>
                  <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
                    Barcode
                  </label>
                  <Input
                    type="text"
                    id="barcode"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    className="w-full text-lg bg-gray-50"
                    placeholder="Enter product barcode..."
                    autoFocus
                  />
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
            </CardContent>
          </Card>
        )}

        {/* User Contribution Form */}
        {showUserContribution && !result && (
          <Card className="w-full rounded-2xl shadow-xl border border-blue-200 bg-blue-50">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🧐</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  {contributionReason === 'insufficient_data' 
                    ? 'Quality Check: More Information Needed' 
                    : 'We couldn\'t find this product'
                  }
                </h2>
                <p className="text-gray-700 text-base mb-3">
                  {contributionReason === 'insufficient_data'
                    ? 'Our quality assessment found the barcode data wasn\'t detailed enough for accurate ownership research. Please help us by providing the product name and brand.'
                    : 'Want to help by entering its name and brand?'
                  }
                </p>
                <p className="text-gray-600 text-sm">
                  Barcode: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{currentBarcode}</span>
                </p>
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
                    <label htmlFor="product_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <Input
                      type="text"
                      id="product_name"
                      value={userContribution.product_name}
                      onChange={(e) => setUserContribution(prev => ({ ...prev, product_name: e.target.value }))}
                      className="w-full text-lg bg-white border-gray-300 focus:border-blue-500"
                      placeholder="e.g., Kit Kat Matcha Green Tea"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                      Brand Name *
                    </label>
                    <Input
                      type="text"
                      id="brand"
                      value={userContribution.brand}
                      onChange={(e) => setUserContribution(prev => ({ ...prev, brand: e.target.value }))}
                      className="w-full text-lg bg-white border-gray-300 focus:border-blue-500"
                      placeholder="e.g., Kit Kat, Nestlé"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      className="flex-1 text-base py-3 font-semibold shadow-lg bg-blue-600 hover:bg-blue-700"
                      disabled={!userContribution.product_name.trim() || !userContribution.brand.trim()}
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
                  💡 <strong>Tip:</strong> More specific brand names (e.g., "Nestlé" instead of "Kit Kat") help us find the ultimate owner.
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
              <p className="text-gray-600 text-center">
                Using AI to identify the brand and product from your photo
              </p>
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
    </div>
  );
} 
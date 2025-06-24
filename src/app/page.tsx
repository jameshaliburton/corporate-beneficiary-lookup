'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BarcodeScanner } from '../../components/BarcodeScanner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getStageInfo } from '@/lib/utils';

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
  const [userContribution, setUserContribution] = useState({
    product_name: '',
    brand: ''
  });
  const [currentBarcode, setCurrentBarcode] = useState('');
  const [showContributionSuccess, setShowContributionSuccess] = useState(false);
  const [showLowConfidenceFallback, setShowLowConfidenceFallback] = useState(false);
  const [lowConfidenceData, setLowConfidenceData] = useState({
    product_name: '',
    brand: ''
  });
  
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
      if (!data.success && !userData && (
        data.error?.includes('No product found') || 
        data.error?.includes('Please try manual entry')
      )) {
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
    setManualBarcode('');
    setUserContribution({ product_name: '', brand: '' });
    setCurrentBarcode('');
    setShowContributionSuccess(false);
    setShowLowConfidenceFallback(false);
    setLowConfidenceData({ product_name: '', brand: '' });
  };

  // Helper to get flag emoji from country name
  function getFlag(country: string | undefined) {
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
      'South Korea': '🇰🇷',
      'Brazil': '🇧🇷',
      'India': '🇮🇳',
      'Mexico': '🇲🇽',
    };
    return flagMap[country] || '🏳️';
  }

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
        {!showManualEntry && !showUserContribution && !result && (
          <Card className="w-full p-0 rounded-2xl shadow-xl border border-gray-100">
            <CardContent className="p-6 flex flex-col items-center">
              <BarcodeScanner
                onBarcode={handleBarcode}
                processing={processing}
                onManualEntry={handleManualEntry}
              />
              <p className="text-gray-500 text-sm mt-4">Point your camera at a barcode to begin.</p>
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
          <Card className="w-full rounded-2xl shadow-xl border border-gray-100">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  We couldn't find this product
                </h2>
                <p className="text-gray-600 text-sm mb-2">
                  Want to help by entering its name and brand?
                </p>
                <p className="text-gray-500 text-xs">
                  Barcode: {currentBarcode}
                </p>
              </div>
              <form onSubmit={handleUserContributionSubmit} className="w-full space-y-6">
                <div>
                  <label htmlFor="product_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <Input
                    type="text"
                    id="product_name"
                    value={userContribution.product_name}
                    onChange={(e) => setUserContribution(prev => ({ ...prev, product_name: e.target.value }))}
                    className="w-full text-lg bg-gray-50"
                    placeholder="e.g., Kit Kat Matcha Green Tea"
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Name
                  </label>
                  <Input
                    type="text"
                    id="brand"
                    value={userContribution.brand}
                    onChange={(e) => setUserContribution(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full text-lg bg-gray-50"
                    placeholder="e.g., Kit Kat, Nestlé"
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 text-base py-3 font-semibold shadow"
                    disabled={!userContribution.product_name.trim() || !userContribution.brand.trim()}
                  >
                    Submit & Research
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
              <p className="text-xs text-gray-400 mt-4">Thank you for helping improve our database!</p>
            </CardContent>
          </Card>
        )}

        {/* Processing State */}
        {processing && (
          <Card className="w-full rounded-2xl shadow-xl border border-gray-100">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Agent Research Pipeline
                </h3>
                <p className="text-gray-600 text-sm">
                  Our AI is researching ownership. This may take a few seconds.
                </p>
              </div>
              {/* Process Flow Visualization */}
              <div className="space-y-4">
                {/* Current Active Stage */}
                {currentProgress && currentProgress.stage && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getStageInfo(currentProgress.stage).icon}</div>
                        <div>
                          <h4 className="font-semibold text-blue-900">
                            {getStageInfo(currentProgress.stage).name}
                          </h4>
                          <p className="text-sm text-blue-700">
                            {getStageInfo(currentProgress.stage).description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-5 w-5 border-2 border-t-2 border-t-blue-600 border-blue-300 rounded-full"></div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          currentProgress.status === 'started' ? 'bg-blue-100 text-blue-800' :
                          currentProgress.status === 'success' ? 'bg-green-100 text-green-800' :
                          currentProgress.status === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {currentProgress.status}
                        </span>
                      </div>
                    </div>
                    {currentProgress.reasoning && (
                      <div className="text-xs text-blue-700 mt-2">{currentProgress.reasoning}</div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Result/Error State */}
        {result && (
          <Card className="w-full rounded-2xl shadow-xl border border-gray-100 mt-6">
            <CardContent className="p-8">
              {result.success ? (
                <div>
                  {/* Success State */}
                  <h2 className="text-2xl font-bold text-green-700 mb-2 flex items-center gap-2">
                    <span>Ownership Found</span>
                    {typeof result.confidence_score === 'number' && (
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                        result.confidence_score >= 80 ? 'bg-green-100 text-green-800' :
                        result.confidence_score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {result.confidence_score >= 80 ? 'High Confidence' : result.confidence_score >= 50 ? 'Medium Confidence' : 'Low Confidence'}
                      </span>
                    )}
                  </h2>
                  <div className="mb-4">
                    <span className="font-semibold">Product:</span> {result.product_name || 'Unknown'}<br />
                    <span className="font-semibold">Brand:</span> {result.brand || 'Unknown'}<br />
                    <span className="font-semibold">Owner:</span> {result.financial_beneficiary || 'Unknown'}<br />
                    <span className="font-semibold">Country:</span> {result.beneficiary_country || 'Unknown'} {result.beneficiary_flag || ''}<br />
                  </div>
                  {result.reasoning && (
                    <div className="bg-gray-50 border-l-4 border-blue-300 p-4 rounded mb-4 text-sm text-blue-900">
                      <span className="font-semibold">Reasoning:</span> {result.reasoning}
                    </div>
                  )}
                  {result.sources && result.sources.length > 0 && (
                    <div className="mb-4">
                      <span className="font-semibold">Sources:</span>
                      <ul className="list-disc list-inside text-xs text-gray-600 mt-1">
                        {result.sources.map((src, i) => (
                          <li key={i}>{src}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Button onClick={handleScanAnother} className="mt-4 w-full">Scan another</Button>
                </div>
              ) : (
                <div>
                  {/* Error State */}
                  <h2 className="text-2xl font-bold text-red-700 mb-2 flex items-center gap-2">
                    <span>Ownership Not Found</span>
                  </h2>
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mb-4 text-sm text-red-900">
                    <span className="font-semibold">Error:</span> {result.error || 'No ownership information found.'}
                  </div>
                  <Button onClick={handleScanAnother} className="mt-4 w-full" variant="secondary">Scan another</Button>
                </div>
              )}
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
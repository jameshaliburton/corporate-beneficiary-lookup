'use client';

import React, { useState } from 'react';
import { BarcodeScanner } from '../../components/BarcodeScanner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight drop-shadow-sm">
            Corporate Beneficiary Lookup
          </h1>
          <p className="text-gray-600 text-lg">
            Scan a product barcode to research its corporate ownership
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
                    Lookup
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
                    Research Ownership
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
            </CardContent>
          </Card>
        )}

        {/* Processing State */}
        {processing && (
          <Card className="w-full rounded-2xl shadow-xl border border-gray-100">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="animate-spin h-12 w-12 border-4 border-t-4 border-t-blue-600 border-blue-200 rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Researching Ownership
              </h3>
              <p className="text-gray-600">
                Analyzing product data and corporate structures...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && !processing && (
          <Card className="w-full rounded-2xl shadow-xl border border-gray-100">
            <CardContent className="p-8 flex flex-col items-center">
              {result.success ? (
                <>
                  {/* Success Message for User Contributions */}
                  {showContributionSuccess && (
                    <div className="w-full mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-green-600 mr-2">✅</span>
                        <p className="text-green-800 text-sm font-medium">
                          {result.result_type === 'agent-inferred' 
                            ? 'Great! Our AI research found ownership information for this product.'
                            : result.result_type === 'user_contributed_with_mapping'
                            ? 'Perfect! We found ownership data for this brand in our database.'
                            : 'Thanks! We\'ll use this to improve future lookups.'
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      Ownership Research Results
                    </h2>
                    <div className="text-sm text-gray-500">
                      {result.user_contributed ? 'User-contributed data' : 
                       result.result_type === 'cached' ? 'Cached result' : 'AI analysis'}
                    </div>
                  </div>

                  <div className="space-y-6 w-full">
                    {/* Product Info */}
                    <Card className="bg-gray-50 rounded-lg border border-gray-100">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-800 mb-2">Product Information</h3>
                        <div className="space-y-1 text-sm">
                          <div><span className="font-medium">Name:</span> {result.product_name || 'Unknown'}</div>
                          <div><span className="font-medium">Brand:</span> {result.brand || 'Unknown'}</div>
                          <div><span className="font-medium">Barcode:</span> {result.barcode}</div>
                          {result.user_contributed && (
                            <div className="text-xs text-blue-600 mt-2">
                              💡 User-contributed information
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Ownership Info */}
                    <Card className="bg-blue-50 rounded-lg border border-blue-100">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-800 mb-2">Corporate Ownership</h3>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{result.beneficiary_flag}</span>
                            <div>
                              <div className="font-medium">{result.financial_beneficiary}</div>
                              <div className="text-sm text-gray-600">{result.beneficiary_country}</div>
                              {result.ownership_structure_type && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {result.ownership_structure_type}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Ownership Flow */}
                          {result.ownership_flow && result.ownership_flow.length > 0 && (
                            <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                              <div className="text-xs font-medium text-gray-700 mb-1">Ownership Chain:</div>
                              <div className="flex flex-row items-center overflow-x-auto space-x-4">
                                {result.ownership_flow.map((company, idx) => (
                                  <React.Fragment key={company.name + idx}>
                                    <div className={`min-w-[180px] p-3 rounded-lg shadow border flex flex-col items-center justify-center ${company.type === 'parent' ? 'bg-blue-50 border-blue-300' : company.type === 'subsidiary' ? 'bg-yellow-50 border-yellow-300' : company.type === 'franchise' ? 'bg-orange-50 border-orange-300' : 'bg-gray-50 border-gray-200'}`}>
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-lg">{company.country ? getFlag(company.country) : '🏳️'}</span>
                                        <span className="font-semibold text-gray-800">{company.name}</span>
                                      </div>
                                      <div className="text-xs text-gray-600 mb-1">{company.country || 'Unknown Country'}</div>
                                      <div className={`text-xs font-medium px-2 py-1 rounded ${company.type === 'parent' ? 'bg-blue-100 text-blue-800' : company.type === 'subsidiary' ? 'bg-yellow-100 text-yellow-800' : company.type === 'franchise' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>{company.type || 'unknown'}</div>
                                      {company.source && (
                                        <a href={company.source} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline mt-1">Source</a>
                                      )}
                                    </div>
                                    {idx < result.ownership_flow.length - 1 && (
                                      <span className="text-2xl text-gray-400">→</span>
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            {typeof result.confidence_score === 'number' && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                result.confidence_score >= 80 ? 'bg-green-100 text-green-800' :
                                result.confidence_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {result.confidence_score}% confidence
                              </span>
                            )}
                            {result.verification_status && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {result.verification_status}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Sources */}
                    {result.sources && result.sources.length > 0 && (
                      <Card className="bg-gray-50 rounded-lg border border-gray-100">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-800 mb-2">Sources</h3>
                          <ul className="text-sm space-y-1">
                            {result.sources.map((source, index) => (
                              <li key={index} className="text-gray-600">• {source}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Reasoning */}
                    {result.reasoning && (
                      <Card className="bg-gray-50 rounded-lg border border-gray-100">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-800 mb-2">Analysis</h3>
                          <p className="text-sm text-gray-600">{result.reasoning}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Low Confidence Fallback */}
                  {showLowConfidenceFallback && (
                    <div className="w-full mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                          Help Improve This Result
                        </h3>
                        <p className="text-yellow-700 text-sm">
                          We found some information, but could use your help to get more accurate results.
                        </p>
                      </div>
                      <form onSubmit={handleLowConfidenceSubmit} className="space-y-4">
                        <div>
                          <label htmlFor="low_conf_product_name" className="block text-sm font-medium text-yellow-800 mb-2">
                            Product Name
                          </label>
                          <Input
                            type="text"
                            id="low_conf_product_name"
                            value={lowConfidenceData.product_name}
                            onChange={(e) => setLowConfidenceData(prev => ({ ...prev, product_name: e.target.value }))}
                            className="w-full text-lg bg-white border-yellow-300"
                            placeholder="Enter the correct product name..."
                            autoFocus
                          />
                        </div>
                        <div>
                          <label htmlFor="low_conf_brand" className="block text-sm font-medium text-yellow-800 mb-2">
                            Brand Name
                          </label>
                          <Input
                            type="text"
                            id="low_conf_brand"
                            value={lowConfidenceData.brand}
                            onChange={(e) => setLowConfidenceData(prev => ({ ...prev, brand: e.target.value }))}
                            className="w-full text-lg bg-white border-yellow-300"
                            placeholder="Enter the correct brand name..."
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            type="submit"
                            className="flex-1 text-base py-2 font-semibold bg-yellow-600 hover:bg-yellow-700 text-white"
                            disabled={!lowConfidenceData.product_name.trim() || !lowConfidenceData.brand.trim()}
                          >
                            Improve Result
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowLowConfidenceFallback(false)}
                            className="flex-1 text-base py-2 font-semibold"
                          >
                            Skip
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}

                  <Button
                    onClick={handleScanAnother}
                    className="w-full mt-8 text-base py-3 font-semibold shadow"
                  >
                    Scan Another Product
                  </Button>
                </>
              ) : (
                <div className="text-center w-full">
                  <div className="text-red-600 text-lg font-semibold mb-4">
                    Research Failed
                  </div>
                  <p className="text-gray-600 mb-6">
                    {result.error || 'Unable to research this product. Please try again.'}
                  </p>
                  
                  {/* Show user contribution option for failed lookups */}
                  {result.result_type !== 'user_contributed_no_match' && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800 text-sm mb-3">
                        Can't find this product? Help us by providing the product details manually.
                      </p>
                      <Button
                        onClick={() => setShowUserContribution(true)}
                        variant="outline"
                        className="w-full text-sm"
                      >
                        Contribute Product Information
                      </Button>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleScanAnother}
                    className="w-full text-base py-3 font-semibold shadow"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 
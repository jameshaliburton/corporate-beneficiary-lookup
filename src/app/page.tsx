'use client';

import React, { useState } from 'react';
import { BarcodeScanner } from '../../components/BarcodeScanner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
}

export default function Home() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProductResult | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');

  const handleBarcode = async (barcode: string) => {
    setProcessing(true);
    setResult(null);
    try {
      const response = await fetch('/api/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barcode }),
      });
      const data = await response.json();
      setResult(data);
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

  const handleScanAnother = () => {
    setResult(null);
    setShowManualEntry(false);
    setManualBarcode('');
  };

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
        {!showManualEntry && !result && (
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
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      Ownership Research Results
                    </h2>
                    <div className="text-sm text-gray-500">
                      {result.result_type === 'cached' ? 'Cached result' : 'AI analysis'}
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
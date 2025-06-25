import React, { useState } from 'react';

export interface ProductHeader {
  name: string;
  brand: string;
  country: string;
  flag: string;
  barcode?: string;
}

export interface OwnershipStep {
  name: string;
  country: string;
  flag: string;
  type: string;
  ultimate?: boolean;
}

export interface ProcessTraceRow {
  step: string;
  status: string;
  reasoning: string;
  time: string;
}

export interface ProductResultScreenProps {
  product?: ProductHeader;
  ownershipTrail?: OwnershipStep[];
  confidence?: 'High' | 'Medium' | 'Low';
  confidenceScore?: number;
  sources?: string[];
  processTrace?: ProcessTraceRow[];
  error?: string | null;
  fallback?: string | null;
}

// Mock data for demonstration
const mockResult: ProductResultScreenProps = {
  product: {
    name: 'Kit Kat Matcha Green Tea',
    brand: 'Nestlé',
    country: 'Japan',
    flag: '🇯🇵',
    barcode: '4902201176291',
  },
  ownershipTrail: [
    { name: 'Nestlé Japan', country: 'Japan', flag: '🇯🇵', type: 'Private' },
    { name: 'Nestlé S.A.', country: 'Switzerland', flag: '🇨🇭', type: 'Public', ultimate: true },
  ],
  confidence: 'High',
  confidenceScore: 92,
  sources: ['OpenCorporates', 'Nestlé Annual Report'],
  processTrace: [
    { step: 'Cache Check', status: 'MISS', reasoning: 'No cached result found', time: '148ms' },
    { step: 'Static Mapping', status: 'MISS', reasoning: 'No static match', time: '155ms' },
    { step: 'Query Builder', status: '✅', reasoning: 'Generated search queries', time: '2.1s' },
    { step: 'Web Research', status: '✅', reasoning: 'Scraped and parsed web info', time: '41s' },
    { step: 'Ownership Agent', status: '✅', reasoning: 'LLM-based ownership analysis', time: '43s' },
    { step: 'Validation', status: '✅', reasoning: 'Result validated + deduplicated', time: '43s' },
    { step: 'DB Save', status: '✅', reasoning: 'Saved to DB', time: '~' },
  ],
  error: null,
  fallback: null,
};

const confidenceColors = {
  High: 'bg-blue-100 text-blue-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-red-100 text-red-800',
};

const typeColors = {
  Public: 'bg-blue-100 text-blue-800',
  Private: 'bg-gray-100 text-gray-800',
  'State-owned': 'bg-green-100 text-green-800',
};

const ProductResultScreen: React.FC<ProductResultScreenProps> = (props) => {
  const [showTrace, setShowTrace] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Use props if provided, otherwise fallback to mock data
  const {
    product = mockResult.product,
    ownershipTrail = mockResult.ownershipTrail,
    confidence = mockResult.confidence,
    confidenceScore = mockResult.confidenceScore,
    sources = mockResult.sources,
    processTrace = mockResult.processTrace,
    error = mockResult.error,
    fallback = mockResult.fallback,
  } = props;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
      {/* 🛍️ Product Header */}
      <section className="bg-white rounded-xl shadow p-6 mb-4 mt-4 mx-2">
        <div className="flex flex-col items-center text-center">
          <span className="text-3xl font-bold mb-1">{product.name}</span>
          <span className="text-lg text-gray-600 mb-1">{product.brand}</span>
          <span className="text-base flex items-center gap-1 mb-1">{product.flag} {product.country}</span>
          {product.barcode && <span className="text-xs text-gray-400">Barcode: {product.barcode}</span>}
        </div>
      </section>

      {/* 🧬 Ownership Trail */}
      <section className="bg-white rounded-xl shadow p-4 mb-4 mx-2">
        <div className="mb-2 font-semibold text-lg flex items-center gap-2">🧬 Ownership</div>
        <div className="flex flex-wrap gap-2 justify-center">
          {ownershipTrail.map((step, idx) => (
            <div key={idx} className={`flex items-center gap-1 px-3 py-2 rounded-full shadow-sm border ${typeColors[step.type] || 'bg-gray-100 text-gray-800'}`}
              style={{ fontWeight: step.ultimate ? 'bold' : 'normal', borderWidth: step.ultimate ? 2 : 1 }}>
              <span>{step.name}</span>
              <span>{step.flag}</span>
              <span className="ml-1 px-2 py-0.5 rounded text-xs font-medium bg-white border border-gray-200">{step.type}</span>
              {step.ultimate && <span className="ml-1">🎯 <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full ml-1">Ultimate Owner</span></span>}
              {idx < ownershipTrail.length - 1 && <span className="mx-2 text-gray-400">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* 📊 Confidence + Attribution */}
      <section className="bg-white rounded-xl shadow p-4 mb-4 mx-2">
        <div className="mb-2 font-semibold text-lg flex items-center gap-2">📊 Confidence</div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full font-semibold text-sm ${confidenceColors[confidence]}`}>{confidence} ({confidenceScore}%)</span>
          <button className="ml-2 text-xs underline text-blue-600" title="Confidence is based on data quality, source reliability, and agent agreement.">What affects this?</button>
        </div>
        <div className="mt-2 flex gap-2">
          <button className="px-3 py-1 rounded bg-green-100 text-green-800 font-medium text-xs">🙋 Confirmed</button>
          <button className="px-3 py-1 rounded bg-red-100 text-red-800 font-medium text-xs">❗ Flag Incorrect</button>
        </div>
      </section>

      {/* 🧪 Process Trace */}
      <section className="bg-white rounded-xl shadow p-4 mb-4 mx-2">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-lg flex items-center gap-2">🧪 Trace</span>
          <button className="text-xs underline text-blue-600" onClick={() => setShowTrace(!showTrace)}>{showTrace ? 'Hide' : 'Show'} Steps</button>
        </div>
        {showTrace && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1 text-left">Step</th>
                  <th className="px-2 py-1 text-left">Status</th>
                  <th className="px-2 py-1 text-left">Reasoning</th>
                  <th className="px-2 py-1 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {processTrace.map((row, idx) => (
                  <tr key={idx} className="border-b last:border-b-0">
                    <td className="px-2 py-1 whitespace-nowrap">{row.step}</td>
                    <td className="px-2 py-1">{row.status}</td>
                    <td className="px-2 py-1">{row.reasoning}</td>
                    <td className="px-2 py-1">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 🧯 Error States + Fallback */}
      {error && (
        <section className="bg-white rounded-xl shadow p-4 mb-4 mx-2">
          <div className="font-semibold text-lg flex items-center gap-2 text-red-700">❌ Error</div>
          <div className="text-red-700 mt-2">{error}</div>
          <button className="mt-4 px-4 py-2 rounded bg-blue-100 text-blue-800 font-medium" onClick={() => window.location.reload()}>🔄 Retry</button>
        </section>
      )}
      {fallback && (
        <section className="bg-white rounded-xl shadow p-4 mb-4 mx-2">
          <div className="font-semibold text-lg flex items-center gap-2">🧯 Fallback</div>
          <div className="text-gray-700 mt-2">{fallback}</div>
        </section>
      )}

      {/* 📝 Manual Entry Form */}
      {showManualEntry && (
        <section className="bg-white rounded-xl shadow p-4 mb-4 mx-2">
          <div className="font-semibold text-lg flex items-center gap-2">📝 Manual Entry</div>
          <form className="mt-2 flex flex-col gap-3">
            <input className="border rounded px-3 py-2" placeholder="Product Name" />
            <input className="border rounded px-3 py-2" placeholder="Brand Name" />
            <input className="border rounded px-3 py-2" placeholder="Company Name" />
            <input className="border rounded px-3 py-2" placeholder="Country (optional)" />
            <button className="mt-2 px-4 py-2 rounded bg-blue-600 text-white font-semibold">Re-run Search</button>
            <label className="flex items-center gap-2 text-xs mt-2">
              <input type="checkbox" /> Contribute data
            </label>
          </form>
        </section>
      )}

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t shadow-lg flex justify-around py-3 z-50">
        <button className="flex-1 mx-2 px-3 py-2 rounded bg-blue-100 text-blue-800 font-medium">🔄 Retry</button>
        <button className="flex-1 mx-2 px-3 py-2 rounded bg-green-100 text-green-800 font-medium">🙋 Confirm</button>
        <button className="flex-1 mx-2 px-3 py-2 rounded bg-red-100 text-red-800 font-medium">❗ Flag</button>
        <button className="flex-1 mx-2 px-3 py-2 rounded bg-gray-100 text-gray-800 font-medium" onClick={() => setShowManualEntry(true)}>📝 Enter Manually</button>
      </div>
    </div>
  );
};

export default ProductResultScreen; 
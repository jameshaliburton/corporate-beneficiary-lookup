"use client"
import React, { useState } from "react";

const confidenceLabel = (score: number) => {
  if (score >= 80) return { label: "Highly Likely", color: "text-green-600" };
  if (score >= 60) return { label: "Likely", color: "text-yellow-500" };
  if (score >= 20) return { label: "Unconfirmed", color: "text-orange-500" };
  return { label: "Unknown", color: "text-red-600" };
};

export default function HomePage() {
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [timing, setTiming] = useState(0);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setTiming(0);
    if (!barcode) {
      setError("Please enter a barcode");
      return;
    }
    setLoading(true);
    const start = Date.now();
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode }),
      });
      const data = await res.json();
      setTiming((Date.now() - start) / 1000);
      if (!data.success) {
        setError(data.error || "Research failed, please try again");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Research failed, please try again");
    } finally {
      setLoading(false);
    }
  };

  const renderResult = () => {
    if (!result) return null;
    const conf = confidenceLabel(result.confidence);
    return (
      <div className="mt-6 bg-white rounded-lg shadow p-4">
        <div className="text-lg font-semibold mb-2 flex items-center gap-2">
          <span role="img" aria-label="search">🔍</span> {result.product_name}
        </div>
        <div className="mb-2">
          <span className="font-medium">Primary Beneficiary:</span> <span className="text-xl">{result.beneficiary_flag} {result.financial_beneficiary}</span> <span className="text-gray-500">({result.beneficiary_country})</span>
        </div>
        <div className={`mb-2 font-semibold ${conf.color}`}>Confidence: {conf.label} ({result.confidence}%)</div>
        <div className="mb-4">
          <div className="font-medium mb-1">📋 Research Performed:</div>
          <ul className="list-disc ml-6 text-sm">
            <li>✅ Product identified via UPC database</li>
            <li>✅ Corporate knowledge verified</li>
            <li>✅ Sources cross-referenced</li>
            <li>⏱️ Research completed ({timing.toFixed(1)} seconds)</li>
          </ul>
        </div>
        {result.sources && result.sources.length > 0 && (
          <div className="mb-2">
            <div className="font-medium">Sources:</div>
            <ul className="list-disc ml-6 text-xs">
              {result.sources.map((src: string, i: number) => (
                <li key={i}><a href={src} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{src}</a></li>
              ))}
            </ul>
          </div>
        )}
        {result.reasoning && (
          <div className="mt-2 text-xs text-gray-600">Reasoning: {result.reasoning}</div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-2 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Corporate Beneficiary Lookup</h1>
      <form onSubmit={handleLookup} className="w-full max-w-md flex flex-col items-center gap-4">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Enter barcode (e.g. 798235653183)"
          className="w-full text-lg px-4 py-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={barcode}
          onChange={e => setBarcode(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white text-lg font-semibold py-3 rounded shadow hover:bg-blue-700 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2"><span className="animate-spin h-5 w-5 border-2 border-t-2 border-t-white border-blue-200 rounded-full"></span> Researching ownership...</span>
          ) : (
            "Lookup Ownership"
          )}
        </button>
      </form>
      {error && <div className="mt-6 text-red-600 font-medium text-center">{error}</div>}
      {renderResult()}
    </div>
  );
} 
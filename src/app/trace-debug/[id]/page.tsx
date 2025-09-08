/**
 * Trace Debug Page (ownership-por-v1.1)
 * Hidden route for internal QA - displays agent execution traces
 * Accessible only in dev or via secret URL
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface TraceData {
  id: string;
  timestamp: string;
  confidence: number;
  gemini_output?: any;
  agent_execution_trace?: any;
  pipeline_type?: string;
  cache_hit?: boolean;
  verification_status?: string;
  financial_beneficiary?: string;
  brand?: string;
  product_name?: string;
}

export default function TraceDebugPage() {
  const params = useParams();
  const traceId = params.id as string;
  
  const [traceData, setTraceData] = useState<TraceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (traceId) {
      fetchTraceData(traceId);
    }
  }, [traceId]);

  const fetchTraceData = async (id: string) => {
    try {
      setLoading(true);
      
      // In a real implementation, this would fetch from a trace storage system
      // For now, we'll simulate with a mock response
      const response = await fetch(`/api/trace-debug/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trace data: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTraceData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Trace Not Found</h1>
              <p className="text-gray-600 mb-4">Error: {error}</p>
              <p className="text-sm text-gray-500">
                Trace ID: <code className="bg-gray-100 px-2 py-1 rounded">{traceId}</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!traceData) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">No Trace Data</h1>
              <p className="text-gray-600">No trace data found for the specified ID.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Trace Debug View</h1>
            <div className="text-sm text-gray-500">
              Ownership Pipeline POR v1.1
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Trace ID</div>
              <div className="font-mono text-lg">{traceId}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Timestamp</div>
              <div className="font-mono text-lg">{formatTimestamp(traceData.timestamp)}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Confidence</div>
              <div className="font-mono text-lg">{traceData.confidence}%</div>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Brand</div>
              <div className="font-mono">{traceData.brand || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Product</div>
              <div className="font-mono">{traceData.product_name || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Financial Beneficiary</div>
              <div className="font-mono">{traceData.financial_beneficiary || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Pipeline Type</div>
              <div className="font-mono">{traceData.pipeline_type || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Cache Hit</div>
              <div className="font-mono">{traceData.cache_hit ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Verification Status</div>
              <div className="font-mono">{traceData.verification_status || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Agent Execution Trace */}
        {traceData.agent_execution_trace && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <button
              onClick={() => toggleSection('agent_trace')}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-xl font-bold text-gray-900">Agent Execution Trace</h2>
              <span className="text-gray-500">
                {expandedSections.has('agent_trace') ? '▼' : '▶'}
              </span>
            </button>
            
            {expandedSections.has('agent_trace') && (
              <div className="mt-4">
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {formatJSON(traceData.agent_execution_trace)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Gemini Output */}
        {traceData.gemini_output && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <button
              onClick={() => toggleSection('gemini_output')}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-xl font-bold text-gray-900">Gemini Verification Output</h2>
              <span className="text-gray-500">
                {expandedSections.has('gemini_output') ? '▼' : '▶'}
              </span>
            </button>
            
            {expandedSections.has('gemini_output') && (
              <div className="mt-4">
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {formatJSON(traceData.gemini_output)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Raw Trace Data */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <button
            onClick={() => toggleSection('raw_data')}
            className="flex items-center justify-between w-full text-left"
          >
            <h2 className="text-xl font-bold text-gray-900">Raw Trace Data</h2>
            <span className="text-gray-500">
              {expandedSections.has('raw_data') ? '▼' : '▶'}
            </span>
          </button>
          
          {expandedSections.has('raw_data') && (
            <div className="mt-4">
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {formatJSON(traceData)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Trace Debug View - Internal QA Tool (ownership-por-v1.1)</p>
          <p>This page is for debugging purposes only and should not be exposed in production.</p>
        </div>
      </div>
    </div>
  );
}

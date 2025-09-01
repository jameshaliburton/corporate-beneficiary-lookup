'use client';

import React from 'react';

interface TraceData {
  triggered_by: 'image' | 'barcode' | 'manual';
  agent_used: string;
  model_used: string;
  prompt_sent: string;
  raw_response: string;
  parsed_response: any;
  result_type: string;
  cache_hit: boolean;
  execution_time_ms: number;
  validation_passed?: boolean;
  frontend_fields_added?: boolean;
  error?: string;
}

interface DebugTracePanelProps {
  trace: TraceData;
}

export default function DebugTracePanel({ trace }: DebugTracePanelProps) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="mt-8 p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-sm">
      <details className="space-y-4">
        <summary className="cursor-pointer text-lg font-bold text-green-300 hover:text-green-200">
          🔍 Debug Trace Panel (Dev Only)
        </summary>
        
        <div className="space-y-4">
          {/* Basic Info */}
          <div>
            <h4 className="text-green-300 font-semibold mb-2">📊 Pipeline Info</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-400">Triggered by:</span> {trace.triggered_by}</div>
              <div><span className="text-gray-400">Agent used:</span> {trace.agent_used}</div>
              <div><span className="text-gray-400">Model:</span> {trace.model_used}</div>
              <div><span className="text-gray-400">Result type:</span> {trace.result_type}</div>
              <div><span className="text-gray-400">Cache hit:</span> {trace.cache_hit ? '✅' : '❌'}</div>
              <div><span className="text-gray-400">Execution time:</span> {trace.execution_time_ms}ms</div>
            </div>
          </div>

          {/* Validation Status */}
          {trace.validation_passed !== undefined && (
            <div>
              <h4 className="text-green-300 font-semibold mb-2">✅ Validation Status</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-400">Validation passed:</span> {trace.validation_passed ? '✅' : '❌'}</div>
                <div><span className="text-gray-400">Frontend fields added:</span> {trace.frontend_fields_added ? '✅' : '❌'}</div>
              </div>
            </div>
          )}

          {/* Error Info */}
          {trace.error && (
            <div>
              <h4 className="text-red-300 font-semibold mb-2">❌ Error</h4>
              <div className="text-red-400 text-xs">{trace.error}</div>
            </div>
          )}

          {/* Prompt */}
          <div>
            <h4 className="text-green-300 font-semibold mb-2">📝 Prompt Sent</h4>
            <pre className="bg-gray-800 p-2 rounded text-xs overflow-x-auto">
              {trace.prompt_sent}
            </pre>
          </div>

          {/* Raw Response */}
          <div>
            <h4 className="text-green-300 font-semibold mb-2">📄 Raw Response</h4>
            <pre className="bg-gray-800 p-2 rounded text-xs overflow-x-auto">
              {trace.raw_response}
            </pre>
          </div>

          {/* Parsed Response */}
          {trace.parsed_response && (
            <div>
              <h4 className="text-green-300 font-semibold mb-2">🔍 Parsed Response</h4>
              <pre className="bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(trace.parsed_response, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </details>
    </div>
  );
} 
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LookupAttempt {
  source: string;
  success: boolean;
  timestamp: string;
  reason?: string;
  error?: string;
}

interface LookupTrace {
  barcode: string;
  start_time: string;
  attempts: LookupAttempt[];
  final_result: string;
  total_duration_ms: number;
}

interface LookupTraceProps {
  trace: LookupTrace;
}

const LookupTrace: React.FC<LookupTraceProps> = ({ trace }) => {
  const getSourceIcon = (source: string) => {
    const iconMap: { [key: string]: string } = {
      'supabase_cache': '🗄️',
      'upcitemdb': '🏷️',
      'openfoodfacts': '🍎',
      'wikidata': '📚',
      'gepir': '🏢',
      'google_shopping': '🛒',
      'basic_web_search': '🌐',
      'ai_inference': '🤖',
      'ownership_mappings': '🔗',
      'enhanced_agent_research': '🧠',
      'user_contribution': '👤'
    };
    return iconMap[source] || '❓';
  };

  const getSourceName = (source: string) => {
    const nameMap: { [key: string]: string } = {
      'supabase_cache': 'Supabase Cache',
      'upcitemdb': 'UPCitemdb',
      'openfoodfacts': 'Open Food Facts',
      'wikidata': 'Wikidata',
      'gepir': 'GS1 GEPIR',
      'google_shopping': 'Google Shopping',
      'basic_web_search': 'Basic Web Search',
      'ai_inference': 'AI Inference',
      'ownership_mappings': 'Ownership Mappings',
      'enhanced_agent_research': 'Enhanced Agent Research',
      'user_contribution': 'User Contribution'
    };
    return nameMap[source] || source;
  };

  const getSourceDescription = (source: string) => {
    const descMap: { [key: string]: string } = {
      'supabase_cache': 'Local database cache',
      'upcitemdb': 'US-focused product database',
      'openfoodfacts': 'European food products database',
      'wikidata': 'Global knowledge base (GTIN-13)',
      'gepir': 'Company prefix registry',
      'google_shopping': 'Web search for products',
      'basic_web_search': 'Fallback web search',
      'ai_inference': 'Pattern-based region detection',
      'ownership_mappings': 'Static ownership database',
      'enhanced_agent_research': 'AI-powered ownership research',
      'user_contribution': 'User-provided information'
    };
    return descMap[source] || 'Unknown source';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Barcode Lookup Trace
          <Badge variant="outline" className="text-xs">
            {trace.attempts.length} attempts
          </Badge>
        </CardTitle>
        <div className="text-sm text-gray-600">
          <div>Barcode: {trace.barcode}</div>
          <div>Total duration: {formatDuration(trace.total_duration_ms)}</div>
          <div>Final result: {trace.final_result}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trace.attempts.map((attempt, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                attempt.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                  {getSourceIcon(attempt.source)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {getSourceName(attempt.source)}
                  </span>
                  <Badge
                    variant={attempt.success ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {attempt.success ? '✅ Success' : '❌ Failed'}
                  </Badge>
                </div>
                
                <div className="text-xs text-gray-600 mb-1">
                  {getSourceDescription(attempt.source)}
                </div>
                
                {attempt.reason && (
                  <div className="text-xs text-gray-500">
                    Reason: {attempt.reason}
                  </div>
                )}
                
                {attempt.error && (
                  <div className="text-xs text-red-600">
                    Error: {attempt.error}
                  </div>
                )}
                
                <div className="text-xs text-gray-400 mt-1">
                  {formatTimestamp(attempt.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {trace.attempts.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No lookup attempts recorded
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LookupTrace; 
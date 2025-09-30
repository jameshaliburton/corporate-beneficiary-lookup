'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Head from 'next/head';

// Admin guard - check for admin environment variable
const isAdminEnabled = process.env.NEXT_PUBLIC_ADMIN_ENABLED === 'true';

interface ExplanationRequirement {
  status: 'confirmed' | 'not_found' | 'ambiguous' | 'insufficient_evidence';
  explanation: string;
  evidence_quality: number;
  supporting_snippets?: string[];
  contradicting_snippets?: string[];
  missing_information?: string[];
}

interface ExplanationsByRequirement {
  [key: string]: ExplanationRequirement;
}

interface GeminiAnalysis {
  explanations_by_requirement?: ExplanationsByRequirement;
  enhanced_match_enabled?: boolean;
  verification_requirements_analyzed?: string[];
  prompt?: string;
  raw_output?: string;
}

interface PipelineResult {
  brand?: string;
  agent_results?: {
    gemini_analysis?: GeminiAnalysis;
  };
}

export default function AdminGeminiVerificationPage() {
  const params = useParams();
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRequirements, setExpandedRequirements] = useState<Set<string>>(new Set());
  const [showPrompt, setShowPrompt] = useState(false);
  const [showRawOutput, setShowRawOutput] = useState(false);

  const brandSlug = params.brand as string;

  useEffect(() => {
    // Check admin access
    if (!isAdminEnabled) {
      setError('Admin access not enabled');
      setIsLoading(false);
      return;
    }

    // Get data from sessionStorage (same as result page)
    const storedPipelineResult = sessionStorage.getItem('pipelineResult');
    
    if (storedPipelineResult) {
      try {
        const parsedResult = JSON.parse(storedPipelineResult);
        console.log('🔍 Admin: Retrieved pipeline result:', {
          brand: parsedResult.brand,
          hasAgentResults: !!parsedResult.agent_results,
          hasGeminiAnalysis: !!parsedResult.agent_results?.gemini_analysis,
          hasExplanations: !!parsedResult.agent_results?.gemini_analysis?.explanations_by_requirement
        });
        
        setPipelineResult(parsedResult);
      } catch (err) {
        console.error('❌ Admin: Error parsing stored pipeline result:', err);
        setError('Failed to parse stored data');
      }
    } else {
      setError('No stored pipeline result found');
    }
    
    setIsLoading(false);
  }, [brandSlug]);

  const toggleRequirementExpansion = (requirement: string) => {
    setExpandedRequirements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requirement)) {
        newSet.delete(requirement);
      } else {
        newSet.add(requirement);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'not_found':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ambiguous':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'insufficient_evidence':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEvidenceQualityColor = (quality: number) => {
    if (quality >= 4) return 'text-green-600 font-semibold';
    if (quality >= 3) return 'text-yellow-600 font-semibold';
    if (quality >= 2) return 'text-orange-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const formatRequirementName = (requirement: string) => {
    return requirement.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log(`${type} copied to clipboard`);
      // You could add a toast notification here if desired
    } catch (err) {
      console.error(`Failed to copy ${type}:`, err);
    }
  };

  const extractDomainFromSnippet = (snippet: string) => {
    // Try to extract domain from snippet text
    const domainMatch = snippet.match(/\(([^)]+)\)/);
    return domainMatch ? domainMatch[1] : 'Unknown Source';
  };

  if (!isAdminEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Admin access is not enabled.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const geminiAnalysis = pipelineResult?.agent_results?.gemini_analysis;
  const explanations = geminiAnalysis?.explanations_by_requirement;

  if (!explanations) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Enhanced Verification Data</h1>
          <p className="text-gray-600 mb-4">
            No enhanced Gemini verification explanations found for brand: <strong>{brandSlug}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            This could mean the enhanced verification feature is disabled or no verification was performed.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Gemini Verification Debug - {brandSlug}</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gemini Verification Debug</h1>
                <p className="text-gray-600 mt-2">Enhanced verification analysis for brand: <strong>{brandSlug}</strong></p>
              </div>
              <button 
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                ← Back to Result
              </button>
            </div>
            
            {/* Feature flag status */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${geminiAnalysis?.enhanced_match_enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  Enhanced Match: {geminiAnalysis?.enhanced_match_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {geminiAnalysis?.verification_requirements_analyzed && (
                <p className="text-xs text-gray-600 mt-1">
                  Requirements analyzed: {geminiAnalysis.verification_requirements_analyzed.join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Requirements Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Verification Requirements Analysis</h2>
              <p className="text-sm text-gray-600 mt-1">
                Detailed breakdown of each verification requirement with evidence quality and explanations
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requirement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Evidence Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Explanation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Snippet Sources
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(explanations).map(([requirement, data]) => (
                    <tr key={requirement} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatRequirementName(requirement)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(data.status)}`}>
                          {data.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-sm ${getEvidenceQualityColor(data.evidence_quality)}`}>
                            {data.evidence_quality}/5
                          </span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(data.evidence_quality / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md">
                          {data.explanation.length > 100 ? (
                            <div>
                              <p className={expandedRequirements.has(requirement) ? '' : 'truncate'}>
                                {data.explanation}
                              </p>
                              <button
                                onClick={() => toggleRequirementExpansion(requirement)}
                                className="text-blue-600 hover:text-blue-800 text-xs mt-1"
                              >
                                {expandedRequirements.has(requirement) ? 'Show less' : 'Show more'}
                              </button>
                            </div>
                          ) : (
                            <p>{data.explanation}</p>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 space-y-1">
                          {data.supporting_snippets && data.supporting_snippets.length > 0 && (
                            <div>
                              <span className="text-green-600 font-medium">Supporting:</span>
                              <ul className="mt-1 space-y-1">
                                {data.supporting_snippets.slice(0, 2).map((snippet, index) => (
                                  <li key={index} className="text-xs">
                                    {extractDomainFromSnippet(snippet)}
                                  </li>
                                ))}
                                {data.supporting_snippets.length > 2 && (
                                  <li className="text-xs text-gray-500">
                                    +{data.supporting_snippets.length - 2} more
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                          
                          {data.contradicting_snippets && data.contradicting_snippets.length > 0 && (
                            <div className="mt-2">
                              <span className="text-red-600 font-medium">Contradicting:</span>
                              <ul className="mt-1 space-y-1">
                                {data.contradicting_snippets.slice(0, 2).map((snippet, index) => (
                                  <li key={index} className="text-xs">
                                    {extractDomainFromSnippet(snippet)}
                                  </li>
                                ))}
                                {data.contradicting_snippets.length > 2 && (
                                  <li className="text-xs text-gray-500">
                                    +{data.contradicting_snippets.length - 2} more
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                          
                          {data.missing_information && data.missing_information.length > 0 && (
                            <div className="mt-2">
                              <span className="text-gray-600 font-medium">Missing:</span>
                              <ul className="mt-1 space-y-1">
                                {data.missing_information.slice(0, 2).map((info, index) => (
                                  <li key={index} className="text-xs">
                                    {info}
                                  </li>
                                ))}
                                {data.missing_information.length > 2 && (
                                  <li className="text-xs text-gray-500">
                                    +{data.missing_information.length - 2} more
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Total Requirements</div>
              <div className="text-2xl font-bold text-gray-900">{Object.keys(explanations).length}</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Confirmed</div>
              <div className="text-2xl font-bold text-green-600">
                {Object.values(explanations).filter(e => e.status === 'confirmed').length}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Not Found</div>
              <div className="text-2xl font-bold text-red-600">
                {Object.values(explanations).filter(e => e.status === 'not_found').length}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Avg Evidence Quality</div>
              <div className="text-2xl font-bold text-blue-600">
                {(Object.values(explanations).reduce((sum, e) => sum + e.evidence_quality, 0) / Object.values(explanations).length).toFixed(1)}
              </div>
            </div>
          </div>

          {/* Debug Sections */}
          <div className="mt-8 space-y-6">
            {/* Gemini Prompt Section */}
            <div className="bg-white rounded-lg shadow">
              <div 
                className="px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                onClick={() => setShowPrompt(!showPrompt)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    📤 Gemini Prompt
                    {geminiAnalysis?.prompt ? (
                      <span className="ml-2 text-sm font-normal text-green-600">(Available)</span>
                    ) : (
                      <span className="ml-2 text-sm font-normal text-gray-500">(Not stored for this scan)</span>
                    )}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {geminiAnalysis?.prompt && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(geminiAnalysis.prompt, 'Prompt');
                        }}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Copy Prompt
                      </button>
                    )}
                    <span className="text-gray-400">
                      {showPrompt ? '▼' : '▶'}
                    </span>
                  </div>
                </div>
              </div>
              
              {showPrompt && (
                <div className="px-6 py-4">
                  {geminiAnalysis?.prompt ? (
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap">
                      {geminiAnalysis.prompt}
                    </pre>
                  ) : (
                    <div className="text-gray-500 text-sm italic">
                      Prompt not stored for this scan. This may be because the enhanced verification feature was disabled or the scan was performed before this feature was added.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Gemini Raw Output Section */}
            <div className="bg-white rounded-lg shadow">
              <div 
                className="px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                onClick={() => setShowRawOutput(!showRawOutput)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    📥 Gemini Raw Output
                    {geminiAnalysis?.raw_output ? (
                      <span className="ml-2 text-sm font-normal text-green-600">(Available)</span>
                    ) : (
                      <span className="ml-2 text-sm font-normal text-gray-500">(Not stored for this scan)</span>
                    )}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {geminiAnalysis?.raw_output && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(geminiAnalysis.raw_output, 'Raw Output');
                        }}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Copy Output
                      </button>
                    )}
                    <span className="text-gray-400">
                      {showRawOutput ? '▼' : '▶'}
                    </span>
                  </div>
                </div>
              </div>
              
              {showRawOutput && (
                <div className="px-6 py-4">
                  {geminiAnalysis?.raw_output ? (
                    <div>
                      <div className="mb-2 text-sm text-gray-600">
                        Raw JSON response from Gemini API:
                      </div>
                      <pre className="bg-gray-50 p-4 rounded-lg text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap">
                        {geminiAnalysis.raw_output}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm italic">
                      Raw output not stored for this scan. This may be because the enhanced verification feature was disabled or the scan was performed before this feature was added.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

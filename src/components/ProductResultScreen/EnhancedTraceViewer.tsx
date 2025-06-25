import React, { useState } from 'react';

export interface EnhancedTraceViewerProps {
  trace: {
    trace_id: string;
    start_time: string;
    brand: string;
    product_name: string;
    barcode: string;
    stages: Array<{
      stage_id: string;
      stage: string;
      description: string;
      start_time: string;
      end_time?: string;
      status: string;
      reasoning: Array<{
        timestamp: string;
        type: string;
        content: string;
      }>;
      decisions: Array<{
        timestamp: string;
        decision: string;
        alternatives: string[];
        reasoning: string;
      }>;
      data: any;
      error?: string;
      duration_ms: number;
    }>;
    decisions: Array<{
      stage: string;
      timestamp: string;
      decision: string;
      alternatives: string[];
      reasoning: string;
    }>;
    reasoning_chain: Array<{
      stage: string;
      timestamp: string;
      type: string;
      content: string;
    }>;
    performance_metrics: {
      total_duration_ms: number;
      stage_durations: Record<string, number>;
      memory_usage?: number;
      api_calls: number;
      token_usage: number;
    };
    final_result: string;
    error_details?: string;
    confidence_evolution: Array<{
      stage: string;
      timestamp: string;
      confidence: number;
      factors: Record<string, any>;
    }>;
  };
}

const stageIcons: Record<string, string> = {
  cache_check: '💾',
  static_mapping: '🗂️',
  query_builder: '🔍',
  web_research: '🌐',
  ownership_analysis: '🧠',
  confidence_calculation: '📊',
  validation: '✅',
  database_save: '💾',
  evaluation: '📈',
  error_recovery: '⚠️'
};

const stageNames: Record<string, string> = {
  cache_check: 'Cache Check',
  static_mapping: 'Static Mapping',
  query_builder: 'Query Builder',
  web_research: 'Web Research',
  ownership_analysis: 'Ownership Analysis',
  confidence_calculation: 'Confidence Calculation',
  validation: 'Validation',
  database_save: 'Database Save',
  evaluation: 'Evaluation',
  error_recovery: 'Error Recovery'
};

const reasoningTypeColors: Record<string, { bg: string; color: string }> = {
  analysis: { bg: '#dbeafe', color: '#1e40af' },
  decision: { bg: '#dcfce7', color: '#166534' },
  evidence: { bg: '#fef3c7', color: '#92400e' },
  inference: { bg: '#e0e7ff', color: '#3730a3' },
  validation: { bg: '#f0f9ff', color: '#0369a1' },
  error: { bg: '#fee2e2', color: '#dc2626' },
  warning: { bg: '#fef3c7', color: '#d97706' },
  info: { bg: '#f3f4f6', color: '#374151' }
};

const EnhancedTraceViewer: React.FC<EnhancedTraceViewerProps> = ({ trace }) => {
  const [activeTab, setActiveTab] = useState<'stages' | 'reasoning' | 'decisions' | 'performance'>('stages');
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [expandedReasoning, setExpandedReasoning] = useState<Set<string>>(new Set());

  const toggleStageExpansion = (stageId: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStages(newExpanded);
  };

  const toggleReasoningExpansion = (reasoningId: string) => {
    const newExpanded = new Set(expandedReasoning);
    if (newExpanded.has(reasoningId)) {
      newExpanded.delete(reasoningId);
    } else {
      newExpanded.add(reasoningId);
    }
    setExpandedReasoning(newExpanded);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      padding: '1.25rem 1rem',
      marginBottom: '1.5rem',
      maxWidth: 420,
      marginLeft: 'auto',
      marginRight: 'auto',
    }}>
      {/* Header */}
      <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span role="img" aria-label="trace">🔍</span> Process Trace
        <span style={{ fontSize: 12, fontWeight: 400, color: '#666', marginLeft: 'auto' }}>
          {trace.trace_id}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 1, marginBottom: 16, background: '#f3f4f6', borderRadius: 8, padding: 2 }}>
        {[
          { key: 'stages', label: 'Stages', icon: '📋' },
          { key: 'reasoning', label: 'Reasoning', icon: '🧠' },
          { key: 'decisions', label: 'Decisions', icon: '🎯' },
          { key: 'performance', label: 'Performance', icon: '⚡' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: activeTab === tab.key ? '#fff' : 'transparent',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              color: activeTab === tab.key ? '#333' : '#666',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {activeTab === 'stages' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {trace.stages.map((stage, index) => (
              <div key={stage.stage_id} style={{
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                overflow: 'hidden'
              }}>
                {/* Stage Header */}
                <div
                  onClick={() => toggleStageExpansion(stage.stage_id)}
                  style={{
                    padding: '12px 16px',
                    background: '#f9fafb',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  <span style={{ fontSize: 20 }}>{stageIcons[stage.stage] || '📋'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>
                      {stageNames[stage.stage] || stage.stage}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {stage.description}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 500,
                      background: stage.status === 'success' ? '#dcfce7' :
                                 stage.status === 'error' ? '#fee2e2' :
                                 stage.status === 'partial' ? '#fef3c7' : '#f3f4f6',
                      color: stage.status === 'success' ? '#166534' :
                             stage.status === 'error' ? '#dc2626' :
                             stage.status === 'partial' ? '#92400e' : '#666'
                    }}>
                      {stage.status.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                      {formatDuration(stage.duration_ms)}
                    </div>
                  </div>
                </div>

                {/* Stage Details */}
                {expandedStages.has(stage.stage_id) && (
                  <div style={{ padding: '12px 16px', background: '#fff' }}>
                    {/* Reasoning */}
                    {stage.reasoning.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: '#333', marginBottom: 6 }}>
                          Reasoning ({stage.reasoning.length})
                        </div>
                        <div style={{ display: 'grid', gap: 6 }}>
                          {stage.reasoning.map((reasoning, idx) => (
                            <div key={idx} style={{
                              padding: '8px 12px',
                              background: reasoningTypeColors[reasoning.type]?.bg || '#f3f4f6',
                              borderRadius: 6,
                              fontSize: 12
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  fontSize: 10,
                                  fontWeight: 500,
                                  background: reasoningTypeColors[reasoning.type]?.color || '#666',
                                  color: '#fff'
                                }}>
                                  {reasoning.type.toUpperCase()}
                                </span>
                                <span style={{ fontSize: 10, color: '#666' }}>
                                  {formatTimestamp(reasoning.timestamp)}
                                </span>
                              </div>
                              <div style={{ color: reasoningTypeColors[reasoning.type]?.color || '#333' }}>
                                {reasoning.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Decisions */}
                    {stage.decisions.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: '#333', marginBottom: 6 }}>
                          Decisions ({stage.decisions.length})
                        </div>
                        <div style={{ display: 'grid', gap: 6 }}>
                          {stage.decisions.map((decision, idx) => (
                            <div key={idx} style={{
                              padding: '8px 12px',
                              background: '#f0f9ff',
                              borderRadius: 6,
                              border: '1px solid #bae6fd'
                            }}>
                              <div style={{ fontWeight: 500, fontSize: 12, color: '#0369a1', marginBottom: 4 }}>
                                {decision.decision}
                              </div>
                              {decision.alternatives.length > 0 && (
                                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                                  Alternatives: {decision.alternatives.join(', ')}
                                </div>
                              )}
                              {decision.reasoning && (
                                <div style={{ fontSize: 11, color: '#0369a1', fontStyle: 'italic' }}>
                                  {decision.reasoning}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Data */}
                    {Object.keys(stage.data).length > 0 && (
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 12, color: '#333', marginBottom: 6 }}>
                          Data
                        </div>
                        <pre style={{
                          background: '#f8f9fa',
                          padding: '8px 12px',
                          borderRadius: 6,
                          fontSize: 11,
                          color: '#333',
                          overflow: 'auto',
                          maxHeight: 100
                        }}>
                          {JSON.stringify(stage.data, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Error */}
                    {stage.error && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: '#dc2626', marginBottom: 4 }}>
                          Error
                        </div>
                        <div style={{
                          padding: '8px 12px',
                          background: '#fee2e2',
                          borderRadius: 6,
                          fontSize: 11,
                          color: '#dc2626'
                        }}>
                          {stage.error}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reasoning' && (
          <div style={{ display: 'grid', gap: 8 }}>
            {trace.reasoning_chain.map((reasoning, index) => (
              <div key={index} style={{
                padding: '12px',
                background: reasoningTypeColors[reasoning.type]?.bg || '#f3f4f6',
                borderRadius: 8,
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 500,
                      background: reasoningTypeColors[reasoning.type]?.color || '#666',
                      color: '#fff'
                    }}>
                      {reasoning.type.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#333' }}>
                      {stageNames[reasoning.stage] || reasoning.stage}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: '#666' }}>
                    {formatTimestamp(reasoning.timestamp)}
                  </span>
                </div>
                <div style={{ 
                  color: reasoningTypeColors[reasoning.type]?.color || '#333',
                  fontSize: 13,
                  lineHeight: 1.4
                }}>
                  {reasoning.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'decisions' && (
          <div style={{ display: 'grid', gap: 8 }}>
            {trace.decisions.map((decision, index) => (
              <div key={index} style={{
                padding: '12px',
                background: '#f0f9ff',
                borderRadius: 8,
                border: '1px solid #bae6fd'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#0369a1' }}>
                    {stageNames[decision.stage] || decision.stage}
                  </span>
                  <span style={{ fontSize: 11, color: '#666' }}>
                    {formatTimestamp(decision.timestamp)}
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#0369a1', marginBottom: 4 }}>
                  {decision.decision}
                </div>
                {decision.alternatives.length > 0 && (
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                    <strong>Alternatives:</strong> {decision.alternatives.join(', ')}
                  </div>
                )}
                {decision.reasoning && (
                  <div style={{ fontSize: 11, color: '#0369a1', fontStyle: 'italic' }}>
                    {decision.reasoning}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'performance' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {/* Summary */}
            <div style={{
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: 8,
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#333', marginBottom: 8 }}>
                Performance Summary
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#666' }}>Total Duration</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                    {formatDuration(trace.performance_metrics.total_duration_ms)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#666' }}>API Calls</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                    {trace.performance_metrics.api_calls}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#666' }}>Token Usage</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                    {trace.performance_metrics.token_usage.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#666' }}>Final Result</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                    {trace.final_result}
                  </div>
                </div>
              </div>
            </div>

            {/* Stage Durations */}
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#333', marginBottom: 8 }}>
                Stage Durations
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {Object.entries(trace.performance_metrics.stage_durations).map(([stage, duration]) => (
                  <div key={stage} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#f9fafb',
                    borderRadius: 6
                  }}>
                    <span style={{ fontSize: 12, color: '#333' }}>
                      {stageIcons[stage] || '📋'} {stageNames[stage] || stage}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>
                      {formatDuration(duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence Evolution */}
            {trace.confidence_evolution.length > 0 && (
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#333', marginBottom: 8 }}>
                  Confidence Evolution
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {trace.confidence_evolution.map((evolution, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#f0f9ff',
                      borderRadius: 6,
                      border: '1px solid #bae6fd'
                    }}>
                      <div>
                        <span style={{ fontSize: 12, color: '#0369a1' }}>
                          {stageNames[evolution.stage] || evolution.stage}
                        </span>
                        <div style={{ fontSize: 10, color: '#666' }}>
                          {formatTimestamp(evolution.timestamp)}
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        background: '#0369a1',
                        color: '#fff',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600
                      }}>
                        {evolution.confidence}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedTraceViewer; 
import React, { useState } from 'react';
import { getConfidenceColor, getConfidenceLabel } from '../../lib/agents/confidence-estimation.js';

export interface EnhancedConfidenceAttributionProps {
  confidence: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
  score?: number;
  factors?: Record<string, number>;
  breakdown?: Array<{
    factor: string;
    score: number;
    weight: number;
    contribution: number;
  }>;
  reasoning?: string;
  onConfirm?: () => void;
  onFlag?: () => void;
}

const factorLabels: Record<string, string> = {
  sourceQuality: 'Source Quality',
  evidenceStrength: 'Evidence Strength',
  agentAgreement: 'Agent Agreement',
  reasoningQuality: 'Reasoning Quality',
  dataConsistency: 'Data Consistency',
  executionReliability: 'Execution Reliability'
};

const factorDescriptions: Record<string, string> = {
  sourceQuality: 'Quality and reliability of information sources',
  evidenceStrength: 'Strength of evidence supporting the conclusion',
  agentAgreement: 'Agreement between different AI agents',
  reasoningQuality: 'Quality and detail of the reasoning process',
  dataConsistency: 'Consistency of data across sources',
  executionReliability: 'Reliability of the execution process'
};

const EnhancedConfidenceAttribution: React.FC<EnhancedConfidenceAttributionProps> = ({ 
  confidence, 
  score, 
  factors,
  breakdown,
  reasoning,
  onConfirm, 
  onFlag 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  const { bg, color } = getConfidenceColor(score || 0);
  
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        padding: '1.25rem 1rem',
        marginBottom: '1.5rem',
        maxWidth: 420,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span role="img" aria-label="confidence">📊</span> Confidence Assessment
      </div>
      
      {/* Main Confidence Display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span
          style={{
            background: bg,
            color,
            fontWeight: 600,
            fontSize: 15,
            borderRadius: 8,
            padding: '4px 14px',
            display: 'inline-block',
          }}
        >
          {confidence} {score !== undefined ? `(${score}%)` : ''}
        </span>
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{ 
            fontSize: 13, 
            color: '#2563eb', 
            textDecoration: 'underline', 
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0
          }}
        >
          {showDetails ? 'Hide details' : 'Show details'}
        </button>
      </div>
      
      {/* Confidence Reasoning */}
      {reasoning && (
        <div style={{ fontSize: 13, color: '#666', marginBottom: 8, fontStyle: 'italic' }}>
          {reasoning}
        </div>
      )}
      
      {/* Detailed Factors */}
      {showDetails && factors && (
        <div style={{ marginTop: 12, padding: 12, background: '#f8f9fa', borderRadius: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#333' }}>
            Confidence Factors
          </div>
          
          <div style={{ display: 'grid', gap: 8 }}>
            {Object.entries(factors).map(([factor, factorScore]) => (
              <div key={factor} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>
                    {factorLabels[factor] || factor}
                  </div>
                  <div style={{ fontSize: 11, color: '#666' }}>
                    {factorDescriptions[factor] || 'Confidence factor'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ 
                    width: 60, 
                    height: 6, 
                    background: '#e5e7eb', 
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${factorScore}%`,
                      height: '100%',
                      background: factorScore >= 70 ? '#10b981' : 
                                 factorScore >= 50 ? '#f59e0b' : '#ef4444',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#333', minWidth: 30 }}>
                    {Math.round(factorScore)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Breakdown Toggle */}
          {breakdown && breakdown.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                style={{
                  fontSize: 12,
                  color: '#2563eb',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {showBreakdown ? 'Hide' : 'Show'} detailed breakdown
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Detailed Breakdown */}
      {showDetails && showBreakdown && breakdown && (
        <div style={{ marginTop: 8, padding: 12, background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#0369a1' }}>
            Weighted Breakdown
          </div>
          
          <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
            Each factor contributes to the final confidence score based on its weight
          </div>
          
          <div style={{ display: 'grid', gap: 6 }}>
            {breakdown.map((item, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '4px 0',
                borderBottom: index < breakdown.length - 1 ? '1px solid #e0f2fe' : 'none'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#333' }}>
                    {factorLabels[item.factor] || item.factor}
                  </div>
                  <div style={{ fontSize: 10, color: '#666' }}>
                    Weight: {item.weight}%
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>
                    {item.contribution} pts
                  </div>
                  <div style={{ fontSize: 10, color: '#666' }}>
                    {item.score}% × {item.weight}%
                  </div>
                </div>
              </div>
            ))}
            
            {/* Total */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '8px 0',
              borderTop: '2px solid #0ea5e9',
              marginTop: 4
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0369a1' }}>
                Total Confidence
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0369a1' }}>
                {score}%
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button 
          onClick={onConfirm}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: '#dcfce7',
            color: '#166534',
            border: '1px solid #bbf7d0',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#bbf7d0'}
          onMouseOut={(e) => e.currentTarget.style.background = '#dcfce7'}
        >
          🙋 Confirm Result
        </button>
        <button 
          onClick={onFlag}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: '#fee2e2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#fecaca'}
          onMouseOut={(e) => e.currentTarget.style.background = '#fee2e2'}
        >
          ❗ Flag Issue
        </button>
      </div>
      
      {/* Confidence Level Explanation */}
      {showDetails && (
        <div style={{ marginTop: 12, padding: 8, background: '#fef3c7', borderRadius: 6, fontSize: 11, color: '#92400e' }}>
          <strong>Confidence Levels:</strong><br/>
          • <strong>Very High (85-100%):</strong> Strong evidence from reliable sources<br/>
          • <strong>High (70-84%):</strong> Good evidence with minor uncertainties<br/>
          • <strong>Medium (50-69%):</strong> Moderate evidence with some gaps<br/>
          • <strong>Low (30-49%):</strong> Limited evidence, significant uncertainties<br/>
          • <strong>Very Low (0-29%):</strong> Minimal evidence, high uncertainty
        </div>
      )}
    </div>
  );
};

export default EnhancedConfidenceAttribution; 
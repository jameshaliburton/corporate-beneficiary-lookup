import React from 'react';

export interface ConfidenceAttributionProps {
  confidence: 'High' | 'Medium' | 'Low';
  score?: number;
  onConfirm?: () => void;
  onFlag?: () => void;
}

const confidenceColors: Record<string, { bg: string; color: string }> = {
  High: { bg: '#e0f2fe', color: '#2563eb' }, // blue
  Medium: { bg: '#fef9c3', color: '#ca8a04' }, // yellow
  Low: { bg: '#fee2e2', color: '#dc2626' }, // red
};

const ConfidenceAttribution: React.FC<ConfidenceAttributionProps> = ({ confidence, score, onConfirm, onFlag }) => {
  const { bg, color } = confidenceColors[confidence] || confidenceColors.High;
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
      <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span role="img" aria-label="confidence">📊</span> Confidence
      </div>
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
        <a
          href="#"
          style={{ fontSize: 13, color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}
          title="Learn what affects confidence"
        >
          What affects this?
        </a>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button
          onClick={onConfirm}
          style={{
            background: '#dcfce7',
            color: '#166534',
            fontWeight: 600,
            border: 'none',
            borderRadius: 8,
            padding: '7px 16px',
            fontSize: 15,
            cursor: 'pointer',
            flex: 1,
          }}
        >
          🙋 Confirmed
        </button>
        <button
          onClick={onFlag}
          style={{
            background: '#fee2e2',
            color: '#b91c1c',
            fontWeight: 600,
            border: 'none',
            borderRadius: 8,
            padding: '7px 16px',
            fontSize: 15,
            cursor: 'pointer',
            flex: 1,
          }}
        >
          ❗ Flag Incorrect
        </button>
      </div>
    </div>
  );
};

export default ConfidenceAttribution; 
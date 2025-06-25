import React from 'react';

export interface OwnershipStep {
  name: string;
  country: string;
  flag: string;
  type: string;
  ultimate?: boolean;
}

export interface OwnershipTrailProps {
  steps: OwnershipStep[];
}

const typeStyles: Record<string, { bg: string; text: string; border: string }> = {
  Brand:    { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-300' },
  'Parent Company': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300' },
  'Ultimate Owner': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-400' },
  Public:   { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300' },
  Private:  { bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-300' },
  'State-owned': { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300' },
  Unknown:  { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
};

const OwnershipTrail: React.FC<OwnershipTrailProps> = ({ steps }) => {
  return (
    <div className="mb-6">
      <div className="font-semibold text-lg mb-2 flex items-center gap-2">
        <span role="img" aria-label="ownership">🧬</span> Ownership
      </div>
      <div className="flex overflow-x-auto gap-3 pb-2">
        {steps.map((step, i) => {
          const style = typeStyles[step.type] || typeStyles.Unknown;
          return (
            <React.Fragment key={i}>
              <div
                className={`min-w-[120px] max-w-[180px] ${style.bg} rounded-xl shadow-sm p-3 flex flex-col items-center relative border ${step.ultimate ? 'border-2 border-blue-500' : style.border}`}
              >
                <div className="text-2xl mb-1">{step.flag}</div>
                <div className="font-semibold text-base mb-1 text-center">{step.name}</div>
                <div
                  className={`text-xs font-medium ${style.text} bg-white rounded px-2 py-0.5 mb-1 border ${style.border}`}
                  style={{ letterSpacing: 0.2 }}
                >
                  {step.type || 'Unknown'}
                </div>
                {step.ultimate && (
                  <div className="text-sm text-blue-700 font-bold mt-1 flex items-center gap-1">
                    🎯 Ultimate Owner
                  </div>
                )}
              </div>
              {i < steps.length - 1 && (
                <div className="flex items-center self-center">
                  <span className="text-2xl text-gray-300 mx-1">→</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default OwnershipTrail; 
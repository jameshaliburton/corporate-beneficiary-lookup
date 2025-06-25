import React, { useState } from 'react';

interface TraceStep {
  step: string;
  description: string;
  status: 'success' | 'error' | 'in_progress' | 'pending';
  duration?: number;
  timestamp?: string;
  details?: string;
}

interface TraceProps {
  trace: TraceStep[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'in_progress': return '⏳';
    case 'pending': return '⏸️';
    default: return '•';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success': return 'text-green-700 bg-green-100 border-green-300';
    case 'error': return 'text-red-700 bg-red-100 border-red-300';
    case 'in_progress': return 'text-blue-700 bg-blue-100 border-blue-300';
    case 'pending': return 'text-gray-700 bg-gray-100 border-gray-300';
    default: return 'text-gray-700 bg-gray-100 border-gray-300';
  }
};

const Trace: React.FC<TraceProps> = ({ trace }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-green-50 rounded-lg border-2 border-green-200 shadow-sm mb-4 p-4">
      <div 
        className="flex items-center justify-between cursor-pointer" 
        onClick={() => setOpen((v) => !v)}
      >
        <h3 className="text-lg font-semibold text-green-900">🔍 Trace</h3>
        <button 
          className="px-3 py-1 text-sm font-medium text-green-700 hover:text-green-900 hover:bg-green-100 rounded-md transition-colors"
          aria-expanded={open}
          aria-controls="trace-content"
        >
          {open ? 'Hide' : 'Show Steps'}
        </button>
      </div>
      
      {open && (
        <div 
          id="trace-content"
          className="mt-4 space-y-3"
        >
          {trace.map((step, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-start gap-3">
                <div className="text-lg">{getStatusIcon(step.status)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{step.step}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(step.status)}`}>
                      {step.status.replace('_', ' ')}
                    </span>
                    {step.duration && (
                      <span className="text-xs text-gray-500">
                        {step.duration}ms
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{step.description}</p>
                  {step.details && (
                    <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      {step.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Trace; 
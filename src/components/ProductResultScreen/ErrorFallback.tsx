import React from 'react';

export interface ErrorFallbackProps {
  scenario: string;
  message: string;
  onRetry?: () => void;
  onManualEntry?: () => void;
  onFlag?: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  scenario, 
  message, 
  onRetry, 
  onManualEntry, 
  onFlag 
}) => {
  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="text-red-600 text-xl">⚠️</div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-1">{scenario}</h3>
          <p className="text-red-800 text-sm mb-3">{message}</p>
          
          <div className="flex flex-wrap gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors flex items-center gap-1"
              >
                🔄 Retry
              </button>
            )}
            {onManualEntry && (
              <button
                onClick={onManualEntry}
                className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors flex items-center gap-1"
              >
                📝 Manual Entry
              </button>
            )}
            {onFlag && (
              <button
                onClick={onFlag}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1"
              >
                ⚠️ Flag Issue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback; 
import React from 'react';

export interface StickyActionBarProps {
  onRetry?: () => void;
  onConfirm?: () => void;
  onFlag?: () => void;
  onManualEntry?: () => void;
  onScanAnother?: () => void;
  onShare?: () => void;
}

const StickyActionBar: React.FC<StickyActionBarProps> = ({ 
  onRetry, 
  onConfirm, 
  onFlag, 
  onManualEntry,
  onScanAnother,
  onShare
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 px-4 py-3">
      <div className="max-w-lg mx-auto">
        <div className="flex gap-2">
          {onScanAnother && (
            <button
              onClick={onScanAnother}
              className="flex-1 px-3 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1 border border-blue-200"
            >
              📱 Scan Another
            </button>
          )}
          {onShare && (
            <button
              onClick={onShare}
              className="flex-1 px-3 py-2.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center justify-center gap-1 border border-green-200"
            >
              📤 Share
            </button>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 px-3 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              🔄 Retry
            </button>
          )}
          {onConfirm && (
            <button
              onClick={onConfirm}
              className="flex-1 px-3 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              ✅ Confirm
            </button>
          )}
          {onFlag && (
            <button
              onClick={onFlag}
              className="px-3 py-2.5 text-sm font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors flex items-center gap-1"
            >
              ⚠️ Flag
            </button>
          )}
          {onManualEntry && (
            <button
              onClick={onManualEntry}
              className="px-3 py-2.5 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors flex items-center gap-1"
            >
              📝 Manual
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StickyActionBar; 
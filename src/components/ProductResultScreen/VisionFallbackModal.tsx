import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface VisionFallbackModalProps {
  onRetakePhoto: () => void;
  onManualEntry: () => void;
  onClose: () => void;
  isOpen: boolean;
  reason?: string;
}

const VisionFallbackModal: React.FC<VisionFallbackModalProps> = ({
  onRetakePhoto,
  onManualEntry,
  onClose,
  isOpen,
  reason
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">
            🔍 Try a Clearer Photo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center mb-4">
            We couldn't confidently identify the company. Try taking a clearer photo of the branding or logo.
          </p>
          
          {reason && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700">
                <strong>Issue:</strong> {reason}
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            <Button
              onClick={onRetakePhoto}
              className="w-full"
            >
              📸 Retake Photo
            </Button>
            
            <Button
              onClick={onManualEntry}
              variant="outline"
              className="w-full"
            >
              ✏️ Enter Manually Instead
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>💡 Tips for better photos:</strong>
            </p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Focus on the main brand logo or company name</li>
              <li>• Ensure good lighting and avoid shadows</li>
              <li>• Hold the camera steady and close enough to read text</li>
              <li>• Look for "Made by", "Produced by", or company contact info</li>
            </ul>
          </div>
          
          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisionFallbackModal; 
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CompanyCandidate {
  name: string;
  confidence: number;
  snippet?: string;
  type?: string;
  country?: string;
}

interface DisambiguationModalProps {
  candidates: CompanyCandidate[];
  onSelect: (candidate: CompanyCandidate) => void;
  onManualEntry: () => void;
  onClose: () => void;
  isOpen: boolean;
}

const DisambiguationModal: React.FC<DisambiguationModalProps> = ({
  candidates,
  onSelect,
  onManualEntry,
  onClose,
  isOpen
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">
            🔍 Multiple Companies Found
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center mb-4">
            We found multiple company names. Which one seems correct?
          </p>
          
          <div className="space-y-3">
            {candidates.map((candidate, index) => (
              <Button
                key={index}
                onClick={() => onSelect(candidate)}
                variant="outline"
                className="w-full justify-start text-left h-auto p-4"
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{candidate.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {candidate.confidence}%
                    </Badge>
                  </div>
                  {candidate.snippet && (
                    <p className="text-xs text-gray-600 mb-1">{candidate.snippet}</p>
                  )}
                  <div className="flex items-center gap-2">
                    {candidate.type && (
                      <Badge variant="outline" className="text-xs">
                        {candidate.type}
                      </Badge>
                    )}
                    {candidate.country && (
                      <Badge variant="outline" className="text-xs">
                        {candidate.country}
                      </Badge>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <Button
              onClick={onManualEntry}
              variant="outline"
              className="w-full"
            >
              ✏️ None of these — enter manually
            </Button>
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

export default DisambiguationModal; 
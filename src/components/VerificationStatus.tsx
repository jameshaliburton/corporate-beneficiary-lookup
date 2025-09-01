"use client";

import { useState } from 'react';
import { CheckCircle, XCircle, HelpCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VerificationStatusProps {
  verdict: 'yes' | 'no' | 'unclear';
  confidence: number;
  evidence: Array<{ url: string; domain: string }>;
  duration_ms: number;
  provider: string;
}

export function VerificationStatus({ verdict, confidence, evidence, duration_ms, provider }: VerificationStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusConfig = () => {
    switch (verdict) {
      case 'yes':
        return {
          icon: CheckCircle,
          text: 'Verified',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'no':
        return {
          icon: XCircle,
          text: 'Unverified',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'unclear':
      default:
        return {
          icon: HelpCircle,
          text: 'Unclear',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="mt-4">
      {/* Status Pill */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`inline-flex items-center gap-2 ${config.bgColor} ${config.borderColor} ${config.color} hover:${config.bgColor}`}
      >
        <Icon className="w-4 h-4" />
        <span className="font-medium">{config.text}</span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 p-4 bg-muted/50 rounded-lg space-y-3">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Confidence:</span>
              <span className="font-medium">{(confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provider:</span>
              <span className="font-medium">{provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{duration_ms}ms</span>
            </div>
          </div>

          {/* Evidence Links */}
          {evidence.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Supporting Sources:</h4>
              <div className="space-y-2">
                {evidence.map((item, index) => (
                  <a
                    key={index}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="font-medium">{item.domain}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

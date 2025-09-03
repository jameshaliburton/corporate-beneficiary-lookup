"use client";

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, HelpCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  status: "confirmed" | "contradicted" | "mixed_evidence" | "insufficient_evidence";
  confidenceChange?: "increased" | "decreased" | "unchanged";
  className?: string;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ 
  status, 
  confidenceChange,
  className 
}) => {
  // Debug logging for verification badge
  console.log('[VerificationBadge] VERIFICATION_DEBUG - Badge received props:', {
    status,
    confidenceChange,
    className,
    statusType: typeof status,
    statusValue: status
  });

  const getStatusConfig = () => {
    switch (status) {
      case 'confirmed':
        return {
          icon: CheckCircle,
          label: 'Verified by AI',
          className: 'bg-green-900/20 text-green-400 border-green-500/30',
          iconClassName: 'text-green-400'
        };
      case 'contradicted':
        return {
          icon: AlertTriangle,
          label: 'Contradictory evidence',
          className: 'bg-blue-900/20 text-blue-400 border-blue-500/30',
          iconClassName: 'text-blue-400'
        };
      case 'mixed_evidence':
        return {
          icon: AlertTriangle,
          label: 'Conflicting sources',
          className: 'bg-blue-900/20 text-blue-400 border-blue-500/30',
          iconClassName: 'text-blue-400'
        };
      case 'insufficient_evidence':
      default:
        return {
          icon: HelpCircle,
          label: 'Not enough info',
          className: 'bg-gray-900/20 text-gray-400 border-gray-500/30',
          iconClassName: 'text-gray-400'
        };
    }
  };

  const getConfidenceChangeText = () => {
    switch (confidenceChange) {
      case 'increased':
        return 'Confidence increased';
      case 'decreased':
        return 'Confidence decreased';
      case 'unchanged':
        return 'Confidence unchanged';
      default:
        return '';
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        variant="outline"
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
          config.className
        )}
        title={confidenceChange ? getConfidenceChangeText() : undefined}
      >
        <Icon className={cn("w-4 h-4", config.iconClassName)} />
        {config.label}
      </Badge>
    </div>
  );
};

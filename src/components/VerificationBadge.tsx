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
  const getStatusConfig = () => {
    switch (status) {
      case 'confirmed':
        return {
          icon: CheckCircle,
          label: 'Verified by AI',
          className: 'bg-green-100 text-green-900',
          iconClassName: 'text-green-900'
        };
      case 'contradicted':
        return {
          icon: AlertTriangle,
          label: 'Contradictory evidence',
          className: 'bg-blue-100 text-blue-900',
          iconClassName: 'text-blue-900'
        };
      case 'mixed_evidence':
        return {
          icon: AlertTriangle,
          label: 'Conflicting sources',
          className: 'bg-blue-100 text-blue-900',
          iconClassName: 'text-blue-900'
        };
      case 'insufficient_evidence':
      default:
        return {
          icon: HelpCircle,
          label: 'Not enough info',
          className: 'bg-gray-100 text-gray-700',
          iconClassName: 'text-gray-700'
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
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-0 transition-colors",
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

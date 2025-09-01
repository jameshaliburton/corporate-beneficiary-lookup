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
          className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
          iconClassName: 'text-green-600'
        };
      case 'contradicted':
        return {
          icon: AlertTriangle,
          label: 'Contradictory evidence',
          className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
          iconClassName: 'text-blue-600'
        };
      case 'mixed_evidence':
        return {
          icon: AlertTriangle,
          label: 'Conflicting sources',
          className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
          iconClassName: 'text-blue-600'
        };
      case 'insufficient_evidence':
      default:
        return {
          icon: HelpCircle,
          label: 'Not enough info',
          className: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
          iconClassName: 'text-gray-500'
        };
    }
  };

  const getConfidenceChangeIcon = () => {
    switch (confidenceChange) {
      case 'increased':
        return <TrendingUp className="w-3 h-3 text-green-600" />;
      case 'decreased':
        return <TrendingDown className="w-3 h-3 text-red-600" />;
      case 'unchanged':
        return <Minus className="w-3 h-3 text-gray-500" />;
      default:
        return null;
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
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
          config.className
        )}
        title={confidenceChange ? getConfidenceChangeText() : undefined}
      >
        <Icon className={cn("w-4 h-4", config.iconClassName)} />
        {config.label}
      </Badge>
      
      {confidenceChange && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          {getConfidenceChangeIcon()}
          <span className="hidden sm:inline">({confidenceChange})</span>
        </div>
      )}
    </div>
  );
};

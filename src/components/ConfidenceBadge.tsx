import { Check, AlertTriangle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface ConfidenceBadgeProps {
  confidence: number;
  size?: "sm" | "md" | "lg";
}

export function ConfidenceBadge({ confidence, size = "md" }: ConfidenceBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Auto-hide tooltip after 3 seconds when shown via click
  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => {
        setShowTooltip(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  const getConfidenceLevel = (score: number) => {
    if (score >= 80) return "high";
    if (score >= 50) return "medium";
    return "low";
  };

  const getIcon = (level: string) => {
    switch (level) {
      case "high":
        return <Check className="h-3 w-3" />;
      case "medium":
        return <AlertTriangle className="h-3 w-3" />;
      case "low":
        return <X className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const level = getConfidenceLevel(confidence);
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-4 py-2",
    lg: "text-base px-4 py-2"
  };

  const getTooltipText = (level: string) => {
    switch (level) {
      case "high":
        return "High confidence (80%+) - Multiple reliable sources confirm this ownership structure";
      case "medium":
        return "Medium confidence (50-79%) - Some sources found, but verification needed";
      case "low":
        return "Low confidence (<50%) - Limited sources available, consider manual verification";
      default:
        return "Confidence score based on source reliability and data completeness";
    }
  };

  return (
    <div className="relative group">
      <Badge 
        variant="secondary"
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          flex items-center gap-1.5 font-medium cursor-pointer
          ${sizeClasses[size]}
          ${level === "high" ? "confidence-high" : ""}
          ${level === "medium" ? "confidence-medium" : ""}
          ${level === "low" ? "confidence-low" : ""}
        `}
      >
        {getIcon(level)}
        {confidence}%
      </Badge>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 max-w-sm whitespace-normal">
          {getTooltipText(level)}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}
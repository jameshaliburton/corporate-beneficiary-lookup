import { Check, AlertTriangle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ConfidenceBadgeProps {
  confidence: number;
  size?: "sm" | "md" | "lg";
}

export function ConfidenceBadge({ confidence, size = "md" }: ConfidenceBadgeProps) {
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

  return (
    <Badge 
      variant="secondary"
      className={`
        flex items-center gap-1.5 font-medium
        ${sizeClasses[size]}
        ${level === "high" ? "confidence-high" : ""}
        ${level === "medium" ? "confidence-medium" : ""}
        ${level === "low" ? "confidence-low" : ""}
      `}
    >
      {getIcon(level)}
      {confidence}%
    </Badge>
  );
}
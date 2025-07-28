import { Eye, Search, Building, Check, AlertTriangle, X, Clock } from "lucide-react";

interface TraceSectionProps {
  stage: "vision" | "retrieval" | "ownership";
  status: "success" | "partial" | "failed";
  details: string;
  sources?: string[];
  duration?: number;
}

export function TraceSection({ stage, status, details, sources, duration }: TraceSectionProps) {
  const getStageConfig = (stage: string) => {
    switch (stage) {
      case "vision":
        return {
          icon: Eye,
          label: "Vision Analysis",
          color: "trace-vision"
        };
      case "retrieval":
        return {
          icon: Search,
          label: "Data Retrieval",
          color: "trace-retrieval"
        };
      case "ownership":
        return {
          icon: Building,
          label: "Ownership Mapping",
          color: "trace-ownership"
        };
      default:
        return {
          icon: Search,
          label: "Analysis",
          color: "trace-retrieval"
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <Check className="h-3 w-3 text-success" />;
      case "partial":
        return <AlertTriangle className="h-3 w-3 text-warning" />;
      case "failed":
        return <X className="h-3 w-3 text-destructive" />;
      default:
        return null;
    }
  };

  const config = getStageConfig(stage);
  const StageIcon = config.icon;

  return (
    <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
      <div className={`flex-shrink-0 p-2 rounded-full bg-muted ${config.color}`}>
        <StageIcon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium">{config.label}</h4>
            {getStatusIcon(status)}
          </div>
          
          {duration && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {duration}ms
            </div>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          {details}
        </p>
        
        {sources && sources.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Sources:</p>
            {sources.map((source, index) => (
              <a
                key={index}
                href={source}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline block truncate"
              >
                {source}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import { AlertTriangle, Database, Brain } from "lucide-react";

interface OutageBannerProps {
  trace?: any;
}

export function OutageBanner({ trace }: OutageBannerProps) {
  if (!trace) return null;

  const llmDegraded = trace.llm?.status === "degraded" || trace.llm?.status === "failed";
  const dbDown = trace.db?.status === "down";

  if (!llmDegraded && !dbDown) return null;

  return (
    <div className="space-y-2">
      {llmDegraded && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Brain className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-amber-800">Limited AI Analysis</h3>
            <p className="text-sm text-amber-700 mt-1">
              Some features are limited right now due to an AI service outage. Ownership data is still available.
            </p>
          </div>
        </div>
      )}
      
      {dbDown && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <Database className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-red-800">Database Temporarily Unavailable</h3>
            <p className="text-sm text-red-700 mt-1">
              Results limited due to a temporary database issue. We're showing cached data where possible.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

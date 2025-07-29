import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, Check, FileText, Info } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ResearchSummaryProps {
  brand: string;
  productName?: string;
  confidence: number;
  confidenceLevel: string;
  reasoning?: string;
  resultType?: string;
  sources?: string[];
  agentResults?: any;
  agentExecutionTrace?: any;
}

const ResearchSummary: React.FC<ResearchSummaryProps> = ({
  brand,
  productName,
  confidence,
  confidenceLevel,
  reasoning,
  resultType,
  sources = [],
  agentResults,
  agentExecutionTrace
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Debug logging
  console.log('[ResearchSummary] Component rendered with props:', {
    brand,
    productName,
    confidence,
    confidenceLevel,
    reasoning,
    resultType,
    sourcesCount: sources?.length,
    agentResults: !!agentResults,
    agentExecutionTrace: !!agentExecutionTrace
  });

  const generateResearchSummary = () => {
    const summary = [];
    
    // Research method
    if (resultType) {
      summary.push({ label: 'Research Method', content: getResearchMethodDescription(resultType) });
    }
    
    // Key steps - only if agent_results is available
    if (agentResults && agentExecutionTrace?.stages) {
      const keySteps = agentExecutionTrace.stages
        .filter((stage: any) => stage.status === 'success' || stage.status === 'completed')
        .slice(0, 3)
        .map((stage: any) => stage.stage || stage.name)
        .filter(Boolean);
      
      if (keySteps.length > 0) {
        summary.push({ label: 'Key Steps', content: keySteps.join(', ') });
      }
    }
    
    // Sources
    if (sources.length > 0) {
      const sourceCount = sources.length;
      summary.push({ label: 'Sources', content: `Analyzed ${sourceCount} source${sourceCount !== 1 ? 's' : ''} including ${getSourceTypes(sources)}` });
    }
    
    // Confidence reasoning
    if (reasoning) {
      summary.push({ label: 'Reasoning', content: reasoning });
    }
    
    // Confidence level explanation
    summary.push({ label: 'Confidence Level', content: getConfidenceExplanation(confidence, confidenceLevel) });
    
    // If no agent_results, provide a fallback explanation
    if (!agentResults) {
      summary.push({ label: 'Research Process', content: 'This result was found using our comprehensive ownership research pipeline, which combines multiple data sources and verification methods to determine corporate ownership structures.' });
    }
    
    return summary;
  };

  const getResearchMethodDescription = (resultType: string) => {
    const descriptions: Record<string, string> = {
      'llm_first_research': 'LLM-powered research with direct ownership analysis',
      'web_search_powered': 'Web search with enhanced source verification',
      'cache_hit': 'Retrieved from verified cached results',
      'user_input': 'Manual research with AI analysis',
      'ai_research': 'AI-powered research with multiple verification steps'
    };
    return descriptions[resultType] || 'Advanced AI research with multiple verification steps';
  };

  const getSourceTypes = (sources: string[]) => {
    const types = new Set<string>();
    sources.forEach(source => {
      if (source.includes('registry') || source.includes('virk.dk') || source.includes('brreg.no')) {
        types.add('business registries');
      } else if (source.includes('news') || source.includes('article')) {
        types.add('news sources');
      } else if (source.includes('corporate') || source.includes('company')) {
        types.add('corporate databases');
      } else {
        types.add('verified sources');
      }
    });
    return Array.from(types).join(', ');
  };

  const getConfidenceExplanation = (confidence: number, level: string) => {
    if (confidence >= 90) {
      return `Very high confidence (${confidence}%) - Multiple corroborating sources with recent data`;
    } else if (confidence >= 75) {
      return `High confidence (${confidence}%) - Strong evidence from reliable sources`;
    } else if (confidence >= 50) {
      return `Moderate confidence (${confidence}%) - Good evidence but some uncertainty`;
    } else if (confidence >= 25) {
      return `Low confidence (${confidence}%) - Limited or conflicting evidence`;
    } else {
      return `Very low confidence (${confidence}%) - Insufficient evidence for definitive conclusion`;
    }
  };

  const researchSummary = generateResearchSummary();

  return (
    <Card className="transition-smooth glass-card rounded-component animate-reveal-slide" style={{ animationDelay: '0.8s' }}>
      <CardHeader className="pb-card-gap-sm p-card-padding">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full p-0 h-auto hover:bg-transparent"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="text-small font-medium">How We Found These Results</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-card-gap-sm p-card-padding pt-0 animate-accordion-down">
          <div className="space-y-3">
            <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex-shrink-0 p-2 rounded-full bg-muted trace-retrieval">
                <FileText className="h-4 w-4" />
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">Research Summary</h4>
                    <Check className="h-3 w-3 text-success" />
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  {researchSummary.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="font-medium text-foreground">{item.label}</div>
                      <div className="leading-relaxed">{item.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {agentResults && (
              <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
                <div className="flex-shrink-0 p-2 rounded-full bg-muted trace-ownership">
                  <Check className="h-4 w-4" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">Research Details</h4>
                      <Check className="h-3 w-3 text-success" />
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {Object.entries(agentResults).map(([agent, result]: [string, any]) => (
                      <div key={agent} className="flex items-start gap-2">
                        <Check className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium capitalize">{agent.replace(/_/g, ' ')}</span>
                          {result.reasoning && (
                            <span className="text-muted-foreground">: {result.reasoning}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {agentExecutionTrace?.performance_metrics && (
              <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
                <div className="flex-shrink-0 p-2 rounded-full bg-muted trace-vision">
                  <Check className="h-4 w-4" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">Performance</h4>
                      <Check className="h-3 w-3 text-success" />
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <div>Total Duration: {Math.round(agentExecutionTrace.performance_metrics.total_duration_ms / 1000)}s</div>
                    <div>API Calls: {agentExecutionTrace.performance_metrics.api_calls}</div>
                    <div>Token Usage: {agentExecutionTrace.performance_metrics.token_usage}</div>
                  </div>
                </div>
              </div>
            )}
            
            {!agentResults && !agentExecutionTrace?.performance_metrics && (
              <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
                <div className="flex-shrink-0 p-2 rounded-full bg-muted trace-vision">
                  <Info className="h-4 w-4" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">Research Information</h4>
                      <Check className="h-3 w-3 text-success" />
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>This result was retrieved from our verified ownership database. The research process combines multiple data sources including business registries, corporate filings, and verified news sources to determine accurate ownership information.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ResearchSummary; 
import { TraceData } from './pipeline-transformer';

export interface FormattedTraceSection {
  title: string;
  description: string;
  stages: TraceData[];
}

export function formatTraceStages(traces: TraceData[]): FormattedTraceSection[] {
  // Group traces by stage type
  const visionStages = traces.filter(t => t.stage === 'vision');
  const retrievalStages = traces.filter(t => t.stage === 'retrieval');
  const ownershipStages = traces.filter(t => t.stage === 'ownership');

  const sections: FormattedTraceSection[] = [];

  // Vision Analysis section
  if (visionStages.length > 0) {
    sections.push({
      title: 'Vision Analysis',
      description: 'Detected brand name and packaging details',
      stages: visionStages
    });
  }

  // Data Retrieval section
  if (retrievalStages.length > 0) {
    sections.push({
      title: 'Data Retrieval',
      description: 'Fetched corporate ownership and parent company information',
      stages: retrievalStages
    });
  }

  // Ownership Mapping section
  if (ownershipStages.length > 0) {
    sections.push({
      title: 'Ownership Mapping',
      description: 'Confirmed ultimate owner and corporate hierarchy',
      stages: ownershipStages
    });
  }

  return sections;
}

export function getTraceStatusIcon(status: 'success' | 'partial' | 'failed'): string {
  switch (status) {
    case 'success':
      return '✅';
    case 'partial':
      return '⚠️';
    case 'failed':
      return '❌';
    default:
      return '⏳';
  }
}

export function getTraceStatusColor(status: 'success' | 'partial' | 'failed'): string {
  switch (status) {
    case 'success':
      return 'text-green-500';
    case 'partial':
      return 'text-yellow-500';
    case 'failed':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
} 
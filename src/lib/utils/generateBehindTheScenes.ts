export function generateBehindTheScenes(traceSummary: any): string | null {
  if (!traceSummary) return null;

  const { vision, retrieval, mapping } = traceSummary;
  return `We used AI to analyze the brand and its packaging ("${vision}"), 
verified ownership data ("${retrieval}"), and mapped the corporate structure ("${mapping}"). 
This combination of AI vision, retrieval, and reasoning confirmed the ownership trail.`;
} 
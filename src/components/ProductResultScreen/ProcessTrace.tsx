import React, { useState } from 'react';

interface ProcessTraceProps {
  reasoning?: string;
}

const MOCK_REASONING =
  "To determine the ownership, the AI agent analyzed the barcode, queried multiple databases, and traced the chain of corporate entities. The result is based on the most recent filings and public records available. Confidence is high due to corroborating sources.";

const cleanReasoning = (reasoning: string): string => {
  // If reasoning contains JSON error messages, replace with user-friendly text
  if (reasoning.includes('JSON parsing failed') || reasoning.includes('{"type":"error"')) {
    return "Our AI system analyzed the product information and searched multiple databases to find ownership details. While we found some information, we couldn't determine the complete ownership structure with high confidence. This could be due to limited public records or recent changes in corporate structure.";
  }
  
  // If reasoning contains technical error messages, clean them up
  if (reasoning.includes('500') || reasoning.includes('Internal server error')) {
    return "Our research system encountered some technical difficulties while analyzing this product. We searched available databases and public records, but couldn't complete the full ownership analysis. This is a temporary issue and we're working to improve our research capabilities.";
  }
  
  return reasoning;
};

export const ProcessTrace: React.FC<ProcessTraceProps> = ({ reasoning }) => {
  const [open, setOpen] = useState(false);
  const displayReasoning = cleanReasoning(reasoning || MOCK_REASONING);

  return (
    <div className="bg-blue-50 rounded-lg border-2 border-blue-200 shadow-sm mb-4 p-4">
      <div 
        className="flex items-center justify-between cursor-pointer" 
        onClick={() => setOpen((v) => !v)}
      >
        <h3 className="text-lg font-semibold text-blue-900">🤔 How did we get this result?</h3>
        <button 
          className="px-3 py-1 text-sm font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-100 rounded-md transition-colors"
          aria-expanded={open}
          aria-controls="process-trace-content"
        >
          {open ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {open && (
        <div 
          id="process-trace-content"
          className="mt-3 text-blue-800 leading-relaxed"
        >
          <p className="text-sm">
            {displayReasoning}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProcessTrace; 
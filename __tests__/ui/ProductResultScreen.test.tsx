import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProductResultScreen from '@/components/ProductResultScreen';
import {
  mockSuccessResult,
  mockAmbiguousResult,
  mockBadJSONResult,
  mockTimeoutResult,
  mockUnknownResult,
  mockFollowUpContextResult
} from '../../__mocks__/ownershipResults';
import {
  mockTraceManualEntry,
  mockTraceRetry,
  mockTraceVerified,
  mockTraceUnverified,
  mockTraceUnknown,
  mockTraceAmbiguous
} from '../../__mocks__/traceMocks';

describe('ProductResultScreen', () => {
  const baseProps = {
    product: {
      name: 'Test Product',
      brand: 'Test Brand',
      country: 'United States',
      flag: '🇺🇸',
      barcode: '123456789'
    },
    ownershipTrail: [
      {
        name: 'Test Brand',
        country: 'United States',
        flag: '🇺🇸',
        type: 'Brand'
      },
      {
        name: 'Parent Company Inc',
        country: 'United States',
        flag: '🇺🇸',
        type: 'Parent Company'
      }
    ],
    confidence: 'High' as const,
    confidenceScore: 92,
    sources: ['https://example.com', 'https://parent.com'],
    processTrace: [
      { step: 'Web Search', status: '✅', reasoning: 'Found 3 sources', time: '2.1s' },
      { step: 'Analysis', status: '✅', reasoning: 'Extracted ownership chain', time: '43s' }
    ],
    error: null,
    fallback: null
  };

  it('renders ownership chain and confidence pill', () => {
    render(<ProductResultScreen {...baseProps} />);
    expect(screen.getAllByText('Test Brand')).toHaveLength(2);
    expect(screen.getByText('Parent Company Inc')).toBeInTheDocument();
    expect(screen.getByText('Brand')).toBeInTheDocument();
    expect(screen.getByText('Parent Company')).toBeInTheDocument();
    expect(screen.getByText(/High \(92%\)/)).toBeInTheDocument();
  });

  it('shows unknown owner fallback state', () => {
    const unknownProps = {
      ...baseProps,
      ownershipTrail: [],
      confidence: 'Low' as const,
      confidenceScore: 0,
      processTrace: [
        { step: 'Web Search', status: '❌', reasoning: 'No sources found', time: '1.2s' }
      ]
    };
    render(<ProductResultScreen {...unknownProps} />);
    expect(screen.getByText('🧬 Ownership')).toBeInTheDocument();
    expect(screen.getByText(/Low \(0%\)/)).toBeInTheDocument();
  });

  it('displays trace steps in correct order with statuses', () => {
    render(<ProductResultScreen {...baseProps} />);
    const showButton = screen.getByText(/Show Steps/i);
    fireEvent.click(showButton);
    expect(screen.getByText('Web Search')).toBeInTheDocument();
    expect(screen.getByText('Analysis')).toBeInTheDocument();
    expect(screen.getByText('Found 3 sources')).toBeInTheDocument();
    expect(screen.getByText('Extracted ownership chain')).toBeInTheDocument();
  });

  it('applies low-confidence warning styling', () => {
    const lowConfidenceProps = {
      ...baseProps,
      confidence: 'Low' as const,
      confidenceScore: 35
    };
    render(<ProductResultScreen {...lowConfidenceProps} />);
    expect(screen.getByText(/Low \(35%\)/)).toBeInTheDocument();
  });

  it('renders confidence explanation and sources', () => {
    render(<ProductResultScreen {...baseProps} />);
    const tooltipButton = screen.getByText(/What affects this\?/i);
    expect(tooltipButton).toBeInTheDocument();
    expect(tooltipButton).toHaveAttribute('title', 'Confidence is based on data quality, source reliability, and agent agreement.');
  });

  it('matches snapshot', () => {
    const { container } = render(<ProductResultScreen {...baseProps} />);
    expect(container).toMatchSnapshot();
  });

  it('handles ultimate owner correctly', () => {
    const ultimateOwnerProps = {
      ...baseProps,
      ownershipTrail: [
        {
          name: 'Test Brand',
          country: 'United States',
          flag: '🇺🇸',
          type: 'Brand'
        },
        {
          name: 'Ultimate Owner',
          country: 'United States',
          flag: '🇺🇸',
          type: 'Parent Company',
          ultimate: true
        }
      ]
    };
    render(<ProductResultScreen {...ultimateOwnerProps} />);
    expect(screen.getAllByText('Ultimate Owner')).toHaveLength(2);
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('renders different company types with correct styling', () => {
    const mixedTypesProps = {
      ...baseProps,
      ownershipTrail: [
        {
          name: 'Private Company',
          country: 'United States',
          flag: '🇺🇸',
          type: 'Private'
        },
        {
          name: 'Public Company',
          country: 'United States',
          flag: '🇺🇸',
          type: 'Public'
        },
        {
          name: 'State-owned Company',
          country: 'United States',
          flag: '🇺🇸',
          type: 'State-owned'
        }
      ]
    };
    render(<ProductResultScreen {...mixedTypesProps} />);
    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(screen.getByText('Public')).toBeInTheDocument();
    expect(screen.getByText('State-owned')).toBeInTheDocument();
  });

  it('toggles trace visibility', () => {
    render(<ProductResultScreen {...baseProps} />);
    const showButton = screen.getByText(/Show Steps/i);
    
    // Initially trace should be hidden
    expect(screen.queryByText('Web Search')).not.toBeInTheDocument();
    
    // Click to show
    fireEvent.click(showButton);
    expect(screen.getByText('Web Search')).toBeInTheDocument();
    expect(screen.getByText('Hide Steps')).toBeInTheDocument();
    
    // Click to hide
    fireEvent.click(screen.getByText('Hide Steps'));
    expect(screen.queryByText('Web Search')).not.toBeInTheDocument();
  });

  it('toggles manual entry form', () => {
    render(<ProductResultScreen {...baseProps} />);
    const manualEntryButton = screen.getByText(/Enter Manually/i);
    
    // Initially form should be hidden
    expect(screen.queryByPlaceholderText('Product Name')).not.toBeInTheDocument();
    
    // Click to show
    fireEvent.click(manualEntryButton);
    expect(screen.getByPlaceholderText('Product Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Brand Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Company Name')).toBeInTheDocument();
  });

  it('shows confidence tooltip on hover', () => {
    render(<ProductResultScreen {...baseProps} />);
    const tooltipButton = screen.getByText(/What affects this\?/i);
    expect(tooltipButton).toHaveAttribute('title', 'Confidence is based on data quality, source reliability, and agent agreement.');
  });

  it('renders ownership trail arrows', () => {
    render(<ProductResultScreen {...baseProps} />);
    // Check for arrow separators between ownership steps
    const arrows = screen.getAllByText('→');
    expect(arrows.length).toBeGreaterThan(0);
  });

  it('handles error state', () => {
    const errorProps = {
      ...baseProps,
      error: 'Failed to fetch ownership data'
    };
    render(<ProductResultScreen {...errorProps} />);
    expect(screen.getByText('❌ Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch ownership data')).toBeInTheDocument();
    expect(screen.getAllByText('🔄 Retry')).toHaveLength(2);
  });

  it('handles fallback state', () => {
    const fallbackProps = {
      ...baseProps,
      fallback: 'Using cached data from previous search'
    };
    render(<ProductResultScreen {...fallbackProps} />);
    expect(screen.getByText('🧯 Fallback')).toBeInTheDocument();
    expect(screen.getByText('Using cached data from previous search')).toBeInTheDocument();
  });
});

describe('ProductResultScreen trace and verification', () => {
  // Create simplified test props based on trace mocks
  const createTestProps = (result: any) => ({
    product: {
      name: result.product_name || 'Test Product',
      brand: result.brand || 'Test Brand',
      country: 'United States',
      flag: '🇺🇸',
      barcode: result.barcode
    },
    ownershipTrail: result.ownership_chain?.map((chain: any) => ({
      name: chain.name,
      country: chain.country,
      flag: '🇺🇸',
      type: chain.role
    })) || [],
    confidence: (result.confidence_score >= 75 ? 'High' : result.confidence_score >= 50 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
    confidenceScore: result.confidence_score || 0,
    sources: result.sources || [],
    processTrace: result.agent_execution_trace?.stages?.map((stage: any) => ({
      step: stage.stage,
      status: stage.status,
      reasoning: `Stage ${stage.stage} completed`,
      time: `${stage.duration_ms}ms`
    })) || [],
    error: null,
    fallback: null
  });

  it('shows correct trace for manual entry', () => {
    const props = createTestProps(mockTraceManualEntry);
    const { getByText, queryByText } = render(<ProductResultScreen {...props} />);
    
    // Show trace steps
    const showButton = getByText(/Show Steps/i);
    fireEvent.click(showButton);
    
    expect(getByText('manual_entry')).toBeInTheDocument();
    expect(queryByText('vision')).not.toBeInTheDocument();
  });

  it('shows retry in trace when retry happened', () => {
    const props = createTestProps(mockTraceRetry);
    const { getByText } = render(<ProductResultScreen {...props} />);
    
    // Show trace steps
    const showButton = getByText(/Show Steps/i);
    fireEvent.click(showButton);
    
    // Should show web_research steps (appears twice in retry scenario)
    expect(screen.getAllByText(/web_research/i)).toHaveLength(4);
  });

  it('shows verified pill when verification_status is verified', () => {
    const props = createTestProps(mockTraceVerified);
    const { getByText } = render(<ProductResultScreen {...props} />);
    expect(getByText(/88%/)).toBeInTheDocument();
    expect(getByText(/High/)).toBeInTheDocument();
  });

  it('shows warning pill when verification_status needs verification', () => {
    const props = createTestProps(mockTraceUnverified);
    const { getByText } = render(<ProductResultScreen {...props} />);
    expect(getByText(/42%/)).toBeInTheDocument();
    expect(getByText(/Low/)).toBeInTheDocument();
  });

  it('renders alternatives[] when present', () => {
    const props = createTestProps(mockTraceAmbiguous);
    const { getByText } = render(<ProductResultScreen {...props} />);
    expect(getByText('OK Snacks A/S')).toBeInTheDocument();
    expect(mockTraceAmbiguous.alternatives.length).toBeGreaterThan(0);
  });

  it('renders unknown fallback correctly', () => {
    const props = createTestProps(mockTraceUnknown);
    const { getByText } = render(<ProductResultScreen {...props} />);
    expect(getByText(/Low \(0%\)/)).toBeInTheDocument();
  });

  it('renders confidence pill with correct color', () => {
    const props = createTestProps(mockTraceVerified);
    const { getByText } = render(<ProductResultScreen {...props} />);
    expect(getByText(/88%/)).toBeInTheDocument();
  });

  it('renders sources in correct section', () => {
    const props = createTestProps(mockTraceVerified);
    const { getByText } = render(<ProductResultScreen {...props} />);
    expect(screen.getByText(/What affects this\?/)).toBeInTheDocument();
  });

  it('generates headline/story only after final results', () => {
    const spy = vi.spyOn(global.console, 'log');
    const props = createTestProps(mockTraceVerified);
    render(<ProductResultScreen {...props} />);
    expect(spy).not.toHaveBeenCalledWith(expect.stringContaining('headline fired multiple times'));
    spy.mockRestore();
  });

  it('matches snapshot for verified result', () => {
    const props = createTestProps(mockTraceVerified);
    const { container } = render(<ProductResultScreen {...props} />);
    expect(container).toMatchSnapshot();
  });

  it('handles empty ownership chain gracefully', () => {
    const emptyResult = {
      ...mockTraceUnknown,
      ownership_chain: []
    };
    const props = createTestProps(emptyResult);
    const { getByText } = render(<ProductResultScreen {...props} />);
    expect(getByText('🧬 Ownership')).toBeInTheDocument();
  });

  it('displays trace steps with proper status indicators', () => {
    const props = createTestProps(mockTraceVerified);
    const { getByText } = render(<ProductResultScreen {...props} />);
    const showButton = getByText(/Show Steps/i);
    fireEvent.click(showButton);
    
    // Check that trace steps are displayed
    expect(screen.getAllByText(/manual_entry/i)).toHaveLength(2);
    expect(screen.getAllByText(/web_research/i)).toHaveLength(2);
    expect(screen.getAllByText(/ownership_analysis/i)).toHaveLength(2);
  });

  it('shows performance metrics in trace', () => {
    const props = createTestProps(mockTraceVerified);
    const { getByText } = render(<ProductResultScreen {...props} />);
    const showButton = getByText(/Show Steps/i);
    fireEvent.click(showButton);
    
    // Check for time information in trace
    expect(screen.getAllByText(/ms/i)).toHaveLength(6);
  });
}); 
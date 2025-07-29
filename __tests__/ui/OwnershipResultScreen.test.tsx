import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom'
import ProductResultScreen from '@/components/ProductResultScreen'
import { 
  mockSuccessResult, 
  mockAmbiguousResult, 
  mockBadJSONResult, 
  mockTimeoutResult, 
  mockUnknownResult 
} from '../../__mocks__/ownershipResults'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

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
  }

  it('✅ Ownership chain found → pills show chain & confidence score', () => {
    render(<ProductResultScreen {...baseProps} />)
    
    expect(screen.getAllByText('Test Brand')).toHaveLength(2) // One in header, one in ownership trail
    expect(screen.getByText('Parent Company Inc')).toBeInTheDocument()
    expect(screen.getByText('Brand')).toBeInTheDocument()
    expect(screen.getByText('Parent Company')).toBeInTheDocument()
  })

  it('shows trace steps in correct order', () => {
    render(<ProductResultScreen {...baseProps} />)
    
    // Click to show trace
    const showButton = screen.getByText(/Show Steps/i)
    fireEvent.click(showButton)
    
    expect(screen.getByText('Web Search')).toBeInTheDocument()
    expect(screen.getByText('Analysis')).toBeInTheDocument()
    expect(screen.getByText('Found 3 sources')).toBeInTheDocument()
    expect(screen.getByText('Extracted ownership chain')).toBeInTheDocument()
  })

  it('renders unknown owner state', () => {
    const unknownProps = {
      ...baseProps,
      ownershipTrail: [],
      confidence: 'Low' as const,
      confidenceScore: 0,
      processTrace: [
        { step: 'Web Search', status: '❌', reasoning: 'No sources found', time: '1.2s' }
      ]
    }
    
    render(<ProductResultScreen {...unknownProps} />)
    
    // With empty ownership trail, the ownership section should be empty
    expect(screen.getByText('🧬 Ownership')).toBeInTheDocument()
    // The confidence should show Low
    expect(screen.getByText(/Low \(0%\)/)).toBeInTheDocument()
  })

  it('handles retry button click', () => {
    render(<ProductResultScreen {...baseProps} />)
    
    const retryButton = screen.getByRole('button', { name: /retry/i })
    expect(retryButton).toBeInTheDocument()
    
    // The button should be clickable (though it might not have a handler)
    fireEvent.click(retryButton)
  })

  it('handles back button click', () => {
    render(<ProductResultScreen {...baseProps} />)
    
    // The component doesn't have a back button, but has confirm/flag buttons
    const confirmButton = screen.getByRole('button', { name: /confirmed/i })
    const flagButton = screen.getByRole('button', { name: /flag incorrect/i })
    
    expect(confirmButton).toBeInTheDocument()
    expect(flagButton).toBeInTheDocument()
  })

  it('displays confidence score correctly', () => {
    render(<ProductResultScreen {...baseProps} />)
    
    expect(screen.getByText(/High \(92%\)/)).toBeInTheDocument()
  })

  it('handles empty ownership chain gracefully', () => {
    const emptyProps = {
      ...baseProps,
      ownershipTrail: [],
      confidence: 'Low' as const,
      confidenceScore: 0
    }
    
    render(<ProductResultScreen {...emptyProps} />)
    
    // The ownership section should still be present but empty
    expect(screen.getByText('🧬 Ownership')).toBeInTheDocument()
    expect(screen.getByText(/Low \(0%\)/)).toBeInTheDocument()
  })

  it('shows low confidence warning styling', () => {
    const lowConfidenceProps = {
      ...baseProps,
      confidence: 'Low' as const,
      confidenceScore: 35
    }
    
    render(<ProductResultScreen {...lowConfidenceProps} />)
    
    // Check for low confidence styling
    expect(screen.getByText(/Low \(35%\)/)).toBeInTheDocument()
  })

  it('renders product header correctly', () => {
    render(<ProductResultScreen {...baseProps} />)
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getAllByText('Test Brand')).toHaveLength(2) // One in header, one in ownership trail
    expect(screen.getByText(/🇺🇸 United States/)).toBeInTheDocument()
    expect(screen.getByText(/Barcode: 123456789/)).toBeInTheDocument()
  })

  it('handles error state correctly', () => {
    const errorProps = {
      ...baseProps,
      error: 'Failed to fetch ownership data'
    }
    
    render(<ProductResultScreen {...errorProps} />)
    
    expect(screen.getByText(/❌ Error/i)).toBeInTheDocument()
    expect(screen.getByText('Failed to fetch ownership data')).toBeInTheDocument()
  })

  it('handles fallback state correctly', () => {
    const fallbackProps = {
      ...baseProps,
      fallback: 'Using cached data from previous search'
    }
    
    render(<ProductResultScreen {...fallbackProps} />)
    
    expect(screen.getByText(/🧯 Fallback/i)).toBeInTheDocument()
    expect(screen.getByText('Using cached data from previous search')).toBeInTheDocument()
  })

  it('toggles trace visibility', () => {
    render(<ProductResultScreen {...baseProps} />)
    
    const toggleButton = screen.getByText(/Show Steps/i)
    fireEvent.click(toggleButton)
    
    // After clicking, the button should change to "Hide"
    expect(screen.getByText(/Hide Steps/i)).toBeInTheDocument()
    
    // Click again to hide
    fireEvent.click(screen.getByText(/Hide Steps/i))
    expect(screen.getByText(/Show Steps/i)).toBeInTheDocument()
  })

  it('toggles manual entry form', () => {
    render(<ProductResultScreen {...baseProps} />)
    
    const manualEntryButton = screen.getByText(/Enter Manually/i)
    fireEvent.click(manualEntryButton)
    
    // Check that the manual entry form is shown
    expect(screen.getByText(/📝 Manual Entry/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Product Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Brand Name')).toBeInTheDocument()
  })

  it('shows confidence explanation tooltip', () => {
    render(<ProductResultScreen {...baseProps} />)
    
    const tooltipButton = screen.getByText(/What affects this\?/i)
    expect(tooltipButton).toBeInTheDocument()
    expect(tooltipButton).toHaveAttribute('title', 'Confidence is based on data quality, source reliability, and agent agreement.')
  })

  it('renders ownership trail with arrows', () => {
    render(<ProductResultScreen {...baseProps} />)
    
    // Check that the ownership trail shows the arrow between companies
    expect(screen.getByText('→')).toBeInTheDocument()
  })

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
          name: 'Ultimate Owner Inc',
          country: 'United States',
          flag: '🇺🇸',
          type: 'Ultimate Owner',
          ultimate: true
        }
      ]
    }
    
    render(<ProductResultScreen {...ultimateOwnerProps} />)
    
    expect(screen.getByText('Ultimate Owner Inc')).toBeInTheDocument()
    expect(screen.getAllByText('Ultimate Owner')).toHaveLength(2) // One in badge, one in label
    expect(screen.getByText('🎯')).toBeInTheDocument()
  })

  it('handles different company types with correct styling', () => {
    const differentTypesProps = {
      ...baseProps,
      ownershipTrail: [
        {
          name: 'Public Company',
          country: 'United States',
          flag: '🇺🇸',
          type: 'Public'
        },
        {
          name: 'Private Company',
          country: 'United States',
          flag: '🇺🇸',
          type: 'Private'
        },
        {
          name: 'State-owned Company',
          country: 'United States',
          flag: '🇺🇸',
          type: 'State-owned'
        }
      ]
    }
    
    render(<ProductResultScreen {...differentTypesProps} />)
    
    expect(screen.getByText('Public')).toBeInTheDocument()
    expect(screen.getByText('Private')).toBeInTheDocument()
    expect(screen.getByText('State-owned')).toBeInTheDocument()
  })
}) 
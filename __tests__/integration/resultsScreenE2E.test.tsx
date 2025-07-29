import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ProductResultScreen from '@/components/ProductResultScreen/index'
import { 
  mockSuccessResult, 
  mockAmbiguousResult, 
  mockUnknownResult, 
  mockFollowUpContextResult 
} from '../../__mocks__/ownershipResults'
import { 
  mockTraceManualEntry, 
  mockTraceVerified, 
  mockTraceUnverified,
  mockTraceUnknown,
  mockTraceAmbiguous
} from '../../__mocks__/traceMocks'

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
    readText: vi.fn()
  }
})

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

// Mock fetch for manual entry form
global.fetch = vi.fn()

describe('ProductResultScreen E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Trace Visualization Accuracy', () => {
    it('renders correct trace stages for manual entry pipeline', async () => {
      render(<ProductResultScreen result={mockTraceManualEntry as any} />)
      
      await waitFor(() => {
        // Should show manual_entry stage
        expect(screen.getByText(/manual_entry/i)).toBeInTheDocument()
        // Should show web_research stage
        expect(screen.getByText(/web_research/i)).toBeInTheDocument()
        // Should show ownership_analysis stage
        expect(screen.getByText(/ownership_analysis/i)).toBeInTheDocument()
        // Should NOT show vision analysis if none was executed
        expect(screen.queryByText(/vision/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/image_analysis/i)).not.toBeInTheDocument()
      })
    })

    it('shows trace performance metrics correctly', async () => {
      render(<ProductResultScreen result={mockTraceManualEntry as any} />)
      
      await waitFor(() => {
        // Should show trace toggle button
        expect(screen.getByText(/Show/i)).toBeInTheDocument()
      })
    })

    it('toggles trace visibility correctly', async () => {
      render(<ProductResultScreen result={mockTraceManualEntry as any} />)
      
      // Initially trace should be hidden
      expect(screen.queryByText(/manual_entry/i)).not.toBeInTheDocument()
      
      // Click to show trace
      const showButton = screen.getByText(/Show Steps/i)
      fireEvent.click(showButton)
      
      await waitFor(() => {
        expect(screen.getByText(/manual_entry/i)).toBeInTheDocument()
        expect(screen.getByText(/Hide/i)).toBeInTheDocument()
      })
      
      // Click to hide trace
      const hideButton = screen.getByText(/Hide/i)
      fireEvent.click(hideButton)
      
      await waitFor(() => {
        expect(screen.queryByText(/manual_entry/i)).not.toBeInTheDocument()
      })
    })

    it('reflects actual pipeline execution in trace stages', async () => {
      render(<ProductResultScreen result={mockTraceManualEntry as any} />)
      
      const showButton = screen.getByText(/Show Steps/i)
      fireEvent.click(showButton)
      
      await waitFor(() => {
        // Check that stages match the actual execution trace
        expect(screen.getByText(/manual_entry/i)).toBeInTheDocument()
        expect(screen.getByText(/query_builder/i)).toBeInTheDocument()
        expect(screen.getByText(/web_research/i)).toBeInTheDocument()
        expect(screen.getByText(/ownership_analysis/i)).toBeInTheDocument()
        
        // Check that timing information is displayed
        expect(screen.getByText(/1500ms/i)).toBeInTheDocument()
        expect(screen.getByText(/2300ms/i)).toBeInTheDocument()
        expect(screen.getByText(/4500ms/i)).toBeInTheDocument()
        expect(screen.getByText(/3200ms/i)).toBeInTheDocument()
      })
    })
  })

  describe('Brand Logo & Metadata Display', () => {
    it('displays correct brand logo and metadata', async () => {
      render(<ProductResultScreen result={mockSuccessResult as any} />)
      
      await waitFor(() => {
        // Check that brand name is displayed
        expect(screen.getAllByText('OK Snacks A/S')).toHaveLength(2)
        // Check that product name is displayed
        expect(screen.getByText(/Pork Rinds/i)).toBeInTheDocument()
        // Check that country information is displayed
        expect(screen.getByText('Denmark')).toBeInTheDocument()
        // Check that company type is displayed
        expect(screen.getByText(/Brand/i)).toBeInTheDocument()
      })
    })

    it('displays ownership chain in correct order', async () => {
      render(<ProductResultScreen result={mockSuccessResult as any} />)
      
      await waitFor(() => {
        // Should show all companies in the ownership chain in order
        expect(screen.getAllByText('OK Snacks A/S')).toHaveLength(2)
        expect(screen.getByText('Kims A/S')).toBeInTheDocument()
        expect(screen.getByText('Orkla ASA')).toBeInTheDocument()
        
        // Check that roles are displayed correctly
        expect(screen.getByText(/Brand/i)).toBeInTheDocument()
        expect(screen.getByText(/Parent/i)).toBeInTheDocument()
        expect(screen.getByText(/Ultimate Owner/i)).toBeInTheDocument()
      })
    })
  })

  describe('Verification Pill Logic', () => {
    it('shows Verified pill only when verification_status is verified', async () => {
      // Test with verified result
      const { rerender } = render(<ProductResultScreen result={mockTraceVerified as any} />)
      
      await waitFor(() => {
        expect(screen.getByText(/Verified/i)).toBeInTheDocument()
        expect(screen.getByText(/0\.92%/)).toBeInTheDocument()
      })

      // Test with unverified result
      rerender(<ProductResultScreen result={mockTraceUnverified as any} />)
      
      await waitFor(() => {
        expect(screen.queryByText(/Verified/i)).not.toBeInTheDocument()
        expect(screen.getByText(/0\.92%/)).toBeInTheDocument()
      })
    })

    it('shows warning pill for unverified results', async () => {
      render(<ProductResultScreen result={mockTraceUnverified as any} />)
      
      await waitFor(() => {
        expect(screen.getByText(/Very Low/i)).toBeInTheDocument()
      })
    })
  })

  describe('Sources Display', () => {
    it('displays sources for each ownership chain entity', async () => {
      render(<ProductResultScreen result={mockSuccessResult as any} />)
      
      await waitFor(() => {
        // Should show sources section
        expect(screen.getByText(/Sources/i)).toBeInTheDocument()
        // Should show source URLs
        expect(screen.getByText(/ok-snacks.com/i)).toBeInTheDocument()
        expect(screen.getByText(/kims.com/i)).toBeInTheDocument()
        expect(screen.getByText(/orkla.com/i)).toBeInTheDocument()
      })
    })

    it('shows verified sources in correct entity cards', async () => {
      render(<ProductResultScreen result={mockTraceVerified as any} />)
      
      await waitFor(() => {
        // Check that verified sources are displayed
        expect(screen.getByText(/Official Registry/i)).toBeInTheDocument()
        expect(screen.getByText(/Company Website/i)).toBeInTheDocument()
        expect(screen.getByText(/Corporate Database/i)).toBeInTheDocument()
      })
    })
  })

  describe('Confidence Display', () => {
    it('shows correct confidence score and level', async () => {
      render(<ProductResultScreen result={mockTraceVerified as any} />)
      
      await waitFor(() => {
        // Should show confidence score
        expect(screen.getByText(/88%/)).toBeInTheDocument()
        // Should show confidence level
        expect(screen.getByText(/High/i)).toBeInTheDocument()
      })
    })

    it('applies correct styling for different confidence levels', async () => {
      // Test high confidence
      const { rerender } = render(<ProductResultScreen result={mockTraceVerified as any} />)
      
      await waitFor(() => {
        expect(screen.getByText(/High/i)).toBeInTheDocument()
      })

      // Test low confidence
      rerender(<ProductResultScreen result={mockTraceUnverified as any} />)
      
      await waitFor(() => {
        expect(screen.getByText(/Low/i)).toBeInTheDocument()
      })
    })
  })

  describe('Deep Link Behavior', () => {
    it('copy link generates a valid deep link', async () => {
      const mockWriteText = vi.fn()
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
          readText: vi.fn()
        }
      })

      render(<ProductResultScreen result={mockSuccessResult as any} />)
      
      // Find and click the share button
      const shareButton = screen.getByRole('button', { name: /share/i })
      fireEvent.click(shareButton)

      // Find and click the copy link button
      const copyLinkButton = screen.getByRole('button', { name: /copy link/i })
      fireEvent.click(copyLinkButton)

      // Verify clipboard was called with a link containing the result ID
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining(window.location.origin)
      )
    })

    it('generates deep link with correct result parameters', async () => {
      const mockWriteText = vi.fn()
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
          readText: vi.fn()
        }
      })

      render(<ProductResultScreen result={mockSuccessResult as any} />)
      
      const shareButton = screen.getByRole('button', { name: /share/i })
      fireEvent.click(shareButton)

      const copyLinkButton = screen.getByRole('button', { name: /copy link/i })
      fireEvent.click(copyLinkButton)

      // Verify the URL contains the expected parameters
      const capturedUrl = mockWriteText.mock.calls[0][0]
      expect(capturedUrl).toContain('/result/')
      expect(capturedUrl).toContain('OK Snacks')
    })
  })

  describe('Alternatives Display', () => {
    it('renders alternatives when present', async () => {
      render(<ProductResultScreen result={mockAmbiguousResult as any} />)
      
      await waitFor(() => {
        // Should show alternatives section
        expect(screen.getByText(/Alternatives/i)).toBeInTheDocument()
        // Should show alternative companies
        expect(screen.getByText('OK Benzin A/S')).toBeInTheDocument()
        expect(screen.getByText('OK Foods')).toBeInTheDocument()
        
        // Should show confidence scores for alternatives
        expect(screen.getByText(/60%/)).toBeInTheDocument()
        expect(screen.getByText(/40%/)).toBeInTheDocument()
      })
    })

    it('shows alternative reasoning', async () => {
      render(<ProductResultScreen result={mockAmbiguousResult as any} />)
      
      await waitFor(() => {
        expect(screen.getByText(/Same country, different industry/i)).toBeInTheDocument()
        expect(screen.getByText(/Different country and industry/i)).toBeInTheDocument()
      })
    })
  })

  describe('LLM Copy Timing', () => {
    it('does not show storytelling copy until results are ready', async () => {
      // Test loading state
      const { rerender } = render(<ProductResultScreen result={null} />)
      
      // Should not show any result content when loading
      expect(screen.queryByText(/OK Snacks/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Pork Rinds/i)).not.toBeInTheDocument()

      // Test with actual result
      rerender(<ProductResultScreen result={mockSuccessResult as any} />)
      
      await waitFor(() => {
        // Should show result content when ready
        expect(screen.getAllByText('OK Snacks A/S')).toHaveLength(2)
        expect(screen.getAllByText(/Pork Rinds/i)).toHaveLength(1)
      })
    })

    it('renders LLM copy only once after results are finalized', async () => {
      const { container } = render(<ProductResultScreen result={mockSuccessResult as any} />)
      
      await waitFor(() => {
        // Should show final result content
        expect(screen.getAllByText('OK Snacks A/S')).toHaveLength(2)
      })

      // Take snapshot to ensure consistent rendering
      expect(container).toMatchSnapshot()
    })
  })

  describe('Manual Entry vs Vision Pipeline', () => {
    it('does not show Vision stages for manual entry traces', async () => {
      render(<ProductResultScreen result={mockTraceManualEntry as any} />)
      
      const showButton = screen.getByText(/Show Steps/i)
      fireEvent.click(showButton)
      
      await waitFor(() => {
        // Should NOT show any vision-related stages
        expect(screen.queryByText(/vision/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/image_analysis/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/image_recognition/i)).not.toBeInTheDocument()
        
        // Should show manual entry stages
        expect(screen.getByText(/manual_entry/i)).toBeInTheDocument()
        expect(screen.getByText(/web_research/i)).toBeInTheDocument()
      })
    })

    it('shows correct stages for manual entry pipeline', async () => {
      render(<ProductResultScreen result={mockTraceManualEntry as any} />)
      
      const showButton = screen.getByText(/Show Steps/i)
      fireEvent.click(showButton)
      
      await waitFor(() => {
        // Should show the correct sequence for manual entry
        expect(screen.getByText(/manual_entry/i)).toBeInTheDocument()
        expect(screen.getByText(/query_builder/i)).toBeInTheDocument()
        expect(screen.getByText(/web_research/i)).toBeInTheDocument()
        expect(screen.getByText(/ownership_analysis/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles unknown results gracefully', async () => {
      render(<ProductResultScreen result={mockUnknownResult as any} />)
      
      await waitFor(() => {
        // Should show unknown state
        expect(screen.getAllByText(/Unknown/i)).toHaveLength(5)
        // Should show low confidence
        expect(screen.getByText(/0%/)).toBeInTheDocument()
      })
    })

    it('handles manual entry form submission', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: mockSuccessResult })
      })
      global.fetch = mockFetch

      render(<ProductResultScreen result={mockSuccessResult as any} />)
      
      // Find and click manual entry button
      const manualEntryButton = screen.getByText(/Manual Entry/i)
      fireEvent.click(manualEntryButton)

      // Fill out the form - the inputs are disabled, so we need to find the company name input
      const companyInput = screen.getByPlaceholderText(/Enter company name/i)
      const countryInput = screen.getByPlaceholderText(/Enter country/i)
      
      fireEvent.change(companyInput, { target: { value: 'Test Company' } })
      fireEvent.change(countryInput, { target: { value: 'Test Country' } })

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /Re-run Search/i })
      fireEvent.click(submitButton)

      // Verify fetch was called
      expect(mockFetch).toHaveBeenCalledWith('/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: 'OK Snacks A/S',
          product_name: 'Pork Rinds',
          manual: true,
        }),
      })
    })

    it('shows error state when API call fails', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
      global.fetch = mockFetch

      render(<ProductResultScreen result={mockSuccessResult as any} />)
      
      // Find and click manual entry button
      const manualEntryButton = screen.getByText(/Manual Entry/i)
      fireEvent.click(manualEntryButton)

      // Fill out and submit form
      const companyInput = screen.getByPlaceholderText(/Enter company name/i)
      const countryInput = screen.getByPlaceholderText(/Enter country/i)
      
      fireEvent.change(companyInput, { target: { value: 'Test Company' } })
      fireEvent.change(countryInput, { target: { value: 'Test Country' } })

      const submitButton = screen.getByRole('button', { name: /Re-run Search/i })
      fireEvent.click(submitButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Error: Network error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Contextual Clues Display', () => {
    it('displays contextual clues when available', async () => {
      const resultWithClues = {
        ...mockSuccessResult,
        contextual_clues: {
          step: 'image_analysis',
          step_name: 'Image Analysis',
          extracted_data: {
            brand_name: 'OK Snacks',
            product_name: 'Pork Rinds',
            product_type: 'Snack Food',
            confidence: 0.95,
            reasoning: 'Clear brand name visible on packaging',
            language_indicators: ['English'],
            country_indicators: ['Denmark'],
            product_style: 'Traditional',
            packaging_characteristics: ['Plastic bag', 'Resealable'],
            regional_clues: ['European'],
            certification_marks: [],
            store_brand_indicators: false,
            premium_indicators: false,
            dietary_indicators: [],
            size_format: 'Standard'
          },
          raw_extraction: 'Brand: OK Snacks, Product: Pork Rinds',
          extraction_timestamp: '2025-01-28T12:00:00Z'
        }
      }

      render(<ProductResultScreen result={resultWithClues as any} />)
      
      await waitFor(() => {
        expect(screen.getAllByText(/Image Analysis/i)).toHaveLength(2) // Multiple elements expected
        expect(screen.getAllByText(/OK Snacks/i)).toHaveLength(3)
        expect(screen.getAllByText(/Pork Rinds/i)).toHaveLength(2)
        expect(screen.getByText(/Snack Food/i)).toBeInTheDocument()
      })
    })
  })

  describe('Snapshot Tests', () => {
    it('matches snapshot for verified result', () => {
      const { container } = render(<ProductResultScreen result={mockTraceVerified as any} />)
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for ambiguous result', () => {
      const { container } = render(<ProductResultScreen result={mockAmbiguousResult as any} />)
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for unknown result', () => {
      const { container } = render(<ProductResultScreen result={mockUnknownResult as any} />)
      expect(container).toMatchSnapshot()
    })
  })
}) 
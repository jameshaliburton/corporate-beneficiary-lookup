import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import OwnershipTrail, { OwnershipStep } from '@/components/ProductResultScreen/OwnershipTrail';

// Mock the logo finder service
vi.mock('@/lib/services/logo-finder', () => ({
  findCompanyLogoWithTimeout: vi.fn().mockResolvedValue(null),
}));

describe('OwnershipTrail', () => {
  const mockSteps: OwnershipStep[] = [
    {
      name: 'Test Brand',
      country: 'United States',
      flag: '🇺🇸',
      type: 'Brand',
      ultimate: false,
      relationship_type: 'brand',
      raw_relationship_type: 'brand',
      is_verified: true,
    },
    {
      name: 'Test Company',
      country: 'Switzerland',
      flag: '🇨🇭',
      type: 'Ultimate Owner',
      ultimate: true,
      relationship_type: 'ultimate_owner',
      raw_relationship_type: 'ultimate_owner',
      is_verified: true,
    },
  ];

  const mockStepsWithUnverified: OwnershipStep[] = [
    {
      name: 'Test Brand',
      country: 'United States',
      flag: '🇺🇸',
      type: 'Brand',
      ultimate: false,
      relationship_type: 'other',
      raw_relationship_type: 'international_ultimate_owner',
      is_verified: false,
    },
    {
      name: 'Test Company',
      country: 'Switzerland',
      flag: '🇨🇭',
      type: 'Ultimate Owner',
      ultimate: true,
      relationship_type: 'other',
      raw_relationship_type: 'licensed_owner',
      is_verified: false,
    },
  ];

  it('renders ownership trail with verified relationship types', async () => {
    render(<OwnershipTrail steps={mockSteps} />);
    
    expect(screen.getByText('Test Brand')).toBeInTheDocument();
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('brand')).toBeInTheDocument();
    expect(screen.getByText('ultimate_owner')).toBeInTheDocument();
  });

  it('renders ownership trail with unverified relationship types and shows indicators', async () => {
    render(<OwnershipTrail steps={mockStepsWithUnverified} />);
    
    expect(screen.getByText('Test Brand')).toBeInTheDocument();
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    
    // Should show multiple "other" elements
    const otherElements = screen.getAllByText('other');
    expect(otherElements).toHaveLength(2);
    
    // Should show help icons for unverified types
    const helpIcons = screen.getAllByRole('img', { hidden: true });
    expect(helpIcons.length).toBeGreaterThan(0);
  });

  it('displays relationship_type when available, falls back to type', async () => {
    const stepsWithFallback: OwnershipStep[] = [
      {
        name: 'Test Brand',
        country: 'United States',
        flag: '🇺🇸',
        type: 'Brand',
        ultimate: false,
        // No relationship_type, should fall back to type
      },
    ];

    render(<OwnershipTrail steps={stepsWithFallback} />);
    expect(screen.getByText('Brand')).toBeInTheDocument();
  });

  it('handles missing relationship type fields gracefully', async () => {
    const stepsWithMissingFields: OwnershipStep[] = [
      {
        name: 'Test Brand',
        country: 'United States',
        flag: '🇺🇸',
        type: 'Brand',
        ultimate: false,
        relationship_type: undefined,
        raw_relationship_type: undefined,
        is_verified: undefined,
      },
    ];

    render(<OwnershipTrail steps={stepsWithMissingFields} />);
    expect(screen.getByText('Brand')).toBeInTheDocument();
  });

  it('shows ultimate owner indicator correctly', async () => {
    render(<OwnershipTrail steps={mockSteps} />);
    expect(screen.getByText('🎯 Ultimate Owner')).toBeInTheDocument();
  });

  it('displays country flags correctly', async () => {
    render(<OwnershipTrail steps={mockSteps} />);
    
    // Wait for logo loading to complete and flags to show
    await waitFor(() => {
      expect(screen.getByText('🇺🇸')).toBeInTheDocument();
      expect(screen.getByText('🇨🇭')).toBeInTheDocument();
    });
  });
}); 
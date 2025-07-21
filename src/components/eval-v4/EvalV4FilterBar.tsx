'use client'
// @ts-nocheck

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MagnifyingGlassIcon, FunnelIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'

interface FilterState {
  searchTerm: string
  sourceType: 'all' | 'live' | 'eval' | 'retry'
  confidenceRange: [number, number]
}

interface EvalV4FilterBarProps {
  filters: FilterState
  onFiltersChange: (filters: Partial<FilterState>) => void
}

export default function EvalV4FilterBar({ filters, onFiltersChange }: EvalV4FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const sourceTypeOptions = [
    { value: 'all', label: 'All Sources', count: 0 },
    { value: 'live', label: 'Live Scans', count: 0 },
    { value: 'eval', label: 'Evaluation', count: 0 },
    { value: 'retry', label: 'Retry', count: 0 }
  ]

  return (
    <div className="bg-white rounded-lg border p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2"
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4" />
          <span>{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search brands, products, owners..."
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <FunnelIcon className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      {/* Source Type Filter */}
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-sm font-medium text-gray-700">Source:</span>
        {sourceTypeOptions.map((option) => (
          <Button
            key={option.value}
            variant={filters.sourceType === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFiltersChange({ sourceType: option.value as any })}
            className="flex items-center space-x-1"
          >
            <span>{option.label}</span>
            {option.count > 0 && (
              <Badge variant="secondary" className="ml-1">
                {option.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t pt-4 space-y-4">
          {/* Confidence Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confidence Range: {filters.confidenceRange[0]}% - {filters.confidenceRange[1]}%
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="text-xs text-gray-500">Min</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.confidenceRange[0]}
                  onChange={(e) => onFiltersChange({
                    confidenceRange: [parseInt(e.target.value) || 0, filters.confidenceRange[1]]
                  })}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500">Max</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.confidenceRange[1]}
                  onChange={(e) => onFiltersChange({
                    confidenceRange: [filters.confidenceRange[0], parseInt(e.target.value) || 100]
                  })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Quick Confidence Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Presets:</label>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFiltersChange({ confidenceRange: [80, 100] })}
              >
                High (80-100%)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFiltersChange({ confidenceRange: [60, 79] })}
              >
                Medium (60-79%)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFiltersChange({ confidenceRange: [0, 59] })}
              >
                Low (0-59%)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
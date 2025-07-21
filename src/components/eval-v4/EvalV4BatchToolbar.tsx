'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  PlayIcon, 
  FlagIcon, 
  DocumentArrowDownIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

interface EvalV4BatchToolbarProps {
  selectedCount: number
  onRerunAll: () => void
  onFlagAll: () => void
  onExport: (format: 'json' | 'csv') => void
  onClearSelection: () => void
  isProcessing?: boolean
}

export default function EvalV4BatchToolbar({
  selectedCount,
  onRerunAll,
  onFlagAll,
  onExport,
  onClearSelection,
  isProcessing = false
}: EvalV4BatchToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <CheckIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {selectedCount} result{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {selectedCount}
            </Badge>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRerunAll}
            disabled={isProcessing}
            className="flex items-center space-x-1"
          >
            <PlayIcon className="h-4 w-4" />
            <span>Rerun All</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onFlagAll}
            disabled={isProcessing}
            className="flex items-center space-x-1"
          >
            <FlagIcon className="h-4 w-4" />
            <span>Flag All</span>
          </Button>

          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport('json')}
              disabled={isProcessing}
              className="flex items-center space-x-1"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              <span>JSON</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport('csv')}
              disabled={isProcessing}
              className="flex items-center space-x-1"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              <span>CSV</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-4 w-4" />
            <span>Clear</span>
          </Button>
        </div>
      </div>

      {isProcessing && (
        <div className="mt-3 flex items-center space-x-2 text-sm text-blue-700">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Processing batch actions...</span>
        </div>
      )}
    </div>
  )
} 
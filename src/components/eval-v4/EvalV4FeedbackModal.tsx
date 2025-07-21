'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { XMarkIcon, FlagIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ScanResult {
  id: string
  brand: string
  product: string
  owner: string
  confidence: number
  source: 'live' | 'eval' | 'retry'
  flagged: boolean
  evalSheetEntry: boolean
  trace: any[]
  timestamp: string
}

interface EvalV4FeedbackModalProps {
  result: ScanResult
  onClose: () => void
}

export default function EvalV4FeedbackModal({ result, onClose }: EvalV4FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<'issue' | 'suggestion' | 'correction'>('issue')
  const [feedbackText, setFeedbackText] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [email, setEmail] = useState('')

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800'
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const handleSubmit = () => {
    // In a real implementation, this would submit to the backend
    console.log('Submitting feedback:', {
      resultId: result.id,
      feedbackType,
      feedbackText,
      priority,
      email
    })
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <FlagIcon className="h-5 w-5 text-red-500" />
              <span>Submit Feedback</span>
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Result Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Result Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-gray-500">Brand</label>
                <p className="font-semibold">{result.brand}</p>
              </div>
              <div>
                <label className="text-gray-500">Product</label>
                <p className="font-semibold">{result.product}</p>
              </div>
              <div>
                <label className="text-gray-500">Owner</label>
                <p className="font-semibold">{result.owner}</p>
              </div>
              <div>
                <label className="text-gray-500">Confidence</label>
                <Badge className={getConfidenceColor(result.confidence)}>
                  {result.confidence}%
                </Badge>
              </div>
            </div>
          </div>

          {/* Feedback Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback Type
            </label>
            <div className="flex space-x-2">
              <Button
                variant={feedbackType === 'issue' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedbackType('issue')}
                className="flex items-center space-x-1"
              >
                <ExclamationTriangleIcon className="h-4 w-4" />
                <span>Issue</span>
              </Button>
              <Button
                variant={feedbackType === 'suggestion' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedbackType('suggestion')}
              >
                Suggestion
              </Button>
              <Button
                variant={feedbackType === 'correction' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedbackType('correction')}
              >
                Correction
              </Button>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="flex space-x-2">
              <Button
                variant={priority === 'low' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPriority('low')}
              >
                Low
              </Button>
              <Button
                variant={priority === 'medium' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPriority('medium')}
              >
                Medium
              </Button>
              <Button
                variant={priority === 'high' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPriority('high')}
              >
                High
              </Button>
            </div>
          </div>

          {/* Feedback Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback Details
            </label>
            <Textarea
              placeholder="Please describe the issue, suggestion, or correction..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email (Optional)
            </label>
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!feedbackText.trim()}>
              Submit Feedback
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
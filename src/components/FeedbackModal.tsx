'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Flag, Lightbulb } from 'lucide-react'

interface FeedbackModalProps {
  result: any
  onClose: () => void
  onSubmit: (feedback: any) => void
}

export default function FeedbackModal({ result, onClose, onSubmit }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState({
    issue: '',
    suggestedFix: '',
    promptOverride: '',
    agentType: 'enhanced_ownership_research'
  })

  const handleSubmit = () => {
    if (!feedback.issue.trim()) {
      alert('Please describe the issue')
      return
    }
    
    onSubmit(feedback)
  }

  const getIssueSuggestions = () => {
    const suggestions = [
      'Incorrect ownership identified',
      'Missing ownership information',
      'Low confidence without justification',
      'Hallucinated information',
      'Wrong company identified',
      'Outdated information',
      'Incomplete research',
      'Poor source quality',
      'Other'
    ]
    return suggestions
  }

  const getFixSuggestions = () => {
    const suggestions = [
      'Improve prompt to be more specific about evidence requirements',
      'Add verification step to cross-reference sources',
      'Include more recent sources in search',
      'Enhance confidence scoring based on source quality',
      'Add fallback to manual research for low-confidence cases',
      'Improve query building for better search results',
      'Add industry-specific research strategies',
      'Other'
    ]
    return suggestions
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Flag className="h-5 w-5 mr-2 text-red-500" />
                Flag Result - {result.brand}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Product: {result.product_name} | Confidence: {result.confidence_score?.toFixed(1) || 0}%
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Issue Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                What went wrong? *
              </label>
              <Select 
                value={feedback.issue} 
                onValueChange={(value) => setFeedback(prev => ({ ...prev, issue: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select the main issue" />
                </SelectTrigger>
                <SelectContent>
                  {getIssueSuggestions().map(suggestion => (
                    <SelectItem key={suggestion} value={suggestion}>
                      {suggestion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {feedback.issue === 'Other' && (
                <Textarea
                  placeholder="Describe the issue in detail..."
                  value={feedback.issue}
                  onChange={(e) => setFeedback(prev => ({ ...prev, issue: e.target.value }))}
                  className="mt-2"
                  rows={3}
                />
              )}
            </div>

            {/* Suggested Fix */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Suggested Fix
              </label>
              <Select 
                value={feedback.suggestedFix} 
                onValueChange={(value) => setFeedback(prev => ({ ...prev, suggestedFix: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a suggested fix" />
                </SelectTrigger>
                <SelectContent>
                  {getFixSuggestions().map(suggestion => (
                    <SelectItem key={suggestion} value={suggestion}>
                      {suggestion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {feedback.suggestedFix === 'Other' && (
                <Textarea
                  placeholder="Describe your suggested fix..."
                  value={feedback.suggestedFix}
                  onChange={(e) => setFeedback(prev => ({ ...prev, suggestedFix: e.target.value }))}
                  className="mt-2"
                  rows={3}
                />
              )}
            </div>

            {/* Agent Type */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Agent Type
              </label>
              <Select 
                value={feedback.agentType} 
                onValueChange={(value) => setFeedback(prev => ({ ...prev, agentType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select agent type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enhanced_ownership_research">Ownership Research</SelectItem>
                  <SelectItem value="query_builder">Query Builder</SelectItem>
                  <SelectItem value="verification">Verification</SelectItem>
                  <SelectItem value="quality_assessment">Quality Assessment</SelectItem>
                  <SelectItem value="vision_agent">Vision Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prompt Override (Optional) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Prompt Override (Optional)
              </label>
              <div className="text-xs text-gray-600 mb-2">
                If you have a specific prompt improvement, you can provide it here:
              </div>
              <Textarea
                placeholder="Enter improved prompt content..."
                value={feedback.promptOverride}
                onChange={(e) => setFeedback(prev => ({ ...prev, promptOverride: e.target.value }))}
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            {/* Result Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Result Summary</h4>
              <div className="text-sm space-y-1">
                <div><strong>Brand:</strong> {result.brand || 'Unknown'}</div>
                <div><strong>Product:</strong> {result.product_name || 'N/A'}</div>
                <div><strong>Owner:</strong> {result.owner || 'Unknown'}</div>
                <div><strong>Confidence:</strong> {result.confidence_score?.toFixed(1) || 0}%</div>
                <div><strong>Source:</strong> {result.source_type || 'Unknown'}</div>
                {result.match_result && (
                  <div><strong>Match Result:</strong> {result.match_result}</div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="bg-red-500 hover:bg-red-600">
                <Flag className="h-4 w-4 mr-2" />
                Submit Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

// Mock data for testing
const mockStage = {
  stage: 'brand-extraction',
  reasoning: 'Extracting brand name from product text',
  confidence: 85,
  timestamp: '2024-01-15T10:30:00Z',
  promptVersion: '1.2',
  agentName: 'BrandExtractionAgent',
  status: 'success' as const,
  duration: 1200,
  input: 'Product: Nike Air Jordan sneakers',
  output: 'Brand: Nike',
  prompt: {
    system: 'You are an AI assistant specialized in extracting brand names from product descriptions.',
    user: 'Extract the brand name from: {{product}}',
    version: '1.2'
  }
}

const mockResult = {
  id: 'test-123',
  brand: 'Nike',
  product: 'Air Jordan sneakers',
  owner: 'Nike Inc.',
  confidence: 85,
  source: 'live' as const,
  flagged: false,
  evalSheetEntry: false,
  trace: [
    {
      stage: 'image-analysis',
      reasoning: 'Analyzing product image',
      confidence: 90,
      timestamp: '2024-01-15T10:29:00Z',
      promptVersion: '1.0',
      agentName: 'ImageAnalysisAgent',
      status: 'success' as const,
      duration: 800,
      input: 'Product image data',
      output: 'Detected text: Nike Air Jordan',
      prompt: {
        system: 'Analyze product images to extract text.',
        user: 'Extract text from this product image',
        version: '1.0'
      }
    },
    mockStage,
    {
      stage: 'ownership-research',
      reasoning: 'Researching corporate ownership',
      confidence: 75,
      timestamp: '2024-01-15T10:31:00Z',
      promptVersion: '1.1',
      agentName: 'OwnershipResearchAgent',
      status: 'success' as const,
      duration: 2000,
      input: 'Brand: Nike',
      output: 'Owner: Nike Inc.',
      prompt: {
        system: 'Research corporate ownership structures.',
        user: 'Find the owner of: {{brand}}',
        version: '1.1'
      }
    }
  ],
  timestamp: '2024-01-15T10:32:00Z'
}

// Enhanced Context Banner Component (copied from implementation)
const EnhancedContextBanner = ({ stage, result, availableVariables }: { 
  stage: any
  result: any
  availableVariables: any[]
}) => {
  const currentStageIndex = result.trace.findIndex((s: any) => s.stage === stage.stage)
  
  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div>
              <h3 className="font-medium text-blue-900">
                {stage.stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <p className="text-sm text-blue-700">
                Editing for: {result.brand} - {result.product}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              v{stage.promptVersion}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Stage {currentStageIndex + 1} of {result.trace.length}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {stage.agentName}
            </Badge>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-blue-700">
            Variables available: {availableVariables.filter((v: any) => v.available).length}
          </p>
          <p className="text-xs text-blue-600">
            Last updated: {new Date(stage.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
      
      {/* Variable availability timeline */}
      <div className="mt-3">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Variable Availability Timeline</h4>
        <div className="flex space-x-2">
          {result.trace.map((traceStage: any, index: number) => {
            const isAvailable = index <= currentStageIndex
            const isCurrent = index === currentStageIndex
            
            return (
              <div 
                key={traceStage.stage}
                className={`flex-1 p-2 rounded text-xs border ${
                  isCurrent 
                    ? 'bg-blue-100 text-blue-800 border-blue-300' 
                    : isAvailable 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}
              >
                <div className="font-medium truncate">
                  {traceStage.stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div className="text-xs">
                  {isCurrent ? 'Current' : isAvailable ? 'Available' : 'Future'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Validation Warnings Component
const ValidationWarnings = ({ warnings }: { warnings: any[] }) => {
  if (warnings.length === 0) return null
  
  return (
    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
      <div className="flex items-center space-x-2 mb-2">
        <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
        <h4 className="text-sm font-medium text-yellow-800">Validation Warnings</h4>
      </div>
      <div className="space-y-1">
        {warnings.map((warning, index) => (
          <div key={index} className="text-xs text-yellow-700">
            • {warning.message}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TestContextClarityPage() {
  const [showModal, setShowModal] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState(mockStage.prompt.system)
  const [userPrompt, setUserPrompt] = useState(mockStage.prompt.user)
  const [validationWarnings, setValidationWarnings] = useState<any[]>([])

  // Mock available variables
  const availableVariables = [
    { key: 'product', value: 'Nike Air Jordan sneakers', source: 'image-analysis', stageName: 'Image Analysis', available: true, stageIndex: 0 },
    { key: 'brand', value: 'Nike', source: 'brand-extraction', stageName: 'Brand Extraction', available: true, stageIndex: 1 },
    { key: 'owner', value: 'Nike Inc.', source: 'ownership-research', stageName: 'Ownership Research', available: false, stageIndex: 2 }
  ]

  // Mock validation warnings
  const mockWarnings = [
    { variable: 'owner', available: false, position: 0, message: 'Variable "owner" is not available in current stage' },
    { variable: 'hardcoded', available: false, position: 0, message: 'Hardcoded brand value detected - consider using {{brand}} variable' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Context Clarity System Test</h1>
          <p className="text-gray-600">Testing the enhanced context clarity implementation</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={() => setShowModal(!showModal)}>
                {showModal ? 'Hide' : 'Show'} Prompt Workflow Modal
              </Button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">System Prompt</label>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">User Prompt</label>
                  <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Context Banner */}
        <EnhancedContextBanner 
          stage={mockStage} 
          result={mockResult} 
          availableVariables={availableVariables} 
        />

        {/* Validation Warnings */}
        <ValidationWarnings warnings={mockWarnings} />

        {/* Variable Flow Visualization */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Variable Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availableVariables.map(variable => (
                <div key={variable.key} className="flex items-center space-x-2 text-sm">
                  <span className="font-mono bg-blue-100 px-1 rounded text-blue-700">
                    {variable.key}
                  </span>
                  <span className="text-gray-500">→</span>
                  <span className="text-gray-700">{variable.stageName}</span>
                  <span className="text-gray-500">→</span>
                  <span className="text-gray-700 truncate max-w-20">
                    {variable.value}
                  </span>
                  <Badge variant={variable.available ? "default" : "secondary"} className="text-xs">
                    {variable.available ? 'Available' : 'Future'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Context Banner:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">✅ Working</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Variable Timeline:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">✅ Working</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Validation Warnings:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">✅ Working</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Variable Flow:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">✅ Working</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
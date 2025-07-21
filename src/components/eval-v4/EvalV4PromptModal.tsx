'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { XMarkIcon, PlayIcon, DocumentIcon, CheckIcon, ClockIcon, DocumentTextIcon, EyeIcon } from '@heroicons/react/24/outline'

interface TraceStage {
  stage: string
  reasoning: string
  confidence: number
  timestamp: string
  promptVersion?: string
  agentName?: string
  status: 'success' | 'error' | 'pending'
  duration?: number
  input?: string
  output?: string
  prompt?: {
    system: string
    user: string
    version: string
  }
}

interface EvalV4PromptModalProps {
  stage: TraceStage
  onClose: () => void
}

export default function EvalV4PromptModal({ stage, onClose }: EvalV4PromptModalProps) {
  const [activeTab, setActiveTab] = useState('edit')
  const [systemPrompt, setSystemPrompt] = useState(stage.prompt?.system || '')
  const [userPrompt, setUserPrompt] = useState(stage.prompt?.user || '')
  const [testInput, setTestInput] = useState(stage.input || '')
  const [testOutput, setTestOutput] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [deploymentTarget, setDeploymentTarget] = useState<'staging' | 'production' | 'draft'>('draft')

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800'
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const handleTestPrompt = async () => {
    setIsTesting(true)
    // Simulate API call
    setTimeout(() => {
      setTestOutput(`Test output for ${stage.stage} with confidence: ${Math.floor(Math.random() * 40) + 60}%`)
      setIsTesting(false)
    }, 2000)
  }

  const handleDeploy = async () => {
    console.log('Deploying to:', deploymentTarget, {
      systemPrompt,
      userPrompt,
      stage: stage.stage
    })
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Prompt Editor: {stage.stage}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stage Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Stage</label>
                <p className="text-sm font-semibold">{stage.stage}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Confidence</label>
                <Badge className={getConfidenceColor(stage.confidence)}>
                  {stage.confidence}%
                </Badge>
              </div>
              {stage.promptVersion && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Version</label>
                  <p className="text-sm font-semibold">v{stage.promptVersion}</p>
                </div>
              )}
              {stage.agentName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Agent</label>
                  <p className="text-sm font-semibold">{stage.agentName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="edit">Edit Prompt</TabsTrigger>
              <TabsTrigger value="test">Test Prompt</TabsTrigger>
              <TabsTrigger value="deploy">Deploy</TabsTrigger>
            </TabsList>

            {/* Edit Tab */}
            <TabsContent value="edit" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Prompt
                  </label>
                  <Textarea
                    placeholder="Enter system prompt..."
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[120px] font-mono text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Prompt
                  </label>
                  <Textarea
                    placeholder="Enter user prompt..."
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    className="min-h-[120px] font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={() => setActiveTab('test')}>
                    <PlayIcon className="h-4 w-4 mr-1" />
                    Test Prompt
                  </Button>
                  <Button variant="outline">
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    Save Draft
                  </Button>
                </div>
                <Button onClick={() => setActiveTab('deploy')}>
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Deploy Changes
                </Button>
              </div>
            </TabsContent>

            {/* Test Tab */}
            <TabsContent value="test" className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Input
                  </label>
                  <Textarea
                    placeholder="Enter test input..."
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    className="min-h-[200px]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Output
                  </label>
                  <div className="min-h-[200px] bg-gray-50 p-3 rounded border">
                    {isTesting ? (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Testing prompt...</span>
                      </div>
                    ) : testOutput ? (
                      <p className="text-sm text-gray-700">{testOutput}</p>
                    ) : (
                      <p className="text-sm text-gray-500">Output will appear here after testing</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Button 
                  onClick={handleTestPrompt} 
                  disabled={isTesting || !testInput.trim()}
                  className="flex items-center space-x-2"
                >
                  <PlayIcon className="h-4 w-4" />
                  {isTesting ? 'Testing...' : 'Test Prompt'}
                </Button>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={() => setActiveTab('edit')}>
                    Back to Edit
                  </Button>
                  <Button onClick={() => setActiveTab('deploy')}>
                    Deploy if Good
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Deploy Tab */}
            <TabsContent value="deploy" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deployment Target
                  </label>
                  <div className="flex space-x-2">
                    <Button
                      variant={deploymentTarget === 'draft' ? 'default' : 'outline'}
                      onClick={() => setDeploymentTarget('draft')}
                      className="flex items-center space-x-2"
                    >
                      <DocumentIcon className="h-4 w-4" />
                      Save as Draft
                    </Button>
                    <Button
                      variant={deploymentTarget === 'staging' ? 'default' : 'outline'}
                      onClick={() => setDeploymentTarget('staging')}
                      className="flex items-center space-x-2"
                    >
                      <ClockIcon className="h-4 w-4" />
                      Deploy to Staging
                    </Button>
                    <Button
                      variant={deploymentTarget === 'production' ? 'default' : 'outline'}
                      onClick={() => setDeploymentTarget('production')}
                      className="flex items-center space-x-2"
                    >
                      <CheckIcon className="h-4 w-4" />
                      Deploy to Production
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Version Notes
                  </label>
                  <Textarea
                    placeholder="Describe what changed in this version..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <EyeIcon className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      {deploymentTarget === 'production' 
                        ? 'Production deployment will affect all users immediately'
                        : deploymentTarget === 'staging'
                        ? 'Staging deployment will be available for testing'
                        : 'Draft will be saved for later review'
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setActiveTab('edit')}>
                  Back to Edit
                </Button>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleDeploy}>
                    {deploymentTarget === 'draft' ? 'Save Draft' :
                     deploymentTarget === 'staging' ? 'Deploy to Staging' :
                     'Deploy to Production'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Current Reasoning */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Reasoning</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">{stage.reasoning}</p>
            </div>
          </div>

          {/* Version History */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Version History</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary">v1.2</Badge>
                  <span className="text-sm font-medium">Current Version</span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(stage.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">v1.1</Badge>
                  <span className="text-sm">Previous Version</span>
                </div>
                <span className="text-xs text-gray-500">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
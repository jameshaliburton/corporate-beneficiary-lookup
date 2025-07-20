'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit, Save, X, Play, Copy } from 'lucide-react'

interface PromptInspectorV3Props {
  selectedResult: any
}

export default function PromptInspectorV3({ selectedResult }: PromptInspectorV3Props) {
  const [prompts, setPrompts] = useState<any[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null)
  const [editingPrompt, setEditingPrompt] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [promptSnapshot, setPromptSnapshot] = useState<any>(null)

  const fetchPrompts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/evaluation/v3/prompts')
      const data = await response.json()
      
      if (data.success) {
        setPrompts(data.prompts || [])
      }
    } catch (error) {
      console.error('Failed to fetch prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPromptSnapshot = async () => {
    if (!selectedResult?.trace_id) return

    try {
      const response = await fetch(`/api/evaluation/v3/prompt-snapshot?trace_id=${selectedResult.trace_id}`)
      const data = await response.json()
      
      if (data.success) {
        setPromptSnapshot(data.snapshot)
      }
    } catch (error) {
      console.error('Failed to fetch prompt snapshot:', error)
    }
  }

  useEffect(() => {
    fetchPrompts()
  }, [])

  useEffect(() => {
    if (selectedResult) {
      fetchPromptSnapshot()
    }
  }, [selectedResult])

  const handleEditPrompt = (prompt: any) => {
    setEditingPrompt({
      ...prompt,
      originalContent: prompt.content
    })
  }

  const handleSavePrompt = async () => {
    if (!editingPrompt) return

    try {
      const response = await fetch('/api/evaluation/v3/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_id: editingPrompt.id,
          content: editingPrompt.content,
          version: editingPrompt.version
        })
      })
      
      if (response.ok) {
        setEditingPrompt(null)
        fetchPrompts() // Refresh prompts
      }
    } catch (error) {
      console.error('Failed to save prompt:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingPrompt(null)
  }

  const handleRerunWithPrompt = async (prompt: any) => {
    if (!selectedResult) return

    try {
      const response = await fetch('/api/evaluation/v3/rerun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result_id: selectedResult.id,
          trace_id: selectedResult.trace_id,
          prompt_id: prompt.id,
          prompt_version: prompt.version,
          use_original_input: true
        })
      })
      
      if (response.ok) {
        // Could trigger a refresh of results
        console.log('Rerun initiated with prompt:', prompt.id)
      }
    } catch (error) {
      console.error('Failed to rerun with prompt:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading prompts...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Prompt Versions */}
      <Card>
        <CardHeader>
          <CardTitle>Prompt Versions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{prompt.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>Version: {prompt.version}</span>
                      {prompt.is_current && (
                        <Badge variant="default">Current</Badge>
                      )}
                      <Badge variant="outline">{prompt.status}</Badge>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditPrompt(prompt)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRerunWithPrompt(prompt)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Rerun
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(prompt.content)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
                
                {editingPrompt?.id === prompt.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editingPrompt.content}
                      onChange={(e) => setEditingPrompt(prev => ({ ...prev, content: e.target.value }))}
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={handleSavePrompt}>
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
                    {prompt.content}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Prompt Snapshot for Selected Result */}
      {selectedResult && promptSnapshot && (
        <Card>
          <CardHeader>
            <CardTitle>Prompt Snapshot - {selectedResult.brand}</CardTitle>
            <div className="text-sm text-gray-600">
              Trace ID: {selectedResult.trace_id}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">System Prompt</h4>
                <pre className="bg-blue-50 p-3 rounded text-xs overflow-x-auto">
                  {promptSnapshot.system_prompt}
                </pre>
              </div>
              
              {promptSnapshot.user_prompt && (
                <div>
                  <h4 className="font-medium text-sm mb-2">User Prompt</h4>
                  <pre className="bg-green-50 p-3 rounded text-xs overflow-x-auto">
                    {promptSnapshot.user_prompt}
                  </pre>
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(promptSnapshot.system_prompt)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy System Prompt
                </Button>
                {promptSnapshot.user_prompt && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(promptSnapshot.user_prompt)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy User Prompt
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedResult && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              Select a result to view its prompt snapshot
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 
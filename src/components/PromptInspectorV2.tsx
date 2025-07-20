'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PromptVersion {
  id: string
  name: string
  version: string
  content: string
  created_at: string
  is_current: boolean
}

interface PromptInspectorV2Props {
  selectedResult: any
}

export default function PromptInspectorV2({ selectedResult }: PromptInspectorV2Props) {
  const [promptVersions, setPromptVersions] = useState<PromptVersion[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<PromptVersion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [rerunLoading, setRerunLoading] = useState(false)

  const fetchPromptVersions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/evaluation/v2/prompts')
      const data = await response.json()
      
      if (data.success) {
        setPromptVersions(data.prompts)
      } else {
        setError(data.error || 'Failed to fetch prompt versions')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fetchPromptSnapshot = async (traceId: string) => {
    try {
      const response = await fetch(`/api/evaluation/v2/prompt-snapshot?trace_id=${traceId}`)
      const data = await response.json()
      
      if (data.success && data.prompt) {
        setSelectedPrompt(data.prompt)
      }
    } catch (err) {
      console.error('Failed to fetch prompt snapshot:', err)
    }
  }

  useEffect(() => {
    fetchPromptVersions()
  }, [])

  useEffect(() => {
    if (selectedResult?.trace_id) {
      fetchPromptSnapshot(selectedResult.trace_id)
    } else {
      setSelectedPrompt(null)
    }
  }, [selectedResult])

  const handleEditPrompt = () => {
    if (selectedPrompt) {
      setEditedContent(selectedPrompt.content)
      setEditMode(true)
    }
  }

  const handleSaveEdit = async () => {
    try {
      setRerunLoading(true)
      
      const response = await fetch('/api/evaluation/v2/rerun', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trace_id: selectedResult.trace_id,
          custom_prompt: editedContent,
          action: 'rerun_with_custom_prompt'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setEditMode(false)
        // TODO: Refresh the results table
        alert('Rerun completed successfully!')
      } else {
        setError(data.error || 'Failed to rerun with custom prompt')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setRerunLoading(false)
    }
  }

  const handleRerunWithVersion = async (promptVersion: PromptVersion) => {
    try {
      setRerunLoading(true)
      
      const response = await fetch('/api/evaluation/v2/rerun', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trace_id: selectedResult.trace_id,
          prompt_version: promptVersion.version,
          action: 'rerun_with_version'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Rerun completed successfully!')
      } else {
        setError(data.error || 'Failed to rerun with prompt version')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setRerunLoading(false)
    }
  }

  if (!selectedResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prompt Inspector</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Select a result from the table to view its prompt details.
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prompt Inspector</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-lg">Loading prompt versions...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prompt Inspector</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 mb-4">Error: {error}</div>
          <Button onClick={fetchPromptVersions}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Prompt Snapshot */}
      <Card>
        <CardHeader>
          <CardTitle>Prompt Snapshot - {selectedResult.brand}</CardTitle>
          <div className="text-sm text-gray-500">
            Trace ID: {selectedResult.trace_id}
          </div>
        </CardHeader>
        <CardContent>
          {selectedPrompt ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Version:</span> {selectedPrompt.version}
                  {selectedPrompt.is_current && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Current
                    </span>
                  )}
                </div>
                <div className="space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditPrompt}
                    disabled={editMode}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRerunWithVersion(selectedPrompt)}
                    disabled={rerunLoading}
                  >
                    {rerunLoading ? 'Rerunning...' : 'Rerun'}
                  </Button>
                </div>
              </div>
              
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Prompt Content:</div>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full h-64 p-3 border rounded font-mono text-sm"
                      placeholder="Enter custom prompt content..."
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSaveEdit}
                      disabled={rerunLoading}
                    >
                      {rerunLoading ? 'Saving...' : 'Save & Rerun'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditMode(false)}
                      disabled={rerunLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Prompt Content:</div>
                  <div className="bg-gray-50 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
                    {selectedPrompt.content}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No prompt snapshot found for this result.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Prompt Versions */}
      <Card>
        <CardHeader>
          <CardTitle>Available Prompt Versions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {promptVersions.map((prompt) => (
              <div key={prompt.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{prompt.name}</div>
                  <div className="text-sm text-gray-500">
                    Version: {prompt.version} | Created: {new Date(prompt.created_at).toLocaleDateString()}
                    {prompt.is_current && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Current
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRerunWithVersion(prompt)}
                  disabled={rerunLoading}
                >
                  {rerunLoading ? 'Rerunning...' : 'Rerun'}
                </Button>
              </div>
            ))}
            
            {promptVersions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No prompt versions available.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
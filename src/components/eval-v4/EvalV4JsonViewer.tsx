'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  EyeIcon,
  EyeSlashIcon,
  DocumentDuplicateIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CodeBracketIcon,
  VariableIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

interface JsonViewerProps {
  data: any
  title?: string
  onVariableSelect?: (variable: string, value: any) => void
  showVariableDiscovery?: boolean
}

// Common variable patterns that are likely to be reusable
const VARIABLE_PATTERNS = [
  'brand', 'product', 'owner', 'confidence', 'claim', 'result', 'output',
  'name', 'id', 'type', 'source', 'status', 'value', 'text', 'content',
  'title', 'description', 'summary', 'reasoning', 'explanation',
  'company', 'entity', 'organization', 'corporation', 'business',
  'verified', 'validated', 'confirmed', 'checked', 'reviewed'
]

// Recursively find all potential variables in JSON
const findVariables = (obj: any, path: string = ''): Array<{key: string, value: any, path: string}> => {
  const variables: Array<{key: string, value: any, path: string}> = []
  
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key
      
      // Check if this key matches our variable patterns
      if (VARIABLE_PATTERNS.some(pattern => 
        key.toLowerCase().includes(pattern.toLowerCase())
      )) {
        variables.push({
          key,
          value,
          path: currentPath
        })
      }
      
      // Recursively search nested objects
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        variables.push(...findVariables(value, currentPath))
      }
    }
  }
  
  return variables
}

// Format JSON with syntax highlighting
const formatJson = (data: any): string => {
  return JSON.stringify(data, null, 2)
}

// Simple syntax highlighting for JSON
const highlightJson = (json: string): string => {
  return json
    .replace(/"([^"]+)":/g, '<span class="text-blue-600 font-semibold">"$1"</span>:')
    .replace(/: "([^"]+)"/g, ': <span class="text-green-600">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="text-purple-600">$1</span>')
    .replace(/: (true|false|null)/g, ': <span class="text-orange-600">$1</span>')
    .replace(/(\{|\}|\[|\]|,)/g, '<span class="text-gray-500">$1</span>')
}

export default function EvalV4JsonViewer({ 
  data, 
  title = "JSON Output",
  onVariableSelect,
  showVariableDiscovery = true
}: JsonViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null)
  
  const variables = findVariables(data)
  const jsonString = formatJson(data)
  const highlightedJson = highlightJson(jsonString)
  
  const handleVariableCopy = (variable: string, value: any) => {
    const templateVar = `{{${variable}}}`
    navigator.clipboard.writeText(templateVar)
    setCopiedVariable(variable)
    
    if (onVariableSelect) {
      onVariableSelect(variable, value)
    }
    
    // Reset copied state after 2 seconds
    setTimeout(() => setCopiedVariable(null), 2000)
  }
  
  const getValuePreview = (value: any): string => {
    if (typeof value === 'string') {
      return value.length > 50 ? value.substring(0, 50) + '...' : value
    }
    if (typeof value === 'number') {
      return value.toString()
    }
    if (typeof value === 'boolean') {
      return value.toString()
    }
    if (value === null) {
      return 'null'
    }
    if (typeof value === 'object') {
      return JSON.stringify(value).substring(0, 30) + '...'
    }
    return String(value)
  }
  
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <div className="flex items-center space-x-2">
          <CodeBracketIcon className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-900">{title}</span>
          <Badge variant="outline" className="text-xs">
            {variables.length} variables found
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-1"
        >
          {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          <span>{isExpanded ? 'Collapse' : 'View JSON'}</span>
        </Button>
      </div>
      
      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Variable Discovery Section */}
          {showVariableDiscovery && variables.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <VariableIcon className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-900">Available Variables</span>
                <Badge variant="outline" className="text-xs">
                  Click to copy as template variable
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {variables.map(({ key, value, path }) => (
                  <div 
                    key={path}
                    className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-medium text-blue-800">
                          {key}
                        </span>
                        {copiedVariable === key && (
                          <CheckIcon className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div className="text-xs text-blue-600 truncate">
                        {getValuePreview(value)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVariableCopy(key, value)}
                      className="flex items-center space-x-1 text-blue-700 hover:text-blue-800"
                    >
                      {copiedVariable === key ? (
                        <CheckIcon className="w-3 h-3" />
                      ) : (
                        <ClipboardDocumentIcon className="w-3 h-3" />
                      )}
                      <span className="text-xs">
                        {copiedVariable === key ? 'Copied!' : 'Copy'}
                      </span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* JSON Display */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CodeBracketIcon className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">Raw JSON Output</span>
            </div>
            
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                <code 
                  dangerouslySetInnerHTML={{ __html: highlightedJson }}
                  className="whitespace-pre"
                />
              </pre>
              
              {/* Copy JSON Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(jsonString)
                  setCopiedVariable('__json__')
                  setTimeout(() => setCopiedVariable(null), 2000)
                }}
                className="absolute top-2 right-2 bg-gray-800 text-white hover:bg-gray-700"
              >
                {copiedVariable === '__json__' ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  <DocumentDuplicateIcon className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Usage Instructions */}
          <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
            <div className="flex items-start space-x-2">
              <VariableIcon className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Template Variable Usage</p>
                                 <p className="text-xs">
                   Click on any variable above to copy it as a template variable (e.g., <code className="bg-yellow-100 px-1 rounded">{"{{brand}}"}</code>). 
                   These can be used in downstream prompts to reference values from this step.
                 </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
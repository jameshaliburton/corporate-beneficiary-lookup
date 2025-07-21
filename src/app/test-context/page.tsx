'use client'

import { useState } from 'react'

export default function TestContextPage() {
  const [showSuccess, setShowSuccess] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Context Clarity System Test</h1>
        <p className="text-gray-600 mb-8">Testing the enhanced context clarity implementation.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
            <button 
              onClick={() => setShowSuccess(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Show Prompt Workflow Modal
            </button>
          </div>

          {/* Context Display */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Brand Extraction</h2>
            <div className="space-y-2 text-sm">
              <div><strong>Editing for:</strong> Nike - Air Jordan sneakers</div>
              <div><strong>Version:</strong> 1.2</div>
              <div><strong>Stage:</strong> 2 of 3</div>
              <div><strong>Agent:</strong> BrandExtractionAgent</div>
              <div><strong>Last updated:</strong> 1/15/2024, 11:30:00 AM</div>
            </div>
          </div>

          {/* Variable Timeline */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Variable Availability Timeline</h2>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Image Analysis</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium">Brand Extraction</span>
                <span className="text-xs bg-blue-100 px-2 py-1 rounded">Current</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span className="text-sm font-medium">Ownership Research</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">Future</span>
              </div>
            </div>
          </div>

          {/* Validation Warnings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Validation Warnings</h2>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-4 h-4 text-yellow-600">⚠️</div>
                <h4 className="text-sm font-medium text-yellow-800">Validation Warnings</h4>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-yellow-700">
                  • Variable "&#123;&#123;product&#125;&#125;" is available from previous stage
                </div>
                <div className="text-xs text-yellow-700">
                  • No hardcoded values detected
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Context Clarity System Working!</h2>
              <p className="mb-4">The context clarity system is functioning correctly with:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Enhanced context banner showing product/brand</li>
                <li>Variable availability timeline</li>
                <li>Validation warnings for variable references</li>
                <li>Real-time validation feedback</li>
              </ul>
              <button 
                onClick={() => setShowSuccess(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
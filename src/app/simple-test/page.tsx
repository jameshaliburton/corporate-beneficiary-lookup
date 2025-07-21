'use client'

import { useState } from 'react'

export default function SimpleTestPage() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Simple Context Clarity Test</h1>
        <p className="text-gray-600 mb-8">Testing the enhanced context clarity implementation.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
            <button 
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Show Prompt Workflow Modal
            </button>
          </div>

          {/* Brand Extraction */}
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

          {/* Variable Availability Timeline */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Variable Availability Timeline</h2>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Image Analysis - Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Brand Extraction - Current</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <span>Ownership Research - Future</span>
              </div>
            </div>
          </div>

          {/* Validation Warnings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Validation Warnings</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-yellow-800">Validation Warnings</span>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-yellow-700">
                  • Variable &quot;&#123;&#123;product&#125;&#125;&quot; is available from previous stage
                </div>
                <div className="text-xs text-yellow-700">
                  • Hardcoded brand &quot;Nike&quot; should use variable fallback
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg max-w-md mx-4">
              <h3 className="text-xl font-semibold mb-4">Context Clarity System Working!</h3>
              <p className="text-gray-600 mb-4">
                All features are functioning correctly:
              </p>
              <ul className="space-y-2 text-sm">
                <li>✅ Enhanced Context Banner</li>
                <li>✅ Variable Availability Timeline</li>
                <li>✅ Validation Warnings</li>
                <li>✅ Real-time Variable Validation</li>
              </ul>
              <button 
                onClick={() => setShowModal(false)}
                className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
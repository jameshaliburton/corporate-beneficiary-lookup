// Mock data types
import { TraceReasoning } from '@/types/trace'

export interface PromptInfo {
  version: string
  agent: string
  input: string
  output: string
  tokens: number
  latency_ms: number
}

// Mock-specific trace stage interface (different from the main TraceStage)
export interface MockTraceStage {
  stage: string
  status: 'success' | 'error' | 'pending'
  duration_ms: number
  reasoning: TraceReasoning[]
  prompt?: PromptInfo
}

export interface ScanResult {
  id: string
  brand: string
  product_name: string
  owner: string
  confidence: number
  country: string
  source: 'live' | 'eval' | 'retry'
  timestamp: string
  trace: MockTraceStage[]
}

// Mock scan results data
export const mockScanResults: ScanResult[] = [
  {
    id: "scan_001",
    brand: "Coca-Cola",
    product_name: "Coca-Cola 2L",
    owner: "The Coca-Cola Company",
    confidence: 95,
    country: "United States",
    source: "live",
    timestamp: "2025-07-20T13:28:36Z",
    trace: [
      {
        stage: "Cache Check",
        status: "success",
        duration_ms: 581,
        reasoning: [
          { type: "info", content: "Checking database for existing product record" },
          { type: "info", content: "No cached result found, proceeding with research" }
        ]
      },
      {
        stage: "Sheets Mapping",
        status: "success",
        duration_ms: 7,
        reasoning: [
          { type: "info", content: "Checking Google Sheets ownership mappings for brand: Coca-Cola" },
          { type: "info", content: "No mapping found, proceeding with static check" }
        ]
      },
      {
        stage: "Static Mapping",
        status: "success",
        duration_ms: 61,
        reasoning: [
          { type: "info", content: "Checking static mappings for brand: Coca-Cola" },
          { type: "evidence", content: "Mapped to The Coca-Cola Company (United States)" }
        ],
        prompt: {
          version: "v1.0",
          agent: "enhanced_ownership_research",
          input: "Brand: Coca-Cola",
          output: "The Coca-Cola Company",
          tokens: 324,
          latency_ms: 205
        }
      }
    ]
  },
  {
    id: "scan_002",
    brand: "Ferrero",
    product_name: "Nutella 1kg",
    owner: "Ferrero Group",
    confidence: 95,
    country: "Italy",
    source: "live",
    timestamp: "2025-07-20T13:25:12Z",
    trace: [
      {
        stage: "Cache Check",
        status: "success",
        duration_ms: 423,
        reasoning: [
          { type: "info", content: "Checking database for existing product record" },
          { type: "info", content: "No cached result found, proceeding with research" }
        ]
      },
      {
        stage: "Sheets Mapping",
        status: "success",
        duration_ms: 12,
        reasoning: [
          { type: "info", content: "Checking Google Sheets ownership mappings for brand: Ferrero" },
          { type: "info", content: "No mapping found, proceeding with static check" }
        ]
      },
      {
        stage: "Static Mapping",
        status: "success",
        duration_ms: 89,
        reasoning: [
          { type: "info", content: "Checking static mappings for brand: Ferrero" },
          { type: "evidence", content: "Mapped to Ferrero Group (Italy)" }
        ],
        prompt: {
          version: "v1.0",
          agent: "enhanced_ownership_research",
          input: "Brand: Ferrero",
          output: "Ferrero Group",
          tokens: 287,
          latency_ms: 178
        }
      }
    ]
  },
  {
    id: "scan_003",
    brand: "Nike",
    product_name: "Air Jordan 1",
    owner: "Nike Inc.",
    confidence: 98,
    country: "United States",
    source: "eval",
    timestamp: "2025-07-20T13:20:45Z",
    trace: [
      {
        stage: "Cache Check",
        status: "success",
        duration_ms: 312,
        reasoning: [
          { type: "info", content: "Checking database for existing product record" },
          { type: "info", content: "No cached result found, proceeding with research" }
        ]
      },
      {
        stage: "Sheets Mapping",
        status: "success",
        duration_ms: 15,
        reasoning: [
          { type: "info", content: "Checking Google Sheets ownership mappings for brand: Nike" },
          { type: "info", content: "No mapping found, proceeding with static check" }
        ]
      },
      {
        stage: "Static Mapping",
        status: "success",
        duration_ms: 73,
        reasoning: [
          { type: "info", content: "Checking static mappings for brand: Nike" },
          { type: "evidence", content: "Mapped to Nike Inc. (United States)" }
        ],
        prompt: {
          version: "v1.1",
          agent: "enhanced_ownership_research",
          input: "Brand: Nike",
          output: "Nike Inc.",
          tokens: 298,
          latency_ms: 165
        }
      }
    ]
  },
  {
    id: "scan_004",
    brand: "Unknown Brand",
    product_name: "Generic Product",
    owner: "Unknown",
    confidence: 25,
    country: "Unknown",
    source: "live",
    timestamp: "2025-07-20T13:15:30Z",
    trace: [
      {
        stage: "Cache Check",
        status: "success",
        duration_ms: 245,
        reasoning: [
          { type: "info", content: "Checking database for existing product record" },
          { type: "info", content: "No cached result found, proceeding with research" }
        ]
      },
      {
        stage: "Sheets Mapping",
        status: "success",
        duration_ms: 8,
        reasoning: [
          { type: "info", content: "Checking Google Sheets ownership mappings for brand: Unknown Brand" },
          { type: "warning", content: "No mapping found, proceeding with static check" }
        ]
      },
      {
        stage: "Static Mapping",
        status: "error",
        duration_ms: 156,
        reasoning: [
          { type: "info", content: "Checking static mappings for brand: Unknown Brand" },
          { type: "error", content: "No mapping found in static database" }
        ],
        prompt: {
          version: "v1.0",
          agent: "enhanced_ownership_research",
          input: "Brand: Unknown Brand",
          output: "Unknown",
          tokens: 156,
          latency_ms: 89
        }
      }
    ]
  },
  {
    id: "scan_005",
    brand: "Apple",
    product_name: "iPhone 15",
    owner: "Apple Inc.",
    confidence: 99,
    country: "United States",
    source: "eval",
    timestamp: "2025-07-20T13:10:22Z",
    trace: [
      {
        stage: "Cache Check",
        status: "success",
        duration_ms: 198,
        reasoning: [
          { type: "info", content: "Checking database for existing product record" },
          { type: "info", content: "No cached result found, proceeding with research" }
        ]
      },
      {
        stage: "Sheets Mapping",
        status: "success",
        duration_ms: 9,
        reasoning: [
          { type: "info", content: "Checking Google Sheets ownership mappings for brand: Apple" },
          { type: "info", content: "No mapping found, proceeding with static check" }
        ]
      },
      {
        stage: "Static Mapping",
        status: "success",
        duration_ms: 67,
        reasoning: [
          { type: "info", content: "Checking static mappings for brand: Apple" },
          { type: "evidence", content: "Mapped to Apple Inc. (United States)" }
        ],
        prompt: {
          version: "v1.1",
          agent: "enhanced_ownership_research",
          input: "Brand: Apple",
          output: "Apple Inc.",
          tokens: 234,
          latency_ms: 142
        }
      }
    ]
  }
]

// Helper functions for data manipulation
export const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'bg-green-100 text-green-800'
  if (confidence >= 60) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

export const getSourceColor = (source: string) => {
  switch (source) {
    case 'live': return 'bg-blue-100 text-blue-800'
    case 'eval': return 'bg-purple-100 text-purple-800'
    case 'retry': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'success': return 'bg-green-100 text-green-800'
    case 'error': return 'bg-red-100 text-red-800'
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export const getReasoningColor = (type: string) => {
  switch (type) {
    case 'evidence': return 'bg-green-50 text-green-700 border-green-200'
    case 'error': return 'bg-red-50 text-red-700 border-red-200'
    case 'warning': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    case 'info': 
    default: return 'bg-blue-50 text-blue-700 border-blue-200'
  }
} 
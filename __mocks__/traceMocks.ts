import { mockSuccessResult, mockAmbiguousResult, mockUnknownResult } from "./ownershipResults";

export const mockTraceManualEntry = {
  ...mockSuccessResult,
  agent_execution_trace: {
    trace_id: 'query_1753745252980_manual_entry',
    start_time: '2025-07-28T23:27:32.980Z',
    brand: 'OK Snacks',
    product_name: 'Pork Rinds',
    barcode: undefined,
    stages: [
      { stage: "manual_entry", status: "success", duration_ms: 1500 },
      { stage: "query_builder", status: "success", duration_ms: 2300 },
      { stage: "web_research", status: "success", duration_ms: 4500 },
      { stage: "ownership_analysis", status: "success", duration_ms: 3200 }
    ],
    decisions: [
      { decision: "use_manual_entry", reasoning: "User provided brand name directly" }
    ],
    reasoning_chain: [
      { step: "manual_entry", reasoning: "User entered OK Snacks manually" },
      { step: "query_builder", reasoning: "Generated search queries for OK Snacks ownership" },
      { step: "web_research", reasoning: "Found official company website and corporate registry" },
      { step: "ownership_analysis", reasoning: "Extracted ownership chain from verified sources" }
    ],
    performance_metrics: {
      total_duration_ms: 11500,
      stage_durations: {
        manual_entry: 1500,
        query_builder: 2300,
        web_research: 4500,
        ownership_analysis: 3200
      },
      memory_usage: null,
      api_calls: 3,
      token_usage: 1250
    },
    final_result: mockSuccessResult,
    error_details: null,
    confidence_evolution: [
      { stage: "manual_entry", confidence: 0 },
      { stage: "query_builder", confidence: 0 },
      { stage: "web_research", confidence: 75 },
      { stage: "ownership_analysis", confidence: 92 }
    ]
  }
};

export const mockTraceRetry = {
  ...mockSuccessResult,
  agent_execution_trace: {
    trace_id: 'query_1753745252980_retry',
    start_time: '2025-07-28T23:27:32.980Z',
    brand: 'OK Snacks',
    product_name: 'Pork Rinds',
    barcode: undefined,
    stages: [
      { stage: "manual_entry", status: "success", duration_ms: 1200 },
      { stage: "query_builder", status: "success", duration_ms: 2100 },
      { stage: "web_research", status: "retry", duration_ms: 25000 },
      { stage: "web_research", status: "success", duration_ms: 3800 },
      { stage: "ownership_analysis", status: "success", duration_ms: 2900 }
    ],
    decisions: [
      { decision: "retry_web_research", reasoning: "Initial web search timed out, retrying with exponential backoff" }
    ],
    reasoning_chain: [
      { step: "manual_entry", reasoning: "User entered OK Snacks manually" },
      { step: "query_builder", reasoning: "Generated search queries for OK Snacks ownership" },
      { step: "web_research", reasoning: "First attempt timed out after 25s" },
      { step: "web_research", reasoning: "Retry successful, found official sources" },
      { step: "ownership_analysis", reasoning: "Extracted ownership chain from verified sources" }
    ],
    performance_metrics: {
      total_duration_ms: 34000,
      stage_durations: {
        manual_entry: 1200,
        query_builder: 2100,
        web_research: 32500,
        ownership_analysis: 2900
      },
      memory_usage: null,
      api_calls: 4,
      token_usage: 1400
    },
    final_result: mockSuccessResult,
    error_details: null,
    confidence_evolution: [
      { stage: "manual_entry", confidence: 0 },
      { stage: "query_builder", confidence: 0 },
      { stage: "web_research", confidence: 0 },
      { stage: "web_research", confidence: 75 },
      { stage: "ownership_analysis", confidence: 92 }
    ]
  }
};

export const mockTraceVerified = {
  ...mockSuccessResult,
  verification_status: "verified",
  confidence_score: 88,
  sources: [
    "https://registry.example.com",
    "https://www.ok-snacks.com",
    "https://corporate.example.com"
  ],
  agent_execution_trace: {
    trace_id: 'query_1753745252980_verified',
    start_time: '2025-07-28T23:27:32.980Z',
    brand: 'OK Snacks',
    product_name: 'Pork Rinds',
    barcode: undefined,
    stages: [
      { stage: "manual_entry", status: "success", duration_ms: 1100 },
      { stage: "query_builder", status: "success", duration_ms: 1900 },
      { stage: "web_research", status: "success", duration_ms: 4200 },
      { stage: "ownership_analysis", status: "success", duration_ms: 3100 },
      { stage: "validation", status: "success", duration_ms: 1800 }
    ],
    decisions: [
      { decision: "verify_sources", reasoning: "Multiple Tier 1 sources confirm ownership structure" }
    ],
    reasoning_chain: [
      { step: "manual_entry", reasoning: "User entered OK Snacks manually" },
      { step: "query_builder", reasoning: "Generated targeted search queries" },
      { step: "web_research", reasoning: "Found official registry and company website" },
      { step: "ownership_analysis", reasoning: "Extracted verified ownership chain" },
      { step: "validation", reasoning: "Cross-referenced with multiple authoritative sources" }
    ],
    performance_metrics: {
      total_duration_ms: 12100,
      stage_durations: {
        manual_entry: 1100,
        query_builder: 1900,
        web_research: 4200,
        ownership_analysis: 3100,
        validation: 1800
      },
      memory_usage: null,
      api_calls: 5,
      token_usage: 1600
    },
    final_result: mockSuccessResult,
    error_details: null,
    confidence_evolution: [
      { stage: "manual_entry", confidence: 0 },
      { stage: "query_builder", confidence: 0 },
      { stage: "web_research", confidence: 80 },
      { stage: "ownership_analysis", confidence: 85 },
      { stage: "validation", confidence: 88 }
    ]
  }
};

export const mockTraceUnverified = {
  ...mockSuccessResult,
  verification_status: "needs_verification",
  confidence_score: 42,
  sources: [
    { name: "News Article", url: "https://news.example.com/article" },
    { name: "Blog Post", url: "https://blog.example.com/post" }
  ],
  agent_execution_trace: {
    trace_id: 'query_1753745252980_unverified',
    start_time: '2025-07-28T23:27:32.980Z',
    brand: 'OK Snacks',
    product_name: 'Pork Rinds',
    barcode: undefined,
    stages: [
      { stage: "manual_entry", status: "success", duration_ms: 1300 },
      { stage: "query_builder", status: "success", duration_ms: 2200 },
      { stage: "web_research", status: "success", duration_ms: 4100 },
      { stage: "ownership_analysis", status: "success", duration_ms: 2800 },
      { stage: "validation", status: "partial", duration_ms: 1500 }
    ],
    decisions: [
      { decision: "flag_for_verification", reasoning: "Sources are secondary and need verification" }
    ],
    reasoning_chain: [
      { step: "manual_entry", reasoning: "User entered OK Snacks manually" },
      { step: "query_builder", reasoning: "Generated search queries" },
      { step: "web_research", reasoning: "Found news articles and blog posts" },
      { step: "ownership_analysis", reasoning: "Extracted ownership information from secondary sources" },
      { step: "validation", reasoning: "Sources need verification with primary sources" }
    ],
    performance_metrics: {
      total_duration_ms: 11900,
      stage_durations: {
        manual_entry: 1300,
        query_builder: 2200,
        web_research: 4100,
        ownership_analysis: 2800,
        validation: 1500
      },
      memory_usage: null,
      api_calls: 3,
      token_usage: 1200
    },
    final_result: mockSuccessResult,
    error_details: null,
    confidence_evolution: [
      { stage: "manual_entry", confidence: 0 },
      { stage: "query_builder", confidence: 0 },
      { stage: "web_research", confidence: 45 },
      { stage: "ownership_analysis", confidence: 42 },
      { stage: "validation", confidence: 42 }
    ]
  }
};

export const mockTraceUnknown = {
  ...mockUnknownResult,
  agent_execution_trace: {
    trace_id: 'query_1753745252980_unknown',
    start_time: '2025-07-28T23:27:32.980Z',
    brand: 'UnknownBrand',
    product_name: 'Unknown Product',
    barcode: undefined,
    stages: [
      { stage: "manual_entry", status: "success", duration_ms: 1000 },
      { stage: "query_builder", status: "success", duration_ms: 1800 },
      { stage: "web_research", status: "success", duration_ms: 3500 },
      { stage: "ownership_analysis", status: "no_results", duration_ms: 1200 }
    ],
    decisions: [
      { decision: "return_unknown", reasoning: "No ownership information found in any sources" }
    ],
    reasoning_chain: [
      { step: "manual_entry", reasoning: "User entered UnknownBrand manually" },
      { step: "query_builder", reasoning: "Generated search queries for UnknownBrand" },
      { step: "web_research", reasoning: "Searched multiple sources but found no relevant information" },
      { step: "ownership_analysis", reasoning: "No ownership data available for this brand" }
    ],
    performance_metrics: {
      total_duration_ms: 7500,
      stage_durations: {
        manual_entry: 1000,
        query_builder: 1800,
        web_research: 3500,
        ownership_analysis: 1200
      },
      memory_usage: null,
      api_calls: 2,
      token_usage: 800
    },
    final_result: mockUnknownResult,
    error_details: null,
    confidence_evolution: [
      { stage: "manual_entry", confidence: 0 },
      { stage: "query_builder", confidence: 0 },
      { stage: "web_research", confidence: 0 },
      { stage: "ownership_analysis", confidence: 0 }
    ]
  }
};

export const mockTraceAmbiguous = {
  ...mockAmbiguousResult,
  agent_execution_trace: {
    trace_id: 'query_1753745252980_ambiguous',
    start_time: '2025-07-28T23:27:32.980Z',
    brand: 'OK Snacks',
    product_name: 'Pork Rinds',
    barcode: undefined,
    stages: [
      { stage: "manual_entry", status: "success", duration_ms: 1400 },
      { stage: "query_builder", status: "success", duration_ms: 2400 },
      { stage: "web_research", status: "success", duration_ms: 4800 },
      { stage: "ownership_analysis", status: "ambiguous", duration_ms: 3600 },
      { stage: "disambiguation", status: "success", duration_ms: 2200 }
    ],
    decisions: [
      { decision: "identify_alternatives", reasoning: "Multiple companies found with similar names" }
    ],
    reasoning_chain: [
      { step: "manual_entry", reasoning: "User entered OK Snacks manually" },
      { step: "query_builder", reasoning: "Generated search queries for OK Snacks" },
      { step: "web_research", reasoning: "Found multiple OK companies in different industries" },
      { step: "ownership_analysis", reasoning: "Identified primary company and alternatives" },
      { step: "disambiguation", reasoning: "Ranked alternatives by relevance and confidence" }
    ],
    performance_metrics: {
      total_duration_ms: 14400,
      stage_durations: {
        manual_entry: 1400,
        query_builder: 2400,
        web_research: 4800,
        ownership_analysis: 3600,
        disambiguation: 2200
      },
      memory_usage: null,
      api_calls: 4,
      token_usage: 1800
    },
    final_result: mockAmbiguousResult,
    error_details: null,
    confidence_evolution: [
      { stage: "manual_entry", confidence: 0 },
      { stage: "query_builder", confidence: 0 },
      { stage: "web_research", confidence: 70 },
      { stage: "ownership_analysis", confidence: 85 },
      { stage: "disambiguation", confidence: 92 }
    ]
  }
}; 
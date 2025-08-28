export function isTestResponse(trace: any): boolean {
  return trace?.result_type === "test_response" || 
         trace?.headline?.includes("TEST DATA") ||
         trace?.agent_used === "Test Response" ||
         trace?.error === "ANTHROPIC_API_KEY not set";
} 
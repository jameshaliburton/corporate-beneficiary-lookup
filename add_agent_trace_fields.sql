-- Add fields for detailed agent execution trace
ALTER TABLE products 
ADD COLUMN agent_execution_trace JSONB,
ADD COLUMN initial_llm_confidence INTEGER,
ADD COLUMN agent_results JSONB,
ADD COLUMN fallback_reason TEXT;

-- Add comments for documentation
COMMENT ON COLUMN products.agent_execution_trace IS 'Detailed trace of which agents were executed and in what order';
COMMENT ON COLUMN products.initial_llm_confidence IS 'Confidence score from initial LLM analysis before any fallback';
COMMENT ON COLUMN products.agent_results IS 'Individual results and reasoning from each agent';
COMMENT ON COLUMN products.fallback_reason IS 'Reason why fallback agents were triggered'; 
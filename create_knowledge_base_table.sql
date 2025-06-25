-- Create ownership_knowledge_base table for RAG system
CREATE TABLE IF NOT EXISTS ownership_knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  product_name TEXT,
  barcode TEXT,
  financial_beneficiary TEXT NOT NULL,
  beneficiary_country TEXT NOT NULL,
  ownership_structure_type TEXT NOT NULL,
  ownership_flow JSONB DEFAULT '[]',
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  reasoning TEXT NOT NULL,
  sources TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_knowledge_base_brand ON ownership_knowledge_base(brand);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_confidence ON ownership_knowledge_base(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_structure_type ON ownership_knowledge_base(ownership_structure_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_country ON ownership_knowledge_base(beneficiary_country);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_created_at ON ownership_knowledge_base(created_at DESC);

-- Create a GIN index for JSONB ownership_flow for efficient querying
CREATE INDEX IF NOT EXISTS idx_knowledge_base_ownership_flow ON ownership_knowledge_base USING GIN (ownership_flow);

-- Create a GIN index for tags array for efficient tag-based queries
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON ownership_knowledge_base USING GIN (tags);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_ownership_knowledge_base_updated_at 
    BEFORE UPDATE ON ownership_knowledge_base 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE ownership_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on ownership_knowledge_base" ON ownership_knowledge_base
    FOR ALL USING (true); 
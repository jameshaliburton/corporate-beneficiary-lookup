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

-- Create knowledge_base table for storing company information and ownership data
CREATE TABLE IF NOT EXISTS knowledge_base (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Company identification
    company_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255),
    alternative_names TEXT[], -- Array of alternative company names
    
    -- Ownership information
    parent_company VARCHAR(255),
    ultimate_owner VARCHAR(255),
    ownership_structure_type VARCHAR(100), -- 'Private', 'Public', 'Subsidiary', 'Joint Venture', etc.
    
    -- Geographic information
    country VARCHAR(100),
    region VARCHAR(100),
    headquarters VARCHAR(255),
    
    -- Business information
    industry VARCHAR(100),
    business_type VARCHAR(100),
    founded_year INTEGER,
    
    -- Source and confidence
    source_url TEXT,
    source_type VARCHAR(50), -- 'manual', 'web_research', 'api', 'database'
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
    
    -- Additional metadata
    notes TEXT,
    tags TEXT[],
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(company_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(brand_name, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(parent_company, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(ultimate_owner, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(notes, '')), 'D')
    ) STORED
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_knowledge_base_company_name ON knowledge_base(company_name);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_brand_name ON knowledge_base(brand_name);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_ultimate_owner ON knowledge_base(ultimate_owner);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_country ON knowledge_base(country);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_confidence ON knowledge_base(confidence_score);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_search_vector ON knowledge_base USING GIN(search_vector);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_knowledge_base_updated_at 
    BEFORE UPDATE ON knowledge_base 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO knowledge_base (company_name, brand_name, ultimate_owner, country, industry, confidence_score, source_type) VALUES
('Malmö Chokladfabrik AB', 'Malmö Chokladfabrik', 'Malmö Chokladfabrik AB', 'Sweden', 'Food & Beverage', 90, 'manual'),
('Atlantic Grupa d.d.', 'Argeta', 'Atlantic Grupa d.d.', 'Croatia', 'Food & Beverage', 95, 'manual'),
('Nestlé S.A.', 'Nestlé', 'Nestlé S.A.', 'Switzerland', 'Food & Beverage', 98, 'manual'),
('Unilever PLC', 'Unilever', 'Unilever PLC', 'United Kingdom', 'Consumer Goods', 98, 'manual'),
('Procter & Gamble Co.', 'P&G', 'Procter & Gamble Co.', 'United States', 'Consumer Goods', 98, 'manual')
ON CONFLICT (company_name) DO NOTHING; 
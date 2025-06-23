-- Migration: Add missing columns to products table for ownership research system
-- Safe to run multiple times (checks for column existence)

-- Add query_analysis_used (boolean)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'query_analysis_used'
    ) THEN
        ALTER TABLE products ADD COLUMN query_analysis_used BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add result_type (text)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'result_type'
    ) THEN
        ALTER TABLE products ADD COLUMN result_type TEXT;
    END IF;
END $$;

-- Add static_mapping_used (boolean)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'static_mapping_used'
    ) THEN
        ALTER TABLE products ADD COLUMN static_mapping_used BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add web_research_used (boolean)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'web_research_used'
    ) THEN
        ALTER TABLE products ADD COLUMN web_research_used BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add web_sources_count (integer)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'web_sources_count'
    ) THEN
        ALTER TABLE products ADD COLUMN web_sources_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add ownership_flow (array of text)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'ownership_flow'
    ) THEN
        ALTER TABLE products ADD COLUMN ownership_flow TEXT[];
    END IF;
END $$;

-- Add beneficiary_flag (text)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'beneficiary_flag'
    ) THEN
        ALTER TABLE products ADD COLUMN beneficiary_flag TEXT;
    END IF;
END $$;

-- Add sources (array of text)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'sources'
    ) THEN
        ALTER TABLE products ADD COLUMN sources TEXT[];
    END IF;
END $$;

-- Add reasoning (text)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'reasoning'
    ) THEN
        ALTER TABLE products ADD COLUMN reasoning TEXT;
    END IF;
END $$; 
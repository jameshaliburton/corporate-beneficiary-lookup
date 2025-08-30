-- Migration: Add Gemini verification fields to products table
-- Safe to run multiple times (checks for column existence)

-- Add verification_status (text)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'verification_status'
    ) THEN
        ALTER TABLE products ADD COLUMN verification_status TEXT;
    END IF;
END $$;

-- Add verified_at (timestamp)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'verified_at'
    ) THEN
        ALTER TABLE products ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add verification_method (text)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'verification_method'
    ) THEN
        ALTER TABLE products ADD COLUMN verification_method TEXT;
    END IF;
END $$;

-- Add verification_notes (text)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'verification_notes'
    ) THEN
        ALTER TABLE products ADD COLUMN verification_notes TEXT;
    END IF;
END $$;

-- Add confidence_assessment (jsonb)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'confidence_assessment'
    ) THEN
        ALTER TABLE products ADD COLUMN confidence_assessment JSONB;
    END IF;
END $$;

-- Add verification_evidence (jsonb)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'verification_evidence'
    ) THEN
        ALTER TABLE products ADD COLUMN verification_evidence JSONB;
    END IF;
END $$;

-- Add verification_confidence_change (text)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'verification_confidence_change'
    ) THEN
        ALTER TABLE products ADD COLUMN verification_confidence_change TEXT;
    END IF;
END $$;

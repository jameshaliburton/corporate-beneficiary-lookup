-- Add user contribution fields to products table if they don't exist
-- This script is safe to run multiple times

-- Add user_contributed field
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'user_contributed'
    ) THEN
        ALTER TABLE products ADD COLUMN user_contributed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add inferred field
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'inferred'
    ) THEN
        ALTER TABLE products ADD COLUMN inferred BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Add ownership_flow field (array of text)
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

-- Add beneficiary_flag field
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

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position; 
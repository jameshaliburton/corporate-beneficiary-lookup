-- Add result_id column to products table for deep linking
ALTER TABLE products 
ADD COLUMN result_id VARCHAR(12) UNIQUE;

-- Create index for faster lookups by result_id
CREATE INDEX idx_products_result_id ON products(result_id);

-- Add comment explaining the column
COMMENT ON COLUMN products.result_id IS 'Unique identifier for deep linking to specific results'; 
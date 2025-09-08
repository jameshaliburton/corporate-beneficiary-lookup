-- Index Optimization Script (ownership-por-v1.1)
-- Applies recommended index optimizations for critical lookup fields

-- ===== PRODUCTS TABLE INDEXES =====

-- Brand index (case-insensitive for consistent lookups)
CREATE INDEX IF NOT EXISTS idx_products_brand_lower ON products(LOWER(brand));

-- Product name index
CREATE INDEX IF NOT EXISTS idx_products_product_name ON products(product_name);

-- Financial beneficiary index
CREATE INDEX IF NOT EXISTS idx_products_financial_beneficiary ON products(financial_beneficiary);

-- Beneficiary country index
CREATE INDEX IF NOT EXISTS idx_products_beneficiary_country ON products(beneficiary_country);

-- Confidence score index (DESC for high-confidence first)
CREATE INDEX IF NOT EXISTS idx_products_confidence_score ON products(confidence_score DESC);

-- Created at index (DESC for recent first)
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Updated at index (DESC for recent first)
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at DESC);

-- Verification status index
CREATE INDEX IF NOT EXISTS idx_products_verification_status ON products(verification_status);

-- Result type index
CREATE INDEX IF NOT EXISTS idx_products_result_type ON products(result_type);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_products_brand_product ON products(LOWER(brand), product_name);
CREATE INDEX IF NOT EXISTS idx_products_brand_beneficiary ON products(LOWER(brand), financial_beneficiary);
CREATE INDEX IF NOT EXISTS idx_products_confidence_created ON products(confidence_score DESC, created_at DESC);

-- ===== OWNERSHIP_MAPPINGS TABLE INDEXES =====

-- Ultimate owner name index
CREATE INDEX IF NOT EXISTS idx_ownership_mappings_ultimate_owner ON ownership_mappings(ultimate_owner_name);

-- Ultimate owner country index
CREATE INDEX IF NOT EXISTS idx_ownership_mappings_ultimate_country ON ownership_mappings(ultimate_owner_country);

-- ===== OWNERSHIP_KNOWLEDGE_BASE TABLE INDEXES =====

-- Brand index (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_knowledge_base_brand_lower ON ownership_knowledge_base(LOWER(brand));

-- Financial beneficiary index
CREATE INDEX IF NOT EXISTS idx_knowledge_base_financial_beneficiary ON ownership_knowledge_base(financial_beneficiary);

-- Beneficiary country index
CREATE INDEX IF NOT EXISTS idx_knowledge_base_beneficiary_country ON ownership_knowledge_base(beneficiary_country);

-- ===== KNOWLEDGE_BASE TABLE INDEXES =====

-- Company name index
CREATE INDEX IF NOT EXISTS idx_knowledge_base_company_name ON knowledge_base(company_name);

-- Brand name index
CREATE INDEX IF NOT EXISTS idx_knowledge_base_brand_name ON knowledge_base(brand_name);

-- Ultimate owner index
CREATE INDEX IF NOT EXISTS idx_knowledge_base_ultimate_owner ON knowledge_base(ultimate_owner);

-- Country index
CREATE INDEX IF NOT EXISTS idx_knowledge_base_country ON knowledge_base(country);

-- Confidence score index (DESC)
CREATE INDEX IF NOT EXISTS idx_knowledge_base_confidence_score ON knowledge_base(confidence_score DESC);

-- Created at index (DESC)
CREATE INDEX IF NOT EXISTS idx_knowledge_base_created_at ON knowledge_base(created_at DESC);

-- ===== PERFORMANCE MONITORING =====

-- Add comments for index documentation
COMMENT ON INDEX idx_products_brand_lower IS 'Case-insensitive brand lookup for cache operations';
COMMENT ON INDEX idx_products_confidence_created IS 'High-confidence recent results for dashboard queries';
COMMENT ON INDEX idx_products_brand_product IS 'Brand+product composite lookup for cache hits';
COMMENT ON INDEX idx_products_brand_beneficiary IS 'Brand+beneficiary composite lookup for ownership queries';

-- ===== INDEX STATISTICS =====

-- Update table statistics for better query planning
ANALYZE products;
ANALYZE ownership_mappings;
ANALYZE ownership_knowledge_base;
ANALYZE knowledge_base;

-- ===== VERIFICATION QUERIES =====

-- Verify indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('products', 'ownership_mappings', 'ownership_knowledge_base', 'knowledge_base')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check index usage statistics (run after some usage)
-- SELECT 
--     schemaname,
--     tablename,
--     indexname,
--     idx_scan,
--     idx_tup_read,
--     idx_tup_fetch
-- FROM pg_stat_user_indexes 
-- WHERE tablename IN ('products', 'ownership_mappings', 'ownership_knowledge_base', 'knowledge_base')
-- ORDER BY idx_scan DESC;

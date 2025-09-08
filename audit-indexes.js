/**
 * Index Audit Script (ownership-por-v1.1)
 * Audits and optimizes database indexes for critical lookup fields
 */

import { supabase } from './src/lib/supabase.ts'

class IndexAuditor {
  constructor() {
    this.tables = ['products', 'ownership_mappings', 'ownership_knowledge_base', 'knowledge_base'];
  }

  /**
   * Audit all indexes for the specified tables
   */
  async auditAllIndexes() {
    console.log('[INDEX_CHECK] Starting comprehensive index audit (ownership-por-v1.1)');
    
    const results = {};
    
    for (const table of this.tables) {
      console.log(`[INDEX_CHECK] Auditing table: ${table}`);
      results[table] = await this.auditTableIndexes(table);
    }
    
    this.generateReport(results);
    return results;
  }

  /**
   * Audit indexes for a specific table
   */
  async auditTableIndexes(tableName) {
    try {
      // Get all indexes for the table
      const { data: indexes, error: indexError } = await supabase
        .from('pg_indexes')
        .select('*')
        .eq('tablename', tableName);

      if (indexError) {
        console.error(`[INDEX_CHECK] Error fetching indexes for ${tableName}:`, indexError);
        return { error: indexError.message };
      }

      // Get table columns
      const { data: columns, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', tableName);

      if (columnError) {
        console.error(`[INDEX_CHECK] Error fetching columns for ${tableName}:`, columnError);
        return { error: columnError.message };
      }

      const audit = {
        table: tableName,
        indexes: indexes || [],
        columns: columns || [],
        recommendations: []
      };

      // Analyze indexes based on table type
      switch (tableName) {
        case 'products':
          this.auditProductsIndexes(audit);
          break;
        case 'ownership_mappings':
          this.auditOwnershipMappingsIndexes(audit);
          break;
        case 'ownership_knowledge_base':
          this.auditKnowledgeBaseIndexes(audit);
          break;
        case 'knowledge_base':
          this.auditKnowledgeBaseIndexes(audit);
          break;
      }

      console.log(`[INDEX_CHECK] Completed audit for ${tableName}:`, {
        indexesCount: audit.indexes.length,
        recommendationsCount: audit.recommendations.length
      });

      return audit;

    } catch (error) {
      console.error(`[INDEX_CHECK] Error auditing ${tableName}:`, error);
      return { error: error.message };
    }
  }

  /**
   * Audit indexes for products table
   */
  auditProductsIndexes(audit) {
    const criticalFields = [
      'brand',
      'product_name', 
      'financial_beneficiary',
      'beneficiary_country',
      'confidence_score',
      'created_at',
      'updated_at',
      'verification_status',
      'result_type'
    ];

    const existingIndexes = audit.indexes.map(idx => idx.indexname);
    
    // Check for critical field indexes
    for (const field of criticalFields) {
      const hasIndex = existingIndexes.some(idx => 
        idx.includes(field.toLowerCase()) || 
        idx.includes('brand') && field === 'brand'
      );

      if (!hasIndex) {
        audit.recommendations.push({
          type: 'missing_index',
          field: field,
          priority: this.getFieldPriority(field),
          sql: this.generateIndexSQL('products', field)
        });
      }
    }

    // Check for composite indexes
    const compositeIndexes = [
      ['brand', 'product_name'],
      ['brand', 'financial_beneficiary'],
      ['confidence_score', 'created_at']
    ];

    for (const composite of compositeIndexes) {
      const hasCompositeIndex = existingIndexes.some(idx => 
        composite.every(field => idx.includes(field.toLowerCase()))
      );

      if (!hasCompositeIndex) {
        audit.recommendations.push({
          type: 'missing_composite_index',
          fields: composite,
          priority: 'high',
          sql: this.generateCompositeIndexSQL('products', composite)
        });
      }
    }
  }

  /**
   * Audit indexes for ownership_mappings table
   */
  auditOwnershipMappingsIndexes(audit) {
    const criticalFields = ['brand_name', 'ultimate_owner_name', 'ultimate_owner_country'];
    const existingIndexes = audit.indexes.map(idx => idx.indexname);

    for (const field of criticalFields) {
      const hasIndex = existingIndexes.some(idx => idx.includes(field.toLowerCase()));

      if (!hasIndex) {
        audit.recommendations.push({
          type: 'missing_index',
          field: field,
          priority: 'high',
          sql: this.generateIndexSQL('ownership_mappings', field)
        });
      }
    }
  }

  /**
   * Audit indexes for knowledge base tables
   */
  auditKnowledgeBaseIndexes(audit) {
    const criticalFields = [
      'brand', 
      'financial_beneficiary', 
      'confidence_score', 
      'created_at',
      'beneficiary_country'
    ];
    const existingIndexes = audit.indexes.map(idx => idx.indexname);

    for (const field of criticalFields) {
      const hasIndex = existingIndexes.some(idx => idx.includes(field.toLowerCase()));

      if (!hasIndex) {
        audit.recommendations.push({
          type: 'missing_index',
          field: field,
          priority: this.getFieldPriority(field),
          sql: this.generateIndexSQL(audit.table, field)
        });
      }
    }
  }

  /**
   * Get priority level for a field
   */
  getFieldPriority(field) {
    const highPriority = ['brand', 'financial_beneficiary', 'confidence_score'];
    const mediumPriority = ['product_name', 'beneficiary_country', 'created_at'];
    
    if (highPriority.includes(field)) return 'high';
    if (mediumPriority.includes(field)) return 'medium';
    return 'low';
  }

  /**
   * Generate SQL for creating an index
   */
  generateIndexSQL(table, field) {
    const indexName = `idx_${table}_${field}`;
    
    // Special handling for certain fields
    if (field === 'confidence_score') {
      return `CREATE INDEX IF NOT EXISTS ${indexName} ON ${table}(${field} DESC);`;
    } else if (field === 'created_at') {
      return `CREATE INDEX IF NOT EXISTS ${indexName} ON ${table}(${field} DESC);`;
    } else if (field === 'brand' || field === 'brand_name') {
      return `CREATE INDEX IF NOT EXISTS ${indexName} ON ${table}(LOWER(${field}));`;
    } else {
      return `CREATE INDEX IF NOT EXISTS ${indexName} ON ${table}(${field});`;
    }
  }

  /**
   * Generate SQL for creating a composite index
   */
  generateCompositeIndexSQL(table, fields) {
    const indexName = `idx_${table}_${fields.join('_')}`;
    const fieldList = fields.join(', ');
    return `CREATE INDEX IF NOT EXISTS ${indexName} ON ${table}(${fieldList});`;
  }

  /**
   * Generate comprehensive audit report
   */
  generateReport(results) {
    console.log('\n[INDEX_CHECK] ===== INDEX AUDIT REPORT (ownership-por-v1.1) =====');
    
    let totalRecommendations = 0;
    let highPriorityRecommendations = 0;

    for (const [table, audit] of Object.entries(results)) {
      if (audit.error) {
        console.log(`\n[INDEX_CHECK] ❌ ${table}: ERROR - ${audit.error}`);
        continue;
      }

      console.log(`\n[INDEX_CHECK] 📊 ${table}:`);
      console.log(`  - Existing indexes: ${audit.indexes.length}`);
      console.log(`  - Recommendations: ${audit.recommendations.length}`);

      if (audit.recommendations.length > 0) {
        console.log(`  - Recommendations:`);
        for (const rec of audit.recommendations) {
          const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
          console.log(`    ${priority} ${rec.type}: ${rec.field || rec.fields?.join(', ')}`);
          console.log(`      SQL: ${rec.sql}`);
          
          totalRecommendations++;
          if (rec.priority === 'high') highPriorityRecommendations++;
        }
      }
    }

    console.log(`\n[INDEX_CHECK] ===== SUMMARY =====`);
    console.log(`Total recommendations: ${totalRecommendations}`);
    console.log(`High priority recommendations: ${highPriorityRecommendations}`);
    
    if (highPriorityRecommendations > 0) {
      console.log(`\n[INDEX_CHECK] ⚠️  ${highPriorityRecommendations} high-priority index optimizations recommended`);
    } else {
      console.log(`\n[INDEX_CHECK] ✅ No critical index issues found`);
    }
  }
}

// Run the audit if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const auditor = new IndexAuditor();
  auditor.auditAllIndexes()
    .then(results => {
      console.log('\n[INDEX_CHECK] Index audit completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('[INDEX_CHECK] Index audit failed:', error);
      process.exit(1);
    });
}

export { IndexAuditor };

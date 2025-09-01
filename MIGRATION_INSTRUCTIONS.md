# Database Migration: Add Gemini Verification Fields

## 🎯 Problem
The Gemini verification fields are missing from the `products` table schema, causing:
- Cache save failures with error: `"Could not find the 'verification_method' column of 'products' in the schema cache"`
- Gemini verification re-running on every cache hit
- Verification status not persisting between requests

## ✅ Solution
Add the missing verification fields to the `products` table.

## 📝 SQL Migration
Run these SQL statements in your **Supabase SQL Editor**:

```sql
-- Add Gemini verification fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS verification_status TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS verification_method TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS confidence_assessment JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS agent_path TEXT[];
```

## 🔧 How to Apply

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration**
   - Copy and paste the SQL statements above
   - Click "Run" to execute the migration

3. **Verify the Migration**
   - Check that the columns were added successfully
   - You can verify by running: `SELECT column_name FROM information_schema.columns WHERE table_name = 'products';`

## 🧪 Testing After Migration

After running the migration, test the fix:

1. **Flush the cache:**
   ```bash
   curl -X POST http://localhost:3000/api/dev/flush-cache -H 'Content-Type: application/json' -d '{"brands": ["sony"]}'
   ```

2. **First Sony lookup (should trigger Gemini):**
   ```bash
   curl -X POST http://localhost:3000/api/lookup -H 'Content-Type: application/json' -d '{"brand": "Sony", "product_name": "PlayStation", "barcode": null, "hints": {}, "evaluation_mode": false}' | jq '{verification_status, verified_at, cache_hit, agent_path}'
   ```

3. **Second Sony lookup (should skip Gemini):**
   ```bash
   curl -X POST http://localhost:3000/api/lookup -H 'Content-Type: application/json' -d '{"brand": "Sony", "product_name": "PlayStation", "barcode": null, "hints": {}, "evaluation_mode": false}' | jq '{verification_status, verified_at, cache_hit, agent_path}'
   ```

## ✅ Expected Results

- **First call**: `agent_path: ["gemini_verification_inline_cache"]` (Gemini runs)
- **Second call**: `agent_path: []` or no `agent_path` (Gemini skipped)
- **Both calls**: `verification_status: "insufficient_evidence"` and `verified_at: "2025-08-30T..."`

## 🚨 Rollback (if needed)

If you need to rollback the migration:

```sql
-- Remove verification fields (use with caution)
ALTER TABLE products DROP COLUMN IF EXISTS verification_status;
ALTER TABLE products DROP COLUMN IF EXISTS verified_at;
ALTER TABLE products DROP COLUMN IF EXISTS verification_method;
ALTER TABLE products DROP COLUMN IF EXISTS verification_notes;
ALTER TABLE products DROP COLUMN IF EXISTS confidence_assessment;
ALTER TABLE products DROP COLUMN IF EXISTS agent_path;
```

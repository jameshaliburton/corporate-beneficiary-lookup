# Deployment Guide

## Environment Variables Required for Production

### Required Variables (must be set in Vercel)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `ANTHROPIC_API_KEY` - Your Anthropic API key for AI agents
- `GOOGLE_API_KEY` - Google Search API key (optional, for web research)
- `GOOGLE_CSE_ID` - Google Custom Search Engine ID (optional, for web research)
- `OPENCORPORATES_API_KEY` - OpenCorporates API key (optional, for company data)

### Optional Variables (for evaluation framework)
- `GOOGLE_SHEETS_EVALUATION_ID` - Google Sheets ID for evaluation data
- `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` - Path to Google service account JSON
- `ENABLE_EVALUATION_LOGGING` - Set to 'true' to enable evaluation logging
- `NEXT_PUBLIC_BASE_URL` - Your production URL (auto-set by Vercel)

## Deployment Steps

### 1. Deploy to Vercel
```bash
vercel
```

### 2. Set Environment Variables in Vercel Dashboard
1. Go to your project in Vercel dashboard
2. Navigate to Settings > Environment Variables
3. Add each required variable from the list above

### 3. Redeploy with Environment Variables
```bash
vercel --prod
```

## Database Setup

Make sure your Supabase database has all the required tables:
- `products` - Main product data
- `ownership_mappings` - Static ownership mappings
- `scan_logs` - Scan history (optional)

Run the SQL migration files if needed:
- `add_agent_trace_fields.sql`
- `add_updated_at_column.sql`
- `add_products_missing_fields.sql`
- `create_ownership_mappings_table.sql`

## Post-Deployment Checklist

- [ ] Environment variables are set in Vercel
- [ ] Database tables are created and populated
- [ ] API endpoints are working (test `/api/dashboard/stats`)
- [ ] Dashboard loads correctly
- [ ] Barcode scanning functionality works
- [ ] Agent execution traces are being logged

## Troubleshooting

### Common Issues:
1. **Environment Variables Not Set**: Check Vercel dashboard
2. **Database Connection**: Verify Supabase URL and key
3. **API Keys**: Ensure all required API keys are valid
4. **CORS Issues**: Vercel handles this automatically for Next.js

### Testing Production:
```bash
# Test API endpoints
curl https://your-app.vercel.app/api/dashboard/stats
curl https://your-app.vercel.app/api/dashboard/products?limit=1
``` 
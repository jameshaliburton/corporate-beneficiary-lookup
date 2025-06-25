# API Setup Guide for Enhanced Barcode Lookup

This guide covers setting up optional APIs to improve the barcode lookup and ownership research capabilities.

## Required APIs (Already Configured)

- **ANTHROPIC_API_KEY** - For AI agents (Claude)
- **GOOGLE_API_KEY** + **GOOGLE_CSE_ID** - For web research

## Optional APIs for Enhanced Functionality

### 1. SerpAPI (Google Shopping Search)
**Purpose**: Reverse search barcodes on Google Shopping to find product names/brands
**Cost**: ~$50/month for 5,000 searches
**Setup**:
1. Sign up at https://serpapi.com/
2. Get API key from dashboard
3. Add to environment: `SERP_API_KEY=your_key_here`

**Benefits**:
- Can find products when other databases fail
- Provides product names, brands, and pricing
- Good fallback for unknown barcodes

### 2. GS1 GEPIR API (Company Identification)
**Purpose**: Identify the company that owns a barcode prefix
**Cost**: Free with registration
**Setup**:
1. Register at https://gepir.gs1.org/
2. Request API access
3. Add to environment: `GEPIR_API_KEY=your_key_here`

**Benefits**:
- Direct company identification from barcode prefix
- Provides company name, country, address
- Free and authoritative source

### 3. OpenCorporates API (Corporate Research)
**Purpose**: Enhanced corporate ownership research
**Cost**: Free tier available, paid plans for higher limits
**Setup**:
1. Sign up at https://opencorporates.com/
2. Get API key
3. Add to environment: `OPENCORPORATES_API_KEY=your_key_here`

**Benefits**:
- Better corporate structure data
- Ownership relationships
- Free tier available

## Environment Variables Setup

Add these to your `.env.local` file:

```bash
# Required (already configured)
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
GOOGLE_CSE_ID=your_google_cse_id

# Optional - Add as you get them
SERP_API_KEY=your_serpapi_key
GEPIR_API_KEY=your_gepir_key
OPENCORPORATES_API_KEY=your_opencorporates_key
```

## Vercel Deployment

For Vercel deployment, add these environment variables in your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each key-value pair

## Testing the APIs

Once you have the APIs set up, you can test them:

```bash
# Test SerpAPI
node test-enhanced-lookup-simple.js

# Test GEPIR (when available)
node test-gepir-lookup.js

# Test OpenCorporates (when available)
node test-opencorporates.js
```

## Current Status

- ✅ **SerpAPI**: Ready to implement (add API key)
- ⏳ **GEPIR**: Waiting for API approval
- ⏳ **OpenCorporates**: Waiting for API approval

## Fallback Behavior

The system gracefully handles missing APIs:
- If SerpAPI is missing: Falls back to basic web search
- If GEPIR is missing: Uses mock data for testing
- If OpenCorporates is missing: Uses existing web research

## Cost Optimization

**Recommended order of implementation**:
1. **GEPIR** (free) - Immediate company identification
2. **OpenCorporates** (free tier) - Better corporate research
3. **SerpAPI** (paid) - Best product resolution (if budget allows) 
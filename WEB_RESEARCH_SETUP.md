# Web Research Setup Guide

This guide explains how to set up the `WebResearchAgent` to perform actual web research for corporate ownership information.

## Overview

The `WebResearchAgent` provides real-time web research capabilities by:
- **Google Custom Search API** - For finding relevant web pages
- **Website Scraping** - For extracting ownership information from company websites
- **OpenCorporates API** - For business database lookups
- **Intelligent Filtering** - For identifying relevant sources

## Required API Keys

### 1. Google Custom Search API

**Step 1: Get Google API Key**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the "Custom Search API"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy the API key

**Step 2: Create Custom Search Engine**
1. Go to [Google Custom Search](https://cse.google.com/cse/)
2. Click "Add" to create a new search engine
3. Enter any site (e.g., `www.google.com`) - you can modify this later
4. Get your Search Engine ID (cx parameter)

**Step 3: Configure Search Engine**
1. Edit your search engine
2. Under "Sites to search", add:
   - `wikipedia.org`
   - `linkedin.com`
   - `crunchbase.com`
   - `opencorporates.com`
   - `bloomberg.com`
   - `reuters.com`
   - `sec.gov`
3. Save changes

### 2. OpenCorporates API (Optional)

**Step 1: Get API Key**
1. Go to [OpenCorporates](https://opencorporates.com/api)
2. Sign up for an account
3. Request an API key
4. Copy the API key

## Environment Configuration

Add the following to your `.env.local` file:

```bash
# Google Custom Search API
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_CSE_ID=your_search_engine_id_here

# OpenCorporates API (optional)
OPENCORPORATES_API_KEY=your_opencorporates_key_here
```

## How It Works

### 1. Web Search Process
```javascript
// The agent performs multiple searches:
const searchQueries = [
  `${brand} company ownership parent company`,
  `${brand} corporate structure`,
  `${brand} about us company information`,
  `${brand} subsidiary parent company`,
  `${product_name} ${brand} ownership`
]
```

### 2. Website Scraping
The agent automatically scrapes relevant websites that contain ownership information:
- Company "About Us" pages
- Wikipedia articles
- Business database pages
- Corporate structure pages

### 3. Business Database Lookups
- **OpenCorporates**: Corporate registration data
- **Future**: Bloomberg, Crunchbase, SEC EDGAR

### 4. Integration with AI Analysis
The web research data is fed to the AI agent, which:
- Analyzes the scraped content
- Extracts ownership information
- Provides confidence scores based on source quality
- Prevents hallucinations by requiring real sources

## Testing the Setup

Run the web research test:

```bash
node test-web-research-integration.ts
```

You should see:
```
✅ Web research available: true
✅ Web research was successfully integrated
✅ Used X web sources
```

## Cost Considerations

### Google Custom Search API
- **Free tier**: 100 searches/day
- **Paid tier**: $5 per 1000 searches
- **Recommendation**: Start with free tier, upgrade as needed

### OpenCorporates API
- **Free tier**: 1000 requests/month
- **Paid tier**: Varies by plan
- **Recommendation**: Free tier is sufficient for testing

## Troubleshooting

### Common Issues

**1. "Google API keys not configured"**
- Check that `GOOGLE_API_KEY` and `GOOGLE_CSE_ID` are set in `.env.local`
- Verify the API key is valid and has Custom Search API enabled

**2. "No search results found"**
- Check your Custom Search Engine configuration
- Ensure the sites you want to search are added to the search engine
- Verify the search engine is set to search the entire web, not just specific sites

**3. "Website scraping failed"**
- Some websites block automated requests
- The agent will gracefully handle this and continue with other sources
- This is normal behavior

**4. "Rate limit exceeded"**
- Google API has rate limits
- Implement caching if you're making many requests
- Consider upgrading to paid tier

### Debug Mode

Enable debug logging by checking the console output:
```
[WebResearchAgent] Starting web research for: { brand: 'TestBrand', ... }
[WebResearchAgent] Found X unique search results
[WebResearchAgent] Scraping X relevant websites
```

## Advanced Configuration

### Custom Search Engine Settings

You can customize your search engine to focus on specific types of sites:

**Business-focused search engine:**
- `linkedin.com/company`
- `crunchbase.com`
- `bloomberg.com`
- `reuters.com`
- `sec.gov`

**General corporate research:**
- `wikipedia.org`
- `opencorporates.com`
- `company.com`
- `corporate.com`

### Rate Limiting

The agent includes built-in rate limiting:
- Maximum 5 websites scraped per research request
- 10-second timeout per website
- Graceful error handling for failed requests

## Security Considerations

1. **API Key Security**: Never commit API keys to version control
2. **Rate Limiting**: Respect API rate limits to avoid costs
3. **User Agent**: The agent uses a proper User-Agent string for web scraping
4. **Error Handling**: All external requests are wrapped in try-catch blocks

## Future Enhancements

Potential improvements:
- **Caching**: Cache search results to reduce API calls
- **More APIs**: Add Bloomberg, Crunchbase, SEC EDGAR APIs
- **Better Scraping**: Use headless browsers for JavaScript-heavy sites
- **Source Validation**: Verify website authenticity
- **Machine Learning**: Train models to extract ownership information

## Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify your API keys are correct
3. Test with the provided test scripts
4. Check API quotas and rate limits 
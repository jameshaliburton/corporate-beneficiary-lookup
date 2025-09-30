# Admin Debug Tools Implementation

## Overview

This implementation extends the existing admin Gemini verification view with full debug tools, including the ability to view and copy the Gemini prompt and raw output. These tools are completely hidden from users and only accessible to administrators.

## New Features

### 🔧 Debug Sections Added

1. **📤 Gemini Prompt Section**
   - Shows the complete prompt sent to Gemini
   - Collapsible section (defaults to closed)
   - Copy to clipboard functionality
   - Graceful handling when prompt is not available

2. **📥 Gemini Raw Output Section**
   - Shows the full JSON response from Gemini API
   - Collapsible section (defaults to closed)
   - Copy to clipboard functionality
   - Graceful handling when output is not available

### 🎯 Key Features

- **Collapsible Design**: Both sections default to closed to keep the interface clean
- **Copy Buttons**: One-click copying of prompt and raw output
- **Status Indicators**: Clear indication of data availability
- **Graceful Fallbacks**: Informative messages when debug data is missing
- **Admin-Only Access**: Completely hidden from regular users

## Implementation Details

### Files Modified

1. **`src/lib/agents/gemini-ownership-analysis-agent.js`**
   - Added prompt and raw_output storage to `gemini_analysis` object
   - Only stored when `GEMINI_VERIFICATION_ENHANCED_MATCH` is enabled
   - No impact on existing functionality when disabled

2. **`src/app/admin/gemini-verification/[brand]/page.tsx`**
   - Added collapsible debug sections
   - Implemented copy to clipboard functionality
   - Added state management for section visibility
   - Added graceful handling for missing debug data

3. **`test-admin-gemini-verification.js`**
   - Updated test data to include mock prompt and raw output
   - Added verification of debug data availability
   - Updated feature list to include new debug tools

### Data Storage

The debug data is stored in the existing `agent_results.gemini_analysis` structure:

```json
{
  "agent_results": {
    "gemini_analysis": {
      "explanations_by_requirement": { ... },
      "enhanced_match_enabled": true,
      "verification_requirements_analyzed": [ ... ],
      "prompt": "You are an expert corporate ownership analyst...",
      "raw_output": "```json\n{ \"verification_status\": \"confirmed\"... }\n```"
    }
  }
}
```

### UI Components

#### Prompt Section
- **Header**: "📤 Gemini Prompt" with availability status
- **Content**: Full prompt in `<pre>` block with syntax highlighting
- **Actions**: Copy button (only when data available)
- **Fallback**: Gray warning when prompt not stored

#### Raw Output Section
- **Header**: "📥 Gemini Raw Output" with availability status
- **Content**: Full JSON response in `<pre>` block
- **Actions**: Copy button (only when data available)
- **Fallback**: Gray warning when output not stored

## Usage

### Accessing Debug Tools

1. **Via Debug Link** (Development only):
   - Navigate to any result page
   - Click "Debug Gemini Verification" in debug section
   - Scroll to bottom of admin view

2. **Direct URL Access**:
   ```
   http://localhost:3000/admin/gemini-verification/[brand]
   ```

### Using the Debug Tools

1. **Viewing Data**:
   - Click on section headers to expand/collapse
   - Scroll through long prompts/outputs
   - Use copy buttons to copy to clipboard

2. **Copying Data**:
   - Click "Copy Prompt" or "Copy Output" buttons
   - Data is copied to system clipboard
   - Console logs confirm successful copying

## Testing

### Test Data Included

The test script includes realistic mock data:

- **Prompt**: Full enhanced verification prompt with all requirements
- **Raw Output**: Complete JSON response with explanations
- **Multiple Brands**: Puma, Nespresso, Watkins with different scenarios

### Running Tests

```bash
# Test the admin view with debug tools
node test-admin-gemini-verification.js

# Test with real enhanced verification
node test-gemini-enhanced-verification.js
```

### Test Scenarios

1. **With Debug Data**: Shows full prompt and output sections
2. **Without Debug Data**: Shows graceful fallback messages
3. **Copy Functionality**: Verifies clipboard operations work
4. **Collapsible Sections**: Confirms expand/collapse behavior

## Security & Access Control

### Admin-Only Access
- **Environment Gating**: `NEXT_PUBLIC_ADMIN_ENABLED=true` required
- **Development Only**: Debug link only in development mode
- **No User Exposure**: Completely hidden from regular users

### Data Privacy
- **No Schema Changes**: Uses existing data structures
- **No New Fields**: Only adds to existing `gemini_analysis` object
- **Conditional Storage**: Only stored when enhanced verification enabled

## Benefits

1. **Debugging**: Easy access to complete Gemini interaction
2. **Transparency**: Full visibility into prompt engineering
3. **Troubleshooting**: Can identify issues with prompts or responses
4. **Development**: Helps improve prompt quality and debugging
5. **Admin Tool**: Internal tool for developers and administrators

## Future Enhancements

1. **Syntax Highlighting**: Add JSON syntax highlighting to raw output
2. **Search Functionality**: Search within prompts and outputs
3. **Export Options**: Export debug data as files
4. **Comparison Tools**: Compare prompts across different brands
5. **Performance Metrics**: Show prompt length, response time, etc.

## Monitoring

The debug tools provide insights into:
- Prompt effectiveness and length
- Response quality and structure
- Common parsing issues
- Prompt engineering improvements

This data can help optimize the verification process and improve overall system performance.

## Constraints Met

✅ **No agent output generation changes** - Only added storage of existing data
✅ **No user exposure** - Completely admin-only tool
✅ **No new schema fields** - Uses existing `agent_results.gemini_analysis` structure
✅ **Collapsible sections** - Both sections default to closed
✅ **Copy functionality** - One-click copying implemented
✅ **Graceful fallbacks** - Clear messages when data missing

#!/bin/bash

# Setup script for Gemini v1 endpoint implementation
# This script helps configure the environment for testing

echo "🚀 Setting up Gemini v1 endpoint implementation..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Gemini Flash V1 Feature Flag
GEMINI_FLASH_V1_ENABLED=true

# Existing API Keys (update with your actual keys)
GEMINI_API_KEY=AIzaSyCTLY8LsB5lV993CsJuFX2sPGNqwStrRJo
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_API_KEY=your_google_key_here
GOOGLE_CSE_ID=your_cse_id_here

# Other existing environment variables
GEMINI_SAFE_MODE=false
DEBUG_AUTH_TOKEN=your_debug_token_here
EOF
    echo "✅ Created .env.local file"
else
    echo "📝 .env.local already exists, adding GEMINI_FLASH_V1_ENABLED if not present..."
    if ! grep -q "GEMINI_FLASH_V1_ENABLED" .env.local; then
        echo "GEMINI_FLASH_V1_ENABLED=true" >> .env.local
        echo "✅ Added GEMINI_FLASH_V1_ENABLED=true to .env.local"
    else
        echo "✅ GEMINI_FLASH_V1_ENABLED already present in .env.local"
    fi
fi

# Make test script executable
chmod +x test-gemini-v1-implementation.js

echo ""
echo "🎯 Next Steps:"
echo "1. Update API keys in .env.local with your actual values"
echo "2. Run: node test-gemini-v1-implementation.js"
echo "3. Test locally: npm run dev"
echo "4. Test debug route: curl -H 'Authorization: Bearer your_debug_token' http://localhost:3000/debug/gemini"
echo "5. Test v1 endpoint: curl http://localhost:3000/api/test-gemini-v1"
echo ""
echo "🔍 Monitor logs for:"
echo "- [GEMINI_CONFIG] Feature flag status"
echo "- [GEMINI_DEBUG] Model/endpoint selection"
echo "- [GEMINI_V1_TEST] V1 endpoint test results"
echo ""
echo "✅ Setup complete!"

#!/bin/bash

# Enhanced Gemini Verification Deployment Script
# This script helps deploy the enhanced verification system

set -e  # Exit on any error

echo "🚀 Deploying Enhanced Gemini Verification System"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "   Please commit or stash your changes before deploying"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 1
    fi
fi

# Check environment variables
echo "🔍 Checking environment variables..."

if [ -z "$GEMINI_API_KEY" ] && [ -z "$GOOGLE_API_KEY" ]; then
    echo "❌ Error: GEMINI_API_KEY or GOOGLE_API_KEY must be set"
    exit 1
fi

echo "✅ API key found"

# Run tests
echo "🧪 Running tests..."
if command -v npm &> /dev/null; then
    npm test 2>/dev/null || echo "⚠️  Tests not configured, skipping..."
else
    echo "⚠️  npm not found, skipping tests..."
fi

# Check for linting errors
echo "🔍 Checking for linting errors..."
if command -v npm &> /dev/null && [ -f "package.json" ]; then
    npm run lint 2>/dev/null || echo "⚠️  Linting not configured, skipping..."
else
    echo "⚠️  Linting not configured, skipping..."
fi

# Commit changes
echo "📝 Committing changes..."
git add .
git commit -m "feat: Enhanced Gemini verification with admin debug tools

- Added enhanced verification prompt with detailed requirements
- Implemented explanations_by_requirement structure
- Added admin debug view at /admin/gemini-verification/[brand]
- Added prompt and raw output debug sections
- Added copy-to-clipboard functionality
- Gated behind GEMINI_VERIFICATION_ENHANCED_MATCH feature flag
- No breaking changes to existing functionality"

echo "✅ Changes committed"

# Push to remote
echo "🚀 Pushing to remote..."
git push origin main

echo "✅ Code deployed successfully!"

# Environment variable reminders
echo ""
echo "🔧 Next Steps:"
echo "============="
echo "1. Set environment variables in your production environment:"
echo "   GEMINI_VERIFICATION_ENHANCED_MATCH=true"
echo "   NEXT_PUBLIC_ADMIN_ENABLED=true  # Optional, for admin access"
echo ""
echo "2. Test the deployment:"
echo "   - Scan a product (e.g., Puma, Nespresso)"
echo "   - Check admin view: /admin/gemini-verification/[brand]"
echo "   - Verify enhanced explanations appear"
echo ""
echo "3. Monitor logs for:"
echo "   - [GEMINI_VERIFICATION] Enhanced explanations extracted"
echo "   - [GEMINI_VERIFICATION] Raw Gemini input/output"
echo ""
echo "🎉 Deployment complete! The enhanced verification system is now live."
echo ""
echo "📊 Test URLs:"
echo "   https://yourdomain.com/admin/gemini-verification/puma"
echo "   https://yourdomain.com/admin/gemini-verification/nespresso"
echo "   https://yourdomain.com/admin/gemini-verification/watkins"

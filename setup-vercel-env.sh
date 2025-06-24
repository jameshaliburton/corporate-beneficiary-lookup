#!/bin/bash

echo "Setting up Vercel environment variables..."

# Read values from .env.local
source .env.local

# Set environment variables in Vercel
echo "Setting NEXT_PUBLIC_SUPABASE_URL..."
echo "$NEXT_PUBLIC_SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production

echo "Setting NEXT_PUBLIC_SUPABASE_ANON_KEY..."
echo "$NEXT_PUBLIC_SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

echo "Setting ANTHROPIC_API_KEY..."
echo "$ANTHROPIC_API_KEY" | vercel env add ANTHROPIC_API_KEY production

echo "Setting NEXT_PUBLIC_GOOGLE_API_KEY..."
echo "$NEXT_PUBLIC_GOOGLE_API_KEY" | vercel env add NEXT_PUBLIC_GOOGLE_API_KEY production

echo "Setting NEXT_PUBLIC_GOOGLE_CSE_ID..."
echo "$NEXT_PUBLIC_GOOGLE_CSE_ID" | vercel env add NEXT_PUBLIC_GOOGLE_CSE_ID production

echo "Setting OPENCORPORATES_API_KEY..."
echo "$OPENCORPORATES_API_KEY" | vercel env add OPENCORPORATES_API_KEY production

echo "Environment variables set successfully!" 
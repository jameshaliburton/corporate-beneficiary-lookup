# 🧪 Staging Environment Setup Guide

This guide explains how to set up and use the staging environment for safe testing.

## 🎯 Overview

The staging environment provides:
- **Isolated testing** without affecting production data
- **Visible staging banner** to prevent confusion
- **Database write protection** (disabled by default)
- **Separate environment detection** for conditional behavior
- **Analytics disabled** to avoid polluting production metrics

## ⚙️ Vercel Configuration

### 1. DNS Setup
Add a CNAME record in your DNS provider:
```
Type: CNAME
Name: staging
Value: cname.vercel-dns.com
TTL: 3600
```

### 2. Vercel Domain Configuration
1. Go to Vercel → Your Project → Settings → Domains
2. Click "Add" and enter `staging.ownedby.ai`
3. Assign it to the `staging` branch
4. Wait for DNS propagation (may take a few minutes)

### 3. Environment Variables
Set these in Vercel for the **staging** environment:

```bash
# Environment identifier
NEXT_PUBLIC_ENVIRONMENT=staging

# Database write control (IMPORTANT!)
STAGING_ALLOW_DB_WRITES=false  # Keep false to protect production DB

# API Keys (consider using test keys)
ANTHROPIC_API_KEY=your_staging_key_here
GEMINI_API_KEY=your_staging_key_here

# Supabase (ideally use a separate staging project)
NEXT_PUBLIC_SUPABASE_URL=your_staging_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_staging_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_staging_service_role_key

# Feature Flags (can differ from production)
ENABLE_GEMINI_OWNERSHIP_AGENT=false
ENABLE_DISAMBIGUATION_AGENT=false
ENABLE_AGENT_REPORTS=true
ENABLE_PIPELINE_LOGGING=true
```

## 🚀 Deployment

### Push to staging
```bash
# Make sure you're on the staging branch
git checkout staging

# Commit your changes
git add .
git commit -m "feat: add staging feature"

# Push to remote staging branch
git push origin staging
```

Vercel will automatically deploy to `staging.ownedby.ai`.

## 🧪 Testing Locally as Staging

To test staging mode locally:

1. Create `.env.local` with:
```bash
NEXT_PUBLIC_ENVIRONMENT=staging
STAGING_ALLOW_DB_WRITES=false
```

2. Start dev server:
```bash
npm run dev
```

3. You should see:
   - 🧪 Yellow staging banner at top
   - Console logs: `[STAGING MODE]`
   - Database writes skipped

## 🛡️ Safety Features

### Automatic Database Protection
When `shouldWriteToDatabase` is `false` (default in staging):
- `saveToCache()` returns early
- `saveToNewCache()` returns early  
- Console logs: `🧪 [STAGING MODE] Skipping database write`

### Override (Use Carefully!)
To allow database writes in staging (not recommended):
```bash
STAGING_ALLOW_DB_WRITES=true
```

### Analytics Disabled
Staging environment automatically:
- Skips Google Analytics events
- Skips Umami tracking
- Prevents pollution of production metrics

## 📊 Staging vs Production

| Feature | Staging | Production |
|---------|---------|------------|
| Domain | `staging.ownedby.ai` | `ownedby.ai` |
| Banner | 🧪 Yellow "STAGING" | None |
| DB Writes | Disabled by default | Enabled |
| Analytics | Disabled | Enabled |
| Debug Logs | Verbose | Minimal |
| Feature Flags | Can differ | Production config |

## 🔍 Environment Detection

The app detects staging in 3 ways:

1. **Environment variable**: `NEXT_PUBLIC_ENVIRONMENT=staging`
2. **Domain check**: `window.location.hostname === 'staging.ownedby.ai'`
3. **Manual flag**: Can be set programmatically

See `src/lib/utils/environment.ts` for implementation.

## ✅ Verification

After deployment, verify:

1. Visit `https://staging.ownedby.ai`
2. Check for yellow staging banner at top
3. Open browser console
4. Look for: `🧪 [STAGING MODE] Running in staging environment`
5. Test a brand search
6. Confirm: `🧪 [STAGING MODE] Skipping database write`

## 🎯 Best Practices

1. **Always test in staging first** before pushing to production
2. **Keep database writes disabled** unless absolutely necessary
3. **Use separate API keys** for staging (lower rate limits)
4. **Document any staging-specific behavior** in code comments
5. **Clean up test data** if you enable database writes

## 🔄 Merging to Production

When ready to deploy to production:

```bash
# Switch to main branch
git checkout main

# Merge staging (or cherry-pick specific commits)
git merge staging

# Push to production
git push origin main
```

Vercel will automatically deploy to `ownedby.ai`.

## 🐛 Troubleshooting

### Staging banner not showing
- Check `NEXT_PUBLIC_ENVIRONMENT` is set to `staging` in Vercel
- Clear browser cache and hard refresh
- Check browser console for environment logs

### Database writes happening in staging
- Verify `STAGING_ALLOW_DB_WRITES` is `false` or unset
- Check console for `[STAGING MODE] Skipping database write` logs
- Review `src/app/api/lookup/route.ts` for proper safeguards

### Domain not resolving
- Wait 5-10 minutes for DNS propagation
- Verify CNAME record is correct in DNS provider
- Check Vercel domain configuration

## 📝 Notes

- Staging uses the same codebase as production
- Only environment variables and feature flags differ
- Staging branch should be kept up-to-date with main
- Consider using a separate Supabase project for true isolation


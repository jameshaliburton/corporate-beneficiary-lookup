#!/bin/bash

# Restore files from stable commit
# Usage: ./scripts/restore-from-stable.sh <commit-sha> <path1> <path2> ...

set -e

if [ $# -lt 2 ]; then
    echo "Usage: $0 <commit-sha> <path1> <path2> ..."
    echo "Example: $0 c40bb66 src/app/api/lookup/route.ts"
    exit 1
fi

STABLE_SHA=$1
shift

echo "🔍 Checking out files from commit: $STABLE_SHA"
echo "📁 Files to restore: $@"
echo ""

# Validate commit exists
if ! git rev-parse --verify $STABLE_SHA >/dev/null 2>&1; then
    echo "❌ Error: Commit $STABLE_SHA does not exist"
    exit 1
fi

echo "✅ Commit $STABLE_SHA found"
echo ""

# Show what would be restored
echo "📋 Files that would be restored:"
for path in "$@"; do
    if git show $STABLE_SHA:$path >/dev/null 2>&1; then
        echo "  ✅ $path (exists in $STABLE_SHA)"
    else
        echo "  ❌ $path (not found in $STABLE_SHA)"
    fi
done

echo ""
echo "⚠️  This will overwrite current files with versions from $STABLE_SHA"
echo ""

read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

echo ""
echo "🔄 Restoring files..."

# Restore each file
for path in "$@"; do
    if git show $STABLE_SHA:$path >/dev/null 2>&1; then
        echo "  📥 Restoring $path..."
        git checkout $STABLE_SHA -- "$path"
        echo "  ✅ Restored $path"
    else
        echo "  ⚠️  Skipping $path (not found in $STABLE_SHA)"
    fi
done

echo ""
echo "🎉 Restoration complete!"
echo ""
echo "Next steps:"
echo "1. Check the restored files: git status"
echo "2. Test the application: npm run dev"
echo "3. Commit the changes: git add . && git commit -m 'Restore files from $STABLE_SHA'"

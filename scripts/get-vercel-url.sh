#!/bin/bash

# Get Vercel preview URL for current branch
# Usage: ./scripts/get-vercel-url.sh

# Get the current branch name
BRANCH=$(git branch --show-current)

# Sanitize branch name for Vercel (lowercase, replace / with -)
SANITIZED_BRANCH=$(echo "$BRANCH" | tr '[:upper:]' '[:lower:]' | tr '/' '-')

# Get GitHub username from remote
USERNAME=$(git remote get-url origin | sed 's|.*/\([^/]*\)/.*|\1|')

# Get repo name
REPO=$(git remote get-url origin | sed 's|.*/||' | sed 's|.git$||')

# Construct the Vercel preview URL
PREVIEW_URL="https://${REPO}-git-${SANITIZED_BRANCH}-${USERNAME}.vercel.app"

# Also construct the simplified URL (sometimes Vercel uses this)
SIMPLE_URL="https://${REPO}-${SANITIZED_BRANCH}.vercel.app"

# Display the URLs
echo ""
echo "🚀 Vercel Preview URLs for branch: $BRANCH"
echo ""
echo "⚠️  Note: Vercel may use deployment-specific URLs instead of git branch URLs."
echo "   Check your Vercel dashboard for the actual URL if these don't work."
echo ""
echo "Git-based URL (pattern 1):"
echo "  $PREVIEW_URL"
echo ""
echo "Simplified URL (pattern 2):"
echo "  $SIMPLE_URL"
echo ""
echo "Production URL:"
echo "  https://${REPO}-${USERNAME}.vercel.app"
echo ""
echo "💡 Tip: Check https://vercel.com/dashboard for deployment-specific URLs"
echo ""

# Try to open in browser if on macOS/Linux with xdg-open
if command -v xdg-open &> /dev/null; then
    read -p "Open preview URL in browser? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open "$PREVIEW_URL"
    fi
elif command -v open &> /dev/null; then
    read -p "Open preview URL in browser? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$PREVIEW_URL"
    fi
fi

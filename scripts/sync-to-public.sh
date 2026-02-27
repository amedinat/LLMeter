#!/bin/bash
# sync-to-public.sh
# Syncs LLMeter-pro (private) → LLMeter (public)
# Excludes sensitive docs and premium features
#
# Usage: Run from the LLMeter-pro repo root
#   bash scripts/sync-to-public.sh

set -euo pipefail

# Files/dirs to EXCLUDE from public repo
EXCLUDE_PATTERNS=(
  "docs/strategy/"
  "docs/security/"
  "docs/SECURITY-AUDIT.md"
  "docs/QA-AUDIT.md"
  "docs/TASKS_BACKEND.md"
  "docs/TASKS_FRONTEND.md"
  "docs/PLAN.md"
  "docs/USER-STORIES.md"
  "scripts/sync-to-public.sh"
  # Add premium feature paths here as they're created:
  # "src/features/premium/"
)

CURRENT_BRANCH=$(git branch --show-current)

echo "=== LLMeter Sync: pro → public ==="
echo "Branch: $CURRENT_BRANCH"
echo ""

# Ensure we have both remotes
if ! git remote | grep -q "^origin$"; then
  echo "ERROR: 'origin' remote not found (should be LLMeter-pro)"
  exit 1
fi

if ! git remote | grep -q "^public$"; then
  echo "Adding 'public' remote for LLMeter..."
  git remote add public https://github.com/amedinat/LLMeter.git
fi

# Push current branch to public, excluding nothing at git level
# (exclusions are handled by .gitignore or separate branch)
echo "Pushing $CURRENT_BRANCH to public repo..."
git push public "$CURRENT_BRANCH" 2>&1

echo ""
echo "✓ Sync complete. Verify at: https://github.com/amedinat/LLMeter"

#!/bin/bash

# =====================================================
# IP-NEXUS ROLLBACK SCRIPT
# Usage: ./scripts/rollback.sh [commit_hash]
# =====================================================

set -e

COMMIT=${1:-"HEAD~1"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "⏮️ Rolling back IP-NEXUS to $COMMIT..."

cd "$PROJECT_DIR"

# Get current commit for reference
CURRENT_COMMIT=$(git rev-parse HEAD)
echo "📍 Current commit: $CURRENT_COMMIT"

# Checkout the target commit
echo "🔄 Checking out $COMMIT..."
git checkout "$COMMIT"

# Rebuild and deploy
echo "🚀 Redeploying..."
./scripts/deploy.sh

echo ""
echo "✅ Rollback completed!"
echo "📍 Rolled back from: $CURRENT_COMMIT"
echo "📍 Rolled back to: $(git rev-parse HEAD)"
echo ""
echo "⚠️ To return to latest: git checkout main && ./scripts/deploy.sh"

#!/bin/bash

# =====================================================
# IP-NEXUS DEPLOYMENT SCRIPT
# Usage: ./scripts/deploy.sh [environment]
# =====================================================

set -e

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting IP-NEXUS deployment to $ENVIRONMENT..."
echo "📁 Project directory: $PROJECT_DIR"

cd "$PROJECT_DIR"

# Load environment variables
ENV_FILE=".env.$ENVIRONMENT"
if [ -f "$ENV_FILE" ]; then
    echo "📄 Loading environment from $ENV_FILE"
    export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
else
    echo "⚠️ Warning: $ENV_FILE not found, using .env"
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
fi

# Validate required variables
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "   Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY"
    exit 1
fi

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Build Docker image
echo "🐳 Building Docker image..."
docker-compose -f docker-compose.yml build --no-cache

# Stop old containers gracefully
echo "⏹️ Stopping old containers..."
docker-compose -f docker-compose.yml down --remove-orphans || true

# Start new containers
echo "▶️ Starting new containers..."
docker-compose -f docker-compose.yml up -d

# Wait for containers to be ready
echo "⏳ Waiting for containers to be ready..."
sleep 15

# Health check
echo "🏥 Running health check..."
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ Health check passed!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   Retry $RETRY_COUNT/$MAX_RETRIES..."
    sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Deployment failed - health check failed after $MAX_RETRIES retries"
    echo "📋 Container logs:"
    docker-compose -f docker-compose.yml logs --tail=50
    exit 1
fi

# Clean up old Docker resources
echo "🧹 Cleaning up old Docker resources..."
docker image prune -f
docker volume prune -f

# Show running containers
echo "📦 Running containers:"
docker-compose -f docker-compose.yml ps

echo ""
echo "🎉 IP-NEXUS deployed successfully to $ENVIRONMENT!"
echo "🌐 Application URL: ${VITE_APP_URL:-http://localhost:3000}"

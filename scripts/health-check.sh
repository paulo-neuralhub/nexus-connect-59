#!/bin/bash

# =====================================================
# IP-NEXUS HEALTH CHECK SCRIPT
# Usage: ./scripts/health-check.sh [url]
# =====================================================

set -e

URL=${1:-"http://localhost:3000"}

echo "🏥 Running health checks for IP-NEXUS..."
echo "🌐 Target URL: $URL"
echo ""

# Function to check endpoint
check_endpoint() {
    local endpoint=$1
    local expected_status=${2:-200}
    local description=$3
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$URL$endpoint" 2>/dev/null || echo "000")
    
    if [ "$response" == "$expected_status" ]; then
        echo "✅ $description: $endpoint ($response)"
        return 0
    else
        echo "❌ $description: $endpoint (Expected: $expected_status, Got: $response)"
        return 1
    fi
}

FAILED=0

# Health endpoint
check_endpoint "/health" "200" "Health endpoint" || FAILED=$((FAILED + 1))

# Main page
check_endpoint "/" "200" "Main page" || FAILED=$((FAILED + 1))

# Static assets (check if Vite build exists)
check_endpoint "/assets/" "301" "Static assets" || true

# Check container status
echo ""
echo "🐳 Docker container status:"
docker ps --filter "name=ip-nexus" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "   Docker not available or no containers running"

# Check disk space
echo ""
echo "💾 Disk usage:"
df -h / | tail -1

# Check memory
echo ""
echo "🧠 Memory usage:"
free -h 2>/dev/null || echo "   Memory info not available"

# Summary
echo ""
if [ $FAILED -eq 0 ]; then
    echo "🎉 All health checks passed!"
    exit 0
else
    echo "⚠️ $FAILED health check(s) failed"
    exit 1
fi

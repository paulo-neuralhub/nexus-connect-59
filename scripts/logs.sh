#!/bin/bash

# =====================================================
# IP-NEXUS LOGS VIEWER
# Usage: ./scripts/logs.sh [service] [lines]
# =====================================================

SERVICE=${1:-"web"}
LINES=${2:-100}

echo "📋 Viewing logs for $SERVICE (last $LINES lines)..."
echo ""

if [ -f "docker-compose.prod.yml" ]; then
    docker-compose -f docker-compose.prod.yml logs --tail=$LINES -f $SERVICE
else
    docker-compose logs --tail=$LINES -f $SERVICE
fi

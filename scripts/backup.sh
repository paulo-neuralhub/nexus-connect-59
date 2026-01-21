#!/bin/bash

# =====================================================
# IP-NEXUS BACKUP SCRIPT
# Usage: ./scripts/backup.sh [backup_dir]
# =====================================================

set -e

BACKUP_DIR=${1:-"/backups/ip-nexus"}
DATE=$(date +%Y%m%d_%H%M%S)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "📦 Starting IP-NEXUS backup..."
echo "📁 Backup directory: $BACKUP_DIR"
echo "📅 Timestamp: $DATE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup configuration files
echo "⚙️ Backing up configuration..."
CONFIG_BACKUP="$BACKUP_DIR/config_$DATE.tar.gz"
tar -czf "$CONFIG_BACKUP" \
    -C "$PROJECT_DIR" \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=.git \
    --exclude='*.log' \
    .env* \
    docker-compose*.yml \
    nginx*.conf \
    Dockerfile* \
    traefik/ 2>/dev/null || true

echo "✅ Configuration backed up: $CONFIG_BACKUP"

# Backup Docker volumes (if any)
echo "🐳 Backing up Docker volumes..."
VOLUMES_BACKUP="$BACKUP_DIR/volumes_$DATE.tar.gz"
if docker volume ls -q | grep -q "ip-nexus"; then
    docker run --rm \
        -v ip-nexus-data:/data:ro \
        -v "$BACKUP_DIR":/backup \
        alpine tar -czf "/backup/volumes_$DATE.tar.gz" -C /data . 2>/dev/null || echo "   No volumes to backup"
fi

# Create backup manifest
echo "📋 Creating backup manifest..."
cat > "$BACKUP_DIR/manifest_$DATE.json" << EOF
{
  "timestamp": "$DATE",
  "backup_type": "full",
  "files": [
    "config_$DATE.tar.gz",
    "volumes_$DATE.tar.gz"
  ],
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "docker_version": "$(docker --version 2>/dev/null || echo 'unknown')"
}
EOF

# Clean old backups (keep last 7 days)
echo "🧹 Cleaning old backups (keeping last 7 days)..."
find "$BACKUP_DIR" -type f -mtime +7 -delete 2>/dev/null || true

# List backups
echo ""
echo "📁 Current backups:"
ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "   No backups found"

echo ""
echo "✅ Backup completed successfully!"
echo "📦 Backup location: $BACKUP_DIR"

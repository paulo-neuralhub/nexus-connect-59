#!/bin/sh

# =====================================================
# IP-NEXUS DOCKER ENTRYPOINT
# Inject environment variables at runtime
# =====================================================

set -e

echo "🚀 IP-NEXUS Container Starting..."

# Create runtime environment config
cat <<EOF > /usr/share/nginx/html/env-config.js
// Runtime environment configuration
// Generated at container start: $(date -Iseconds)
window.ENV = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL:-}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY:-}",
  VITE_APP_URL: "${VITE_APP_URL:-}",
  VITE_ENABLE_ANALYTICS: "${VITE_ENABLE_ANALYTICS:-true}",
  BUILD_TIME: "$(date -Iseconds)",
  VERSION: "${APP_VERSION:-unknown}"
};
EOF

echo "✅ Environment config generated"

# Inject env-config.js script into index.html if not already present
if ! grep -q "env-config.js" /usr/share/nginx/html/index.html; then
    sed -i 's|</head>|<script src="/env-config.js"></script></head>|' /usr/share/nginx/html/index.html
    echo "✅ env-config.js injected into index.html"
fi

echo "🎉 Container ready!"

# Execute original command
exec "$@"

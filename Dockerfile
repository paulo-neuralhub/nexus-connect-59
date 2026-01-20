# ==========================================
# IP-NEXUS PRODUCTION DOCKERFILE
# Multi-stage build for optimized production image
# ==========================================

# ==========================================
# BASE IMAGE
# ==========================================
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat openssl curl

WORKDIR /app

# ==========================================
# DEPENDENCIES STAGE
# ==========================================
FROM base AS deps

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (using npm since project uses package-lock.json)
RUN npm ci --only=production --ignore-scripts

# Install all dependencies for build
FROM base AS deps-all

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ==========================================
# BUILDER STAGE
# ==========================================
FROM base AS builder

WORKDIR /app

# Copy all dependencies
COPY --from=deps-all /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_URL

# Set environment variables for build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_APP_URL=$VITE_APP_URL

# Build the application
RUN npm run build

# ==========================================
# RUNNER STAGE (Production)
# ==========================================
FROM nginx:alpine AS runner

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Security: Remove default nginx configs
RUN rm -rf /etc/nginx/conf.d/default.conf

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

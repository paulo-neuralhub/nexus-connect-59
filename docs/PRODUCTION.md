# IP-NEXUS Production Configuration

## Quick Deploy

```bash
# 1. Copy environment file
cp .env.example .env.production

# 2. Edit with your values
nano .env.production

# 3. Deploy
chmod +x scripts/*.sh
./scripts/deploy.sh production
```

## Docker Commands

```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Restart
docker-compose restart
```

## Development

```bash
# Start dev environment
docker-compose -f docker-compose.dev.yml up

# Or without Docker
npm run dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `scripts/deploy.sh` | Full deployment |
| `scripts/backup.sh` | Backup configuration |
| `scripts/rollback.sh` | Rollback to previous version |
| `scripts/health-check.sh` | Run health checks |

## SSL Certificates

SSL is handled automatically by Traefik with Let's Encrypt.

**Requirements:**
- Domain pointing to server IP
- Ports 80 and 443 open
- Valid email in `SSL_EMAIL`

## Monitoring

Health endpoint: `GET /health`

```bash
curl https://your-domain.com/health
# Returns: OK
```

## Troubleshooting

**Container won't start:**
```bash
docker-compose logs web
```

**SSL issues:**
```bash
docker-compose logs traefik
cat traefik/acme.json
```

**Health check fails:**
```bash
./scripts/health-check.sh http://localhost:3000
```

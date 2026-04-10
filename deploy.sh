#!/usr/bin/env bash
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
REMOTE_USER="tikker"
REMOTE_HOST="192.168.2.47"
REMOTE_DIR="/volume1/docker/data-proxy"

# ── Upload files (exclude what Docker builds itself) ──────────────────────────
echo "📤 Uploading files to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR} ..."
rsync -avz --progress \
  --exclude 'node_modules/' \
  --exclude 'data/' \
  --exclude '.env.example' \
  --exclude '*.log' \
  src package.json package-lock.json Dockerfile docker-compose.yml .env \
  "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

# ── Build & restart on the NAS ────────────────────────────────────────────────
echo "🐳 Building and starting container on NAS ..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" bash -s << EOF
  set -e
  cd "${REMOTE_DIR}"
sudo /usr/local/bin/docker compose pull --quiet 2>/dev/null || true
  sudo /usr/local/bin/docker compose down --remove-orphans
  sudo /usr/local/bin/docker compose up -d --build
  echo "✅ Container status:"
  sudo /usr/local/bin/docker compose ps
EOF

echo ""
echo "🚀 Deploy complete! Service is running on http://${REMOTE_HOST}:8888"
echo "   Health check: curl http://${REMOTE_HOST}:8888/health"

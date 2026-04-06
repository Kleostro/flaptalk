#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/var/www/flaptalk"
ENV_FILE="/etc/flaptalk/api.env"
COMPOSE_FILE="deploy/docker-compose.api.yml"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Environment file not found: $ENV_FILE" >&2
  exit 1
fi

cd "$APP_DIR"

echo "Pulling latest code..."
git pull

echo "Building API image..."
docker compose -f "$COMPOSE_FILE" build api

echo "Applying Prisma migrations..."
set -a
source "$ENV_FILE"
set +a
docker compose -f "$COMPOSE_FILE" run --rm api bunx prisma migrate deploy

echo "Restarting API container..."
docker compose -f "$COMPOSE_FILE" up -d api

echo "Deployment finished."

#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_APP_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

APP_DIR="${APP_DIR:-$DEFAULT_APP_DIR}"
ENV_FILE="${ENV_FILE:-/etc/flaptalk/api.env}"
COMPOSE_FILE="${COMPOSE_FILE:-${APP_DIR}/deploy/docker-compose.api.yml}"
API_IMAGE="${1:-${API_IMAGE:-}}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Environment file not found: $ENV_FILE" >&2
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Compose file not found: $COMPOSE_FILE" >&2
  exit 1
fi

if [[ -z "$API_IMAGE" ]]; then
  echo "API_IMAGE is required. Pass it as the first argument or environment variable." >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

if [[ -n "${GHCR_USERNAME:-}" && -n "${GHCR_TOKEN:-}" ]]; then
  echo "Logging in to GHCR..."
  printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin
fi

export API_IMAGE

echo "Pulling API image $API_IMAGE..."
docker compose -f "$COMPOSE_FILE" pull api

echo "Applying Prisma migrations..."
max_attempts=3
attempt=1

until docker compose -f "$COMPOSE_FILE" run --rm api sh -lc 'cd apps/api && bunx prisma migrate deploy'; do
  if [[ "$attempt" -ge "$max_attempts" ]]; then
    echo "Prisma migrations failed after ${max_attempts} attempts." >&2
    exit 1
  fi

  echo "Prisma migrations attempt ${attempt} failed. Retrying in 10 seconds..." >&2
  attempt=$((attempt + 1))
  sleep 10
done

echo "Restarting API container..."
docker compose -f "$COMPOSE_FILE" up -d api

echo "Pruning unused images..."
docker image prune -f

echo "Deployment finished."

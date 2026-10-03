#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$BACKEND_DIR/.env"
RETENTION_DAYS=14

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found" >&2
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

: "${DATABASE_PASSWORD:?DATABASE_PASSWORD missing in $ENV_FILE}"

BACKUP_DIR="${BACKUP_DIR:-$HOME/Data/backups/cinerat}"

export PGPASSWORD="$DATABASE_PASSWORD"
unset DATABASE_PASSWORD

mkdir -p "$BACKUP_DIR"

STAMP="$(date +%F)"
DEST="$BACKUP_DIR/$STAMP.sql"

pg_dump \
  --host="${DATABASE_HOST:-localhost}" \
  --port="${DATABASE_PORT:-5432}" \
  --username="$DATABASE_USER" \
  --format=plain \
  --no-owner \
  --file="$DEST" \
  "$DATABASE_NAME"

echo "Backup created: $DEST ($(du -h "$DEST" | cut -f1))"

find "$BACKUP_DIR" -maxdepth 1 -name '*.sql' -type f -mtime "+$RETENTION_DAYS" -print -delete
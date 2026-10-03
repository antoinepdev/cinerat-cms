#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$BACKEND_DIR/.env"
DEV_DB="dev_cineman"

SOURCE_FILE=""
CLEANUP_TMP=0

cleanup() {
  if [ "$CLEANUP_TMP" = "1" ] && [ -n "$SOURCE_FILE" ]; then
    rm -f "$SOURCE_FILE"
  fi
}
trap cleanup EXIT

if [ "${1:-}" = "--from-backup" ]; then
  SOURCE_FILE="${2:-}"
  if [ -z "$SOURCE_FILE" ]; then
    echo "Error: --from-backup requires a path" >&2
    exit 1
  fi
  if [ ! -f "$SOURCE_FILE" ]; then
    echo "Error: $SOURCE_FILE not found" >&2
    exit 1
  fi
fi

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

SRC_DB="$DATABASE_NAME"
HOST="${DATABASE_HOST:-localhost}"
PORT="${DATABASE_PORT:-5432}"
DB_USER="$DATABASE_USER"

PSQL=(psql --host="$HOST" --port="$PORT" --username="$DB_USER")

if [ -z "$SOURCE_FILE" ]; then
  mkdir -p "$BACKUP_DIR"
  SOURCE_FILE="$(mktemp "$BACKUP_DIR/.sync-XXXXXX.sql")"
  CLEANUP_TMP=1
  echo "Dumping $SRC_DB..."
  pg_dump \
    --host="$HOST" \
    --port="$PORT" \
    --username="$DB_USER" \
    --format=plain \
    --no-owner \
    --file="$SOURCE_FILE" \
    "$SRC_DB"
else
  echo "Using existing dump: $SOURCE_FILE"
fi

echo "Recreating $DEV_DB..."
dropdb --host="$HOST" --port="$PORT" --username="$DB_USER" --if-exists --force "$DEV_DB"
createdb --host="$HOST" --port="$PORT" --username="$DB_USER" "$DEV_DB"

echo "Restoring into $DEV_DB..."
"${PSQL[@]}" --dbname="$DEV_DB" --quiet --no-psqlrc --output=/dev/null \
  --set=ON_ERROR_STOP=1 \
  --file="$SOURCE_FILE"

echo "Verifying..."
STATUS=0
for TABLE in movies incoming_videos; do
  SRC_COUNT="$("${PSQL[@]}" --dbname="$SRC_DB" --tuples-only --no-align --quiet \
    --command="SELECT count(*) FROM $TABLE;")"
  DST_COUNT="$("${PSQL[@]}" --dbname="$DEV_DB" --tuples-only --no-align --quiet \
    --command="SELECT count(*) FROM $TABLE;")"

  if [ "$SRC_COUNT" = "$DST_COUNT" ]; then
    echo "  OK   $TABLE: $SRC_COUNT rows"
  else
    echo "  FAIL  $TABLE: prod=$SRC_COUNT dev=$DST_COUNT" >&2
    STATUS=1
  fi
done

if [ "$STATUS" -ne 0 ]; then
  echo "The copy does NOT match production" >&2
  exit 1
fi

echo "Done: $DEV_DB is a copy of $SRC_DB"
#!/bin/bash
set -e

DATA_DIR="/app/data"
DB_PATH="$DATA_DIR/sts2.db"
IMAGES_DIR="$DATA_DIR/images"

# Ensure data directory exists
mkdir -p "$DATA_DIR"

# Symlink so the app finds files at expected paths
ln -sf "$DB_PATH" /app/sts2.db
ln -sfn "$IMAGES_DIR" /app/public/images
mkdir -p /app/public

# Force reseed if --reseed flag is passed
if [ "${1:-}" = "--reseed" ]; then
  echo "=== Force re-seed requested ==="
  rm -f "$DB_PATH"
  rm -rf "$IMAGES_DIR"
  shift
fi

# Seed only if DB doesn't exist yet
if [ ! -f "$DB_PATH" ]; then
  echo "=== First run: seeding database and downloading images ==="
  echo "This may take a few minutes..."

  # Ensure images dir exists for seed
  mkdir -p "$IMAGES_DIR/cards" "$IMAGES_DIR/characters" "$IMAGES_DIR/relics"

  # Create symlinks before seed so files land in the right place
  ln -sfn "$IMAGES_DIR" /app/public/images

  bun run src/server/db/seed.ts

  # Move DB to data dir if seed created it at default path
  if [ -f /app/sts2.db ] && [ ! -L /app/sts2.db ]; then
    mv /app/sts2.db "$DB_PATH"
    ln -sf "$DB_PATH" /app/sts2.db
  fi

  echo "=== Seed complete ==="
else
  echo "Database found at $DB_PATH — skipping seed."
fi

echo "Starting STS2 Deck Builder..."
exec bun run index.ts

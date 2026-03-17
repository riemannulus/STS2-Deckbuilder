#!/usr/bin/env bash
set -euo pipefail

echo "=== Re-seeding STS2 Database ==="
echo "This will fetch fresh data from spire-codex.com"
echo ""

# Remove existing images to force re-download
rm -rf public/images

# Run seed
bun run src/server/db/seed.ts

echo ""
echo "=== Re-seed complete! ==="
echo "Restart the server to use the updated data."

#!/usr/bin/env bash
set -euo pipefail

echo "=== STS2 Deck Builder Setup ==="
echo ""

# Check bun is installed
if ! command -v bun &> /dev/null; then
  echo "Error: bun is not installed. Install it from https://bun.sh"
  exit 1
fi

echo "1. Installing dependencies..."
bun install

echo ""
echo "2. Seeding database (fetching card data + downloading images)..."
echo "   This may take a few minutes on first run."
bun run src/server/db/seed.ts

echo ""
echo "3. Running tests..."
bun test

echo ""
echo "=== Setup complete! ==="
echo ""
echo "To start the development server:"
echo "  bun --hot index.ts"
echo ""
echo "To start in production mode:"
echo "  bun run index.ts"
echo ""
echo "To run with Docker:"
echo "  docker compose up --build"
echo ""
echo "The app will be available at http://localhost:3000"

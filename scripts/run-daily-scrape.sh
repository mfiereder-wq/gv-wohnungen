#!/bin/bash
# GV Wohnungen – Daily scrape wrapper
# Set DATABASE_URL in environment or .env file
# Usage: ./scripts/run-daily-scrape.sh

set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

# Load .env if exists
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set."
  echo "Set it in .env or export DATABASE_URL=postgresql://..."
  exit 1
fi

echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Starting daily Flatfox scrape …"
npx tsx scripts/daily-scrape.ts 2>&1
echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Scrape finished (exit: $?)"
#!/usr/bin/env bash
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL is missing"
  exit 1
fi

if [ -z "${DIRECT_URL:-}" ]; then
  echo "ℹ️ DIRECT_URL is missing -> fallback to DATABASE_URL"
  echo "DIRECT_URL=${DATABASE_URL}" >> "$GITHUB_ENV"
fi

echo "✅ Prisma env ready (DATABASE_URL + DIRECT_URL)"

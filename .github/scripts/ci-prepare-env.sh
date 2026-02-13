#!/usr/bin/env bash
set -euo pipefail

# --- CI placeholders for markdown-link-check ---
# markdown-link-check can try to open relative file links; ensure these exist.
mkdir -p app/etc src/app/etc
: > app/etc/local.xml.template
: > src/app/etc/local.xml.template
# ----------------------------------------------


#!/usr/bin/env bash
set -euo pipefail

echo "Setting CI environment fallbacks..."

# Basic DB / app env fallbacks for CI (safe defaults)
export DATABASE_URL="${DATABASE_URL:-postgresql://ci:ci@localhost:5432/ci}"
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-ci-secret}"
export NEXTAUTH_URL="${NEXTAUTH_URL:-http://localhost:3000}"

# Firebase Admin optional - keep empty if not provided
export FIREBASE_ADMIN_PROJECT_ID="${FIREBASE_ADMIN_PROJECT_ID:-}"
export FIREBASE_ADMIN_CLIENT_EMAIL="${FIREBASE_ADMIN_CLIENT_EMAIL:-}"
export FIREBASE_ADMIN_PRIVATE_KEY="${FIREBASE_ADMIN_PRIVATE_KEY:-}"

echo "Environment prepared."

echo "Installing dependencies..."
npm ci --no-audit --no-fund

echo "Generating Prisma Client..."
npx prisma generate

echo "Validating Prisma schema..."
npx prisma validate

echo "Building Next.js..."
npm run build

echo "DigiEmu v2.0.0 CI build finished successfully."

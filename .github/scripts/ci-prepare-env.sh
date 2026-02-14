#!/usr/bin/env bash
set -euo pipefail

echo "Setting CI environment fallbacks..."

# --- Prisma / DB (required because postinstall runs prisma generate) ---
DATABASE_FALLBACK="postgresql://ci:ci@127.0.0.1:5432/ci?schema=public"

export DATABASE_URL="${DATABASE_URL:-$DATABASE_FALLBACK}"
export DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"

# --- NextAuth ---
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-ci-secret}"
export NEXTAUTH_URL="${NEXTAUTH_URL:-http://localhost:3000}"

# --- Optional secrets (keep empty if not provided) ---
export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-}"
export STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-}"

export FIREBASE_ADMIN_PROJECT_ID="${FIREBASE_ADMIN_PROJECT_ID:-}"
export FIREBASE_ADMIN_CLIENT_EMAIL="${FIREBASE_ADMIN_CLIENT_EMAIL:-}"
export FIREBASE_ADMIN_PRIVATE_KEY="${FIREBASE_ADMIN_PRIVATE_KEY:-}"

# --- Persist to GitHub Actions environment for subsequent steps ---
if [ -n "${GITHUB_ENV:-}" ]; then
  {
    echo "DATABASE_URL=$DATABASE_URL"
    echo "DIRECT_URL=$DIRECT_URL"
    echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
    echo "NEXTAUTH_URL=$NEXTAUTH_URL"

    echo "STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY"
    echo "STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET"

    echo "FIREBASE_ADMIN_PROJECT_ID=$FIREBASE_ADMIN_PROJECT_ID"
    echo "FIREBASE_ADMIN_CLIENT_EMAIL=$FIREBASE_ADMIN_CLIENT_EMAIL"
    echo "FIREBASE_ADMIN_PRIVATE_KEY=$FIREBASE_ADMIN_PRIVATE_KEY"
  } >> "$GITHUB_ENV"
fi

echo "Environment prepared."

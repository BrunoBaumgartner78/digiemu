#!/usr/bin/env bash
set -euo pipefail

# --- CI Prisma env fallback (required because postinstall runs prisma generate) ---
if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="postgresql://ci:ci@127.0.0.1:5432/ci?schema=public"
  echo "DATABASE_URL=postgresql://ci:ci@127.0.0.1:5432/ci?schema=public" >> "$GITHUB_ENV"
fi

if [ -z "${DIRECT_URL:-}" ]; then
  export DIRECT_URL="postgresql://ci:ci@127.0.0.1:5432/ci?schema=public"
  echo "DIRECT_URL=postgresql://ci:ci@127.0.0.1:5432/ci?schema=public" >> "$GITHUB_ENV"
fi

exit 0
#!/usr/bin/env bash
set -euo pipefail

echo "Setting CI environment fallbacks..."

# DB fallback (CI-safe)
export DATABASE_URL="${DATABASE_URL:-postgresql://ci:ci@localhost:5432/ci?schema=public}"
export DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"

# NextAuth fallbacks
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-ci-secret}"
export NEXTAUTH_URL="${NEXTAUTH_URL:-http://localhost:3000}"

# Optional: Stripe (leave empty if not provided)
export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-}"
export STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-}"

# Firebase Admin optional - keep empty if not provided
export FIREBASE_ADMIN_PROJECT_ID="${FIREBASE_ADMIN_PROJECT_ID:-}"
export FIREBASE_ADMIN_CLIENT_EMAIL="${FIREBASE_ADMIN_CLIENT_EMAIL:-}"
export FIREBASE_ADMIN_PRIVATE_KEY="${FIREBASE_ADMIN_PRIVATE_KEY:-}"

echo "Environment prepared."

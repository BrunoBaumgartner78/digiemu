#!/usr/bin/env bash
set -euo pipefail

export DATABASE_URL="${DATABASE_URL:-postgresql://ci:ci@localhost:5432/ci}"
export DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"

export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-ci-secret}"
export NEXTAUTH_URL="${NEXTAUTH_URL:-http://localhost:3000}"

export FIREBASE_ADMIN_PROJECT_ID="${FIREBASE_ADMIN_PROJECT_ID:-ci-dummy}"
export FIREBASE_ADMIN_CLIENT_EMAIL="${FIREBASE_ADMIN_CLIENT_EMAIL:-ci@ci-dummy.iam.gserviceaccount.com}"

if [ -z "${FIREBASE_ADMIN_PRIVATE_KEY:-}" ]; then
  export FIREBASE_ADMIN_PRIVATE_KEY=$'-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDk\nciDummyKeyciDummyKeyciDummyKeyciDummyKeyciDummyKey\n-----END PRIVATE KEY-----\n'
fi

echo "CI env prepared."

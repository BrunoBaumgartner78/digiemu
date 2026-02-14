#!/usr/bin/env bash
set -euo pipefail

echo "🔎 searching for common dead links..."

# tracked markdown files
MD_FILES="$(git ls-files '*.md' '*.mdx' | grep -v '^node_modules/' || true)"
if [[ -n "${MD_FILES}" ]]; then
  echo "MD files: $(echo "${MD_FILES}" | wc -l | tr -d ' ')"
else
  echo "MD files: 0"
fi

# Regex (no YAML involved here) — \047 is a single quote '
PROFILE_REGEX=$'href[[:space:]]*=[[:space:]]*(\\{[[:space:]]*)?["\\047]/profile["\\047]([[:space:]]*\\})?'
DOWNLOADS_REGEX=$'href[[:space:]]*=[[:space:]]*(\\{[[:space:]]*)?["\\047]/downloads["\\047]([[:space:]]*\\})?'

scan_tree () {
  local path="$1"

  # 1) fail if /profile appears in source (should be /account/profile)
  if grep -RIn --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' -E "${PROFILE_REGEX}" "${path}"; then
    echo "❌ Found /profile link. Use /account/profile instead."
    exit 1
  fi

  # 2) fail if /downloads appears in source (should be /account/downloads)
  if grep -RIn --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' -E "${DOWNLOADS_REGEX}" "${path}"; then
    echo "❌ Found /downloads link. Use /account/downloads instead."
    exit 1
  fi
}

scan_markdown () {
  if [[ -z "${MD_FILES}" ]]; then
    return 0
  fi

  # xargs: only run if files exist
  if echo "${MD_FILES}" | xargs -r grep -nE "${PROFILE_REGEX}"; then
    echo "❌ Found /profile link in markdown. Use /account/profile instead."
    exit 1
  fi

  if echo "${MD_FILES}" | xargs -r grep -nE "${DOWNLOADS_REGEX}"; then
    echo "❌ Found /downloads link in markdown. Use /account/downloads instead."
    exit 1
  fi
}

# run scans
scan_tree "src"
scan_markdown

echo "✅ No forbidden /profile or /downloads links found."

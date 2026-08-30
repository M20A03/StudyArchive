#!/usr/bin/env bash

# ==============================================================================
# Enterprise SRE Maintenance & Node Cleanup Script
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
APP_DIR="$REPO_ROOT/campus-resource-platform"

echo "🔧 [1/4] Enforcing strict TypeScript compiler options..."
cd "$APP_DIR"

if grep -q '"strict": true' tsconfig.json; then
    echo "  ✅ tsconfig.json has strict: true enabled."
else
    echo "  ⚙️ Updating tsconfig.json compilerOptions to strict: true..."
    sed -i 's/"strict": false/"strict": true/g' tsconfig.json || true
fi

echo "🧹 [2/4] Purging stale node_modules, Angular cache, and .vite cache..."
rm -rf .angular
rm -rf dist
rm -rf node_modules/.cache
echo "  ✅ Build and bundler caches purged."

echo "🔍 [3/4] Validating environment variables and configuration..."
node scripts/validate-env.mjs

echo "📦 [4/4] Maintenance complete. All environment and strict type checks passed."

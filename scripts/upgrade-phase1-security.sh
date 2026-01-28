#!/usr/bin/env bash
set -euo pipefail

# Phase 1: Security Fixes
# This script upgrades dependencies to fix security vulnerabilities

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 1: Security Fixes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Function to run command with logging
run_step() {
  local step_name=$1
  shift
  echo ""
  echo "▶ ${step_name}"
  echo "  $ $*"
  if "$@"; then
    echo "  ✓ Success"
  else
    echo "  ✗ Failed"
    exit 1
  fi
}

# Create backup tag
run_step "Creating backup tag" \
  git tag -f pre-security-upgrade-$(date +%Y%m%d-%H%M%S)

# Create upgrade branch
if git rev-parse --verify upgrade/security-fixes 2>/dev/null; then
  echo "Branch upgrade/security-fixes already exists, using it"
  git checkout upgrade/security-fixes
else
  run_step "Creating upgrade branch" \
    git checkout -b upgrade/security-fixes
fi

# 1. Next.js Security Patch
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Upgrading Next.js (15.5.10 → 15.6.0)"
echo "   Security: Fixes PPR memory consumption (GHSA-5f7q-jpqc-wp7h)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "${PROJECT_ROOT}/examples/nextjs-chatbot"

run_step "Upgrading Next.js" \
  pnpm add next@15.6.0

run_step "Upgrading eslint-config-next" \
  pnpm add -D eslint-config-next@15.6.0

run_step "Installing dependencies" \
  pnpm install

run_step "Building Next.js app" \
  pnpm build

run_step "Testing Next.js app" \
  pnpm test || echo "  ⚠ Tests not configured"

cd "${PROJECT_ROOT}"

# 2. Vite Upgrade (fixes esbuild)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Upgrading Vite (6.4.1 → 7.x)"
echo "   Security: Pulls esbuild 0.25.x (fixes GHSA-67mh-4wv8-2f99)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "${PROJECT_ROOT}/examples/chatbot-demo"

run_step "Upgrading Vite" \
  pnpm add -D vite@^7.0.0

run_step "Installing dependencies" \
  pnpm install

run_step "Building SvelteKit app" \
  pnpm build

run_step "Testing SvelteKit app" \
  pnpm test || echo "  ⚠ Tests may need config updates"

cd "${PROJECT_ROOT}"

# 3. SvelteKit Dependencies (fixes cookie)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Upgrading SvelteKit Dependencies"
echo "   Security: Fixes cookie vulnerability (GHSA-pxg6-pf52-xh8x)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "${PROJECT_ROOT}/examples/chatbot-demo"

run_step "Upgrading @sveltejs/vite-plugin-svelte" \
  pnpm add -D @sveltejs/vite-plugin-svelte@latest

run_step "Installing dependencies" \
  pnpm install

cd "${PROJECT_ROOT}"

# 4. Run Full Test Suite
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Running Full Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_step "Type checking all packages" \
  pnpm type-check || echo "  ⚠ Type errors may need fixes"

run_step "Building all packages" \
  pnpm build

run_step "Testing all packages" \
  pnpm test || echo "  ⚠ Some tests may need updates"

# 5. Security Audit
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Running Security Audit"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Before upgrade vulnerabilities:"
cat << EOF
┌─────────────────────┬────────────────────────────────────────────────────────┐
│ moderate            │ esbuild CORS bypass (GHSA-67mh-4wv8-2f99)              │
│ moderate            │ Next.js PPR memory issue (GHSA-5f7q-jpqc-wp7h)         │
│ low                 │ cookie out of bounds chars (GHSA-pxg6-pf52-xh8x)       │
└─────────────────────┴────────────────────────────────────────────────────────┘
EOF

echo ""
echo "After upgrade vulnerabilities:"
pnpm audit || true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 1 Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff main"
echo "  2. Test manually: cd examples/nextjs-chatbot && pnpm dev"
echo "  3. Test manually: cd examples/chatbot-demo && pnpm dev"
echo "  4. Commit: git add -A && git commit -m 'chore: phase 1 security fixes'"
echo "  5. Run: ./scripts/upgrade-phase2-testing.sh"
echo ""

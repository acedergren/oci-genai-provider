#!/usr/bin/env bash
set -euo pipefail

# Upgrade Rollback Script
# Safely rollback dependency upgrades to previous state

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

show_usage() {
  cat << EOF
Usage: $0 [OPTIONS]

Rollback dependency upgrades to a previous state.

OPTIONS:
  -t, --tag TAG         Rollback to specific git tag
  -p, --phase PHASE     Rollback to phase completion tag (1-5)
  -l, --list            List available rollback points
  -f, --force           Force rollback without confirmation
  -h, --help            Show this help message

EXAMPLES:
  $0 --list                    # List available rollback points
  $0 --phase 1                 # Rollback to Phase 1 completion
  $0 --tag pre-upgrade-baseline  # Rollback to specific tag

ROLLBACK POINTS:
  Phase 1: Security Fixes (Next.js, Vite, esbuild)
  Phase 2: Testing Frameworks (Jest, Vitest)
  Phase 3: Developer Tools (ESLint, Svelte)
  Phase 4: Core Dependencies (Zod, OpenAI)
  Phase 5: Minor Updates

EOF
  exit 1
}

list_rollback_points() {
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Available Rollback Points"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  echo "Upgrade Phase Tags:"
  git tag -l "upgrade-phase*-complete" | while read -r tag; do
    commit_date=$(git log -1 --format=%ai "$tag" 2>/dev/null || echo "unknown")
    echo "  • $tag ($commit_date)"
  done
  echo ""

  echo "Backup Tags:"
  git tag -l "pre-upgrade-*" | head -n 5 | while read -r tag; do
    commit_date=$(git log -1 --format=%ai "$tag" 2>/dev/null || echo "unknown")
    echo "  • $tag ($commit_date)"
  done
  echo ""

  echo "Current Branch:"
  echo "  • $(git branch --show-current)"
  echo ""

  exit 0
}

confirm_rollback() {
  local target=$1
  local current_branch=$(git branch --show-current)

  echo ""
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}⚠  ROLLBACK CONFIRMATION${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Current state:"
  echo "  Branch: $current_branch"
  echo "  Commit: $(git rev-parse --short HEAD)"
  echo ""
  echo "Rollback to:"
  echo "  Target: $target"
  echo "  Commit: $(git rev-parse --short "$target")"
  echo ""
  echo -e "${RED}WARNING: This will discard all uncommitted changes!${NC}"
  echo ""
  read -p "Continue with rollback? (yes/no): " -r
  echo ""

  if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Rollback cancelled."
    exit 0
  fi
}

perform_rollback() {
  local target=$1
  local force=${2:-false}

  # Verify target exists
  if ! git rev-parse "$target" >/dev/null 2>&1; then
    echo -e "${RED}Error: Target '$target' not found${NC}"
    exit 1
  fi

  # Confirm unless forced
  if [ "$force" != "true" ]; then
    confirm_rollback "$target"
  fi

  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}Performing Rollback${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  # Step 1: Create emergency backup
  echo ""
  echo "▶ Creating emergency backup..."
  emergency_tag="emergency-backup-$(date +%Y%m%d-%H%M%S)"
  git tag "$emergency_tag"
  echo "  ✓ Tagged current state as: $emergency_tag"

  # Step 2: Stash uncommitted changes
  echo ""
  echo "▶ Stashing uncommitted changes..."
  if git diff --quiet && git diff --cached --quiet; then
    echo "  ℹ No uncommitted changes to stash"
  else
    git stash save "Rollback stash from $(date)"
    echo "  ✓ Changes stashed"
  fi

  # Step 3: Reset to target
  echo ""
  echo "▶ Resetting to target: $target"
  git reset --hard "$target"
  echo "  ✓ Reset complete"

  # Step 4: Clean node_modules
  echo ""
  echo "▶ Cleaning node_modules..."
  rm -rf node_modules
  find . -type d -name "node_modules" -prune -exec rm -rf {} +
  echo "  ✓ node_modules cleaned"

  # Step 5: Reinstall dependencies
  echo ""
  echo "▶ Reinstalling dependencies from lock file..."
  pnpm install --frozen-lockfile
  echo "  ✓ Dependencies installed"

  # Step 6: Rebuild
  echo ""
  echo "▶ Rebuilding packages..."
  pnpm build
  echo "  ✓ Build complete"

  # Step 7: Run tests
  echo ""
  echo "▶ Running test suite..."
  if pnpm test; then
    echo "  ✓ Tests passing"
  else
    echo -e "  ${YELLOW}⚠ Some tests failing (expected if rolling back from partial upgrade)${NC}"
  fi

  # Step 8: Summary
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✓ Rollback Complete${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Current state:"
  echo "  Commit: $(git rev-parse --short HEAD)"
  echo "  Branch: $(git branch --show-current)"
  echo ""
  echo "Emergency backup saved as: $emergency_tag"
  echo ""
  echo "To restore stashed changes:"
  echo "  $ git stash list"
  echo "  $ git stash pop"
  echo ""
  echo "To remove emergency backup tag:"
  echo "  $ git tag -d $emergency_tag"
  echo ""
}

# Parse arguments
ROLLBACK_TARGET=""
FORCE_ROLLBACK=false

while [[ $# -gt 0 ]]; do
  case $1 in
    -t|--tag)
      ROLLBACK_TARGET="$2"
      shift 2
      ;;
    -p|--phase)
      ROLLBACK_TARGET="upgrade-phase$2-complete"
      shift 2
      ;;
    -l|--list)
      list_rollback_points
      ;;
    -f|--force)
      FORCE_ROLLBACK=true
      shift
      ;;
    -h|--help)
      show_usage
      ;;
    *)
      echo -e "${RED}Error: Unknown option: $1${NC}"
      show_usage
      ;;
  esac
done

# Require target
if [ -z "$ROLLBACK_TARGET" ]; then
  echo -e "${RED}Error: No rollback target specified${NC}"
  echo ""
  show_usage
fi

# Perform rollback
perform_rollback "$ROLLBACK_TARGET" "$FORCE_ROLLBACK"
